import { NextRequest } from 'next/server';

import { adminDb, requireAdmin } from '@/lib/firebase/admin';
import { cleJourLocale, partiesLocales } from '@/lib/fuseau';
import { cleJour } from '@/lib/utils';

// =====================================================================
//  GET /api/admin/apercu — chiffres du tableau de bord.
//
//  Tout est calculé CÔTÉ SERVEUR, après vérification du claim `admin`
//  dans le jeton signé par Firebase. Le navigateur ne reçoit que des
//  agrégats : jamais la liste brute des clientes.
//
//  Fenêtre volontairement limitée à 180 jours. Sans borne, la requête
//  grossit indéfiniment et finit par coûter cher en lectures Firestore
//  pour afficher un graphique que personne ne lit au-delà de six mois.
// =====================================================================

const JOURS_HISTORIQUE = 180;

export async function GET(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  try {
    const db = adminDb();
    const maintenant = new Date();

    const depuis = new Date(maintenant);
    depuis.setDate(depuis.getDate() - JOURS_HISTORIQUE);

    const [snapReservations, snapMessages, snapClients] = await Promise.all([
      db.collection('reservations').where('startAt', '>=', depuis).get(),
      db.collection('messages').where('status', '==', 'nouveau').get(),
      db.collection('users').count().get(),
    ]);

    type Ligne = {
      status: string;
      total: number;
      startAt: Date | null;
      creeLe: Date | null;
      serviceNom: string;
      lieu: string;
      cliente: string;
    };

    const enDate = (v: unknown): Date | null => {
      const b = v as { toDate?: () => Date } | undefined;
      return b?.toDate ? b.toDate() : null;
    };

    const lignes: Ligne[] = snapReservations.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      const client = (v.client as Record<string, unknown>) ?? {};
      return {
        status: (v.status as string) ?? 'en-attente',
        total: typeof v.total === 'number' ? v.total : 0,
        startAt: enDate(v.startAt),
        creeLe: enDate(v.createdAt),
        serviceNom: (v.serviceNom as string) ?? 'Soin',
        lieu: (v.lieu as string) ?? 'institut',
        cliente: [client.prenom, client.nom].filter(Boolean).join(' ').trim(),
      };
    });

    // --- Compteurs par statut ---
    const parStatut = lignes.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {});

    // --- Chiffre d'affaires ---
    // Seuls les rendez-vous TERMINÉS comptent. Un rendez-vous « confirmé »
    // n'a pas encore été payé : l'inclure gonflerait le chiffre et
    // donnerait une image fausse de la trésorerie.
    const encaisse = lignes
      .filter((l) => l.status === 'terminee')
      .reduce((somme, l) => somme + l.total, 0);

    const aVenir = lignes.filter(
      (l) => l.startAt && l.startAt > maintenant && l.status !== 'annulee',
    );

    const attendu = aVenir.reduce((somme, l) => somme + l.total, 0);

    // --- Série des 30 derniers jours ---
    const serie: { jour: string; nombre: number; montant: number }[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const j = new Date(maintenant);
      j.setDate(j.getDate() - i);
      const cle = cleJour(j);

      const duJour = lignes.filter((l) => l.startAt && cleJour(l.startAt) === cle);
      serie.push({
        jour: cle,
        nombre: duJour.length,
        montant: duJour
          .filter((l) => l.status === 'terminee')
          .reduce((s, l) => s + l.total, 0),
      });
    }

    // --- Classement des soins ---
    const parSoin = lignes.reduce<Record<string, number>>((acc, l) => {
      acc[l.serviceNom] = (acc[l.serviceNom] ?? 0) + 1;
      return acc;
    }, {});

    const soinsPopulaires = Object.entries(parSoin)
      .map(([nom, nombre]) => ({ nom, nombre }))
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, 6);

    // --- Répartition institut / domicile ---
    const domicile = lignes.filter((l) => l.lieu === 'domicile').length;

    // =================================================================
    //  Les quatre chiffres de tête du tableau de bord.
    //
    //  ⚠️  « Aujourd'hui » et « ce mois-ci » se calculent dans le fuseau
    //      de L'INSTITUT (`Africa/Casablanca`), jamais dans celui du
    //      serveur. Vercel exécute à Washington : sans ça, la journée
    //      bascule avec cinq heures de retard et un rendez-vous du matin
    //      compte encore pour la veille.
    // =================================================================
    const cleAujourdhui = cleJourLocale(maintenant);

    const duJourNonAnnules = lignes
      .filter((l) => l.startAt && cleJourLocale(l.startAt) === cleAujourdhui)
      .filter((l) => l.status !== 'annulee');

    const prochainDuJour = duJourNonAnnules
      .filter((l) => l.startAt && l.startAt > maintenant)
      .sort((a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0))[0];

    const heureLocale = (d: Date) => {
      const p = partiesLocales(d);
      return `${String(p.heures).padStart(2, '0')}h${String(p.minutes).padStart(2, '0')}`;
    };

    // --- Le plus récemment PRIS (pas le plus proche) ---
    const dernierPris = lignes
      .filter((l) => l.creeLe)
      .sort((a, b) => (b.creeLe?.getTime() ?? 0) - (a.creeLe?.getTime() ?? 0))[0];

    // --- Chiffre du mois, comparé au mois précédent ---
    const p0 = partiesLocales(maintenant);
    const memeMois = (d: Date, an: number, mois: number) => {
      const p = partiesLocales(d);
      return p.an === an && p.mois === mois;
    };
    const moisPrecedentAn = p0.mois === 1 ? p0.an - 1 : p0.an;
    const moisPrecedentMois = p0.mois === 1 ? 12 : p0.mois - 1;

    const terminees = lignes.filter((l) => l.status === 'terminee' && l.startAt);
    const revenuMois = terminees
      .filter((l) => memeMois(l.startAt as Date, p0.an, p0.mois))
      .reduce((s, l) => s + l.total, 0);
    const revenuMoisPrecedent = terminees
      .filter((l) => memeMois(l.startAt as Date, moisPrecedentAn, moisPrecedentMois))
      .reduce((s, l) => s + l.total, 0);

    // `null` quand le mois précédent est à zéro : afficher « +100 % » ou
    // « +∞ » sur une base vide ne veut rien dire, et une variation est
    // exactement le genre de chiffre qu'on lit sans le questionner.
    const variation =
      revenuMoisPrecedent > 0
        ? Math.round(((revenuMois - revenuMoisPrecedent) / revenuMoisPrecedent) * 100)
        : null;

    // Une valeur par jour écoulé du mois, pour la courbe de la tuile.
    const courbeMois: number[] = [];
    for (let jour = 1; jour <= p0.jour; jour += 1) {
      courbeMois.push(
        terminees
          .filter((l) => {
            const p = partiesLocales(l.startAt as Date);
            return p.an === p0.an && p.mois === p0.mois && p.jour === jour;
          })
          .reduce((s, l) => s + l.total, 0),
      );
    }

    // --- Dernières demandes non lues ---
    const demandes = snapMessages.docs
      .map((d) => {
        const v = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          nom: (v.nom as string) ?? 'Sans nom',
          extrait: ((v.message as string) ?? '').slice(0, 120),
          recuLe: enDate(v.createdAt),
        };
      })
      .sort((a, b) => (b.recuLe?.getTime() ?? 0) - (a.recuLe?.getTime() ?? 0))
      .slice(0, 3)
      .map(({ id, nom, extrait }) => ({ id, nom, extrait }));

    return Response.json({
      total: lignes.length,
      parStatut,
      encaisse,
      attendu,
      aVenir: aVenir.length,
      messagesNonLus: snapMessages.size,
      clients: snapClients.data().count,
      serie,
      soinsPopulaires,
      repartitionLieu: { domicile, institut: lignes.length - domicile },

      aujourdhui: {
        nombre: duJourNonAnnules.length,
        prochain: prochainDuJour?.startAt
          ? {
              heure: heureLocale(prochainDuJour.startAt),
              soin: prochainDuJour.serviceNom,
              cliente: prochainDuJour.cliente,
            }
          : null,
      },
      dernier: dernierPris?.startAt
        ? {
            jour: cleJourLocale(dernierPris.startAt),
            heure: heureLocale(dernierPris.startAt),
          }
        : null,
      revenu: {
        mois: revenuMois,
        moisPrecedent: revenuMoisPrecedent,
        variation,
        courbe: courbeMois,
      },
      demandes,
    });
  } catch {
    return Response.json({ error: 'Lecture impossible.' }, { status: 500 });
  }
}
