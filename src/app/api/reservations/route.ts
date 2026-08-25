import { NextRequest } from 'next/server';

import { contact } from '@/data/site';
import { tarifDuSoin } from '@/lib/catalogue';
import { adminDb, adminReady, bearerToken, verifyIdToken } from '@/lib/firebase/admin';
import { creneauValide } from '@/lib/creneaux';
import { creneauLibreDansTransaction, heuresOccupees } from '@/lib/occupation';
import { referenceRdv } from '@/lib/utils';
import {
  contientDonneeBancaire,
  emailValide,
  nettoyer,
  nettoyerMultiligne,
  telValide,
} from '@/lib/validation';

// =====================================================================
//  POST /api/reservations — création d'un rendez-vous.
//
//  C'EST LE SEUL CHEMIN qui écrit dans la collection `reservations`. Les
//  règles Firestore posent `allow create: if false` pour tout le monde ;
//  seul l'Admin SDK, qui les contourne, passe par ici.
//
//  Pourquoi ce détour au lieu d'écrire depuis le navigateur :
//
//   1. LE PRIX. Le client envoie un `serviceId` et un `lieu`, jamais un
//      montant. Le tarif est relu depuis le catalogue serveur. Si le
//      montant voyageait depuis le navigateur, on réserverait à 0 DH.
//
//   2. LE CRÉNEAU. `creneauValide()` revérifie le jour d'ouverture,
//      l'horaire, la fin avant fermeture, le délai minimum et l'horizon.
//      Masquer un bouton dans le calendrier n'empêche personne d'envoyer
//      la requête à la main.
//
//   3. LES DONNÉES BANCAIRES. On refuse la requête entière si elle
//      contient un champ de carte, même par accident. C'est le troisième
//      garde-fou après le formulaire et les règles Firestore.
//
//   4. LE CRÉNEAU EST-IL LIBRE. Vérifié DANS UNE TRANSACTION, juste
//      avant d'écrire. Sans transaction, deux requêtes simultanées
//      liraient toutes les deux « c'est libre » avant que l'une n'écrive :
//      le contrôle passerait, et on aurait quand même deux rendez-vous à
//      la même heure.
//
//  La réservation naît en « en-attente » : c'est un être humain qui
//  confirme, depuis le back-office.
// =====================================================================

/** Limitation de débit, en mémoire. */
const RECENTS = new Map<string, number[]>();
const FENETRE_MS = 10 * 60 * 1000;
const MAX_PAR_FENETRE = 5;

/**
 * Freine les envois répétés depuis une même adresse.
 *
 * ⚠️  LIMITE CONNUE : ce compteur vit dans la mémoire du processus. Sur
 *     Vercel, chaque instance a le sien, et il est vidé à chaque
 *     redémarrage. C'est un ralentisseur, pas une serrure. Pour une vraie
 *     protection il faut App Check (côté Firebase) ou un compteur partagé.
 *     Voir SECURITY.md.
 */
function tropDeRequetes(ip: string): boolean {
  const maintenant = Date.now();
  const precedents = (RECENTS.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS);

  if (precedents.length >= MAX_PAR_FENETRE) {
    RECENTS.set(ip, precedents);
    return true;
  }

  precedents.push(maintenant);
  RECENTS.set(ip, precedents);

  // Purge : sans elle, la table grossit indéfiniment sur un processus
  // qui vit longtemps.
  if (RECENTS.size > 5000) {
    for (const [cle, valeurs] of RECENTS) {
      if (valeurs.every((t) => maintenant - t >= FENETRE_MS)) RECENTS.delete(cle);
    }
  }

  return false;
}

function ipDe(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'inconnue'
  );
}

export async function POST(request: NextRequest) {
  if (!adminReady) {
    return Response.json(
      {
        error:
          'Les réservations en ligne ne sont pas encore actives. ' +
          `Appelez-nous au ${contact.phone}.`,
      },
      { status: 503 },
    );
  }

  if (tropDeRequetes(ipDe(request))) {
    return Response.json(
      { error: 'Trop de demandes envoyées. Patientez quelques minutes.' },
      { status: 429 },
    );
  }

  // --- Lecture du corps ---------------------------------------------------
  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  // --- Garde-fou bancaire -------------------------------------------------
  const client = (corps.client ?? {}) as Record<string, unknown>;
  if (contientDonneeBancaire(corps) || contientDonneeBancaire(client)) {
    return Response.json(
      {
        error:
          'Aucune donnée bancaire ne doit être envoyée : le paiement se fait sur place, ' +
          'après le soin.',
      },
      { status: 400 },
    );
  }

  // --- Champs obligatoires ------------------------------------------------
  const serviceId = nettoyer(corps.serviceId, 80);
  const lieu = corps.lieu === 'domicile' ? 'domicile' : 'institut';
  const date = nettoyer(corps.date, 10);
  const creneau = nettoyer(corps.creneau, 5);

  const prenom = nettoyer(client.prenom, 60);
  const nom = nettoyer(client.nom, 60);
  const email = nettoyer(client.email, 254).toLowerCase();
  const telephone = nettoyer(client.telephone, 24);

  if (!serviceId) return Response.json({ error: 'Soin manquant.' }, { status: 400 });
  if (!prenom || !nom) return Response.json({ error: 'Nom manquant.' }, { status: 400 });
  if (!emailValide(email)) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (!telValide(telephone)) {
    return Response.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
  }

  // --- LE PRIX, recalculé côté serveur -------------------------------------
  const tarif = await tarifDuSoin(serviceId, lieu);
  if (!tarif) {
    return Response.json(
      { error: 'Ce soin n’existe pas, ou n’est pas proposé à cet endroit.' },
      { status: 400 },
    );
  }

  const { service, total } = tarif;

  // --- LE CRÉNEAU, revalidé côté serveur ------------------------------------
  const debut = creneauValide(date, creneau, service.duree);
  if (!debut) {
    return Response.json(
      { error: 'Ce créneau n’est pas disponible. Choisissez-en un autre.' },
      { status: 400 },
    );
  }
  const fin = new Date(debut.getTime() + service.duree * 60_000);

  // --- L'adresse est obligatoire pour un soin à domicile ---------------------
  const adresseSoin = nettoyer(corps.adresseSoin, 400);
  if (lieu === 'domicile' && adresseSoin.length < 6) {
    return Response.json(
      { error: 'Une adresse est nécessaire pour un soin à domicile.' },
      { status: 400 },
    );
  }

  // Adresse POSTALE de facturation. Le nom du champ ne doit tromper
  // personne : aucun moyen de paiement n'est stocké nulle part.
  const adresseFacturation = nettoyer(corps.adresseFacturation, 400);

  // --- Session, si la personne est connectée ---------------------------------
  // La réservation reste possible SANS compte : exiger une inscription
  // pour prendre rendez-vous fait perdre une partie des clientes.
  let userId: string | null = null;
  const token = bearerToken(request);
  if (token) {
    try {
      const decoded = await verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      // Jeton expiré : on continue en visiteur plutôt que de perdre la
      // réservation. Le rendez-vous ne sera simplement pas rattaché.
      userId = null;
    }
  }

  // --- Écriture -------------------------------------------------------------
  try {
    const reference = referenceRdv();

    const document = {
      reference,
      userId,
      serviceId: service.id,
      serviceNom: service.nom,
      serviceSlug: service.slug,
      duree: service.duree,
      lieu,
      prix: service.prix,
      supplementDomicile: lieu === 'domicile' ? service.supplementDomicile : 0,
      total,
      startAt: debut,
      endAt: fin,
      status: 'en-attente' as const,
      client: { prenom, nom, email, telephone },
      adresseSoin: lieu === 'domicile' ? adresseSoin : null,
      adresseFacturation: adresseFacturation || null,
      notes: nettoyerMultiligne(corps.notes, 1000),
      createdAt: new Date(),
      cancelledAt: null,
    };

    // Le contrôle de disponibilité et l'écriture sont dans la MÊME
    // transaction. C'est ce qui rend impossible la double réservation :
    // deux requêtes concurrentes ne peuvent pas conclure toutes les deux
    // que le créneau est libre.
    const ref = adminDb().collection('reservations').doc();

    const libre = await adminDb().runTransaction(async (tx) => {
      if (!(await creneauLibreDansTransaction(tx, debut, fin))) return false;
      tx.set(ref, document);
      return true;
    });

    if (!libre) {
      // 409 et non 400 : la requête était valide, c'est l'état du monde
      // qui a changé entre l'affichage du calendrier et l'envoi.
      return Response.json(
        {
          error:
            'Ce créneau vient d’être réservé. Choisissez un autre horaire — ' +
            'le calendrier est à jour.',
          code: 'creneau-pris',
        },
        { status: 409 },
      );
    }

    // TODO — voir PROGRESS.md §11 : aucun e-mail n'est envoyé, ni à la
    // cliente ni à l'institut. Tant que ce n'est pas branché, une
    // réservation n'existe QUE dans le back-office : quelqu'un doit y
    // regarder. C'est la fuite la plus coûteuse du site en l'état.

    return Response.json({ id: ref.id, reference, total }, { status: 201 });
  } catch {
    // Le détail de l'erreur reste dans les journaux du serveur : il peut
    // contenir des noms de collections et des chemins internes.
    return Response.json(
      { error: 'La réservation n’a pas pu être enregistrée. Réessayez.' },
      { status: 500 },
    );
  }
}

// =====================================================================
//  GET /api/reservations?date=2026-08-27&duree=60
//
//  Heures qu'on ne peut pas proposer ce jour-là. Alimente le calendrier
//  pour qu'il grise les créneaux pris AVANT que la cliente remplisse tout
//  le formulaire.
//
//  Publique et sans authentification : le calendrier s'affiche avant
//  toute connexion. Elle ne renvoie donc QUE des heures — jamais un nom,
//  un téléphone, un montant ni un identifiant. Savoir que « 15 h est
//  pris » n'apprend rien sur qui l'a pris.
// =====================================================================

export async function GET(request: NextRequest) {
  if (!adminReady) {
    // Sans Admin SDK on ne sait rien : on ne bloque rien plutôt que de
    // faire croire à tort que la journée est complète.
    return Response.json({ occupees: [] });
  }

  const params = request.nextUrl.searchParams;
  const date = nettoyer(params.get('date'), 10);
  const duree = Number(params.get('duree'));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'Date attendue au format AAAA-MM-JJ.' }, { status: 400 });
  }
  if (!Number.isFinite(duree) || duree < 15 || duree > 600) {
    return Response.json({ error: 'Durée invalide.' }, { status: 400 });
  }

  const [a, m, j] = date.split('-').map(Number);
  const jour = new Date(a, m - 1, j);
  if (Number.isNaN(jour.getTime())) {
    return Response.json({ error: 'Date invalide.' }, { status: 400 });
  }

  try {
    return Response.json({ occupees: await heuresOccupees(jour, duree) });
  } catch {
    // En cas de panne on n'invente pas d'indisponibilité : la
    // transaction refusera de toute façon un créneau réellement pris.
    return Response.json({ occupees: [] });
  }
}
