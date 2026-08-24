import { NextRequest } from 'next/server';

import { invaliderCatalogue } from '@/lib/catalogue';
import { adminDb, requireAdmin } from '@/lib/firebase/admin';
import { nettoyer, slugValide } from '@/lib/validation';

// =====================================================================
//  /api/admin/soins — gestion du catalogue.
//
//  GET / POST / PATCH / DELETE.
//
//  ⚠️  VALIDATION PAR LISTE BLANCHE.
//      On ne recopie JAMAIS le corps de la requête tel quel dans
//      Firestore. Chaque champ est lu, typé et borné individuellement.
//      Sans ça, un `{ ...corps }` laisserait écrire n'importe quelle clé
//      — y compris des champs qu'on n'a pas prévus — et gonfler le
//      document sans limite.
//
//  ⚠️  TOUTE ÉCRITURE APPELLE `invaliderCatalogue()`.
//      Le catalogue est mis en cache 60 secondes côté serveur. Sans cette
//      invalidation, l'administrateur enregistre, recharge, ne voit rien
//      changer, et croit que ça n'a pas marché.
// =====================================================================

const CATEGORIES = ['massages', 'visage', 'corps', 'rituels'] as const;

/** Lit et borne un champ numérique. */
function nombre(v: unknown, defaut: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(Math.max(Math.round(n), min), max);
}

/** Construit le document à écrire, champ par champ. */
function construireSoin(corps: Record<string, unknown>) {
  const nom = nettoyer(corps.nom, 90);
  const slug = nettoyer(corps.slug, 90).toLowerCase();

  if (!nom) return { erreur: 'Le nom est obligatoire.' as const };
  if (!slug || !slugValide(slug)) {
    return {
      erreur:
        'L’adresse (slug) doit être en minuscules, sans accent, avec des tirets à la place des espaces.' as const,
    };
  }

  const categorie = nettoyer(corps.categorie, 20);

  return {
    document: {
      nom,
      slug,
      categorie: (CATEGORIES as readonly string[]).includes(categorie) ? categorie : 'massages',
      resume: nettoyer(corps.resume, 200),
      description: Array.isArray(corps.description)
        ? (corps.description as unknown[]).slice(0, 8).map((p) => nettoyer(p, 1200))
        : [],
      // Durée bornée : 15 min à 8 h. Au-delà, c'est une erreur de saisie
      // (un « 600 » tapé pour 60), et elle casserait le calendrier.
      duree: nombre(corps.duree, 60, 15, 480),
      prix: nombre(corps.prix, 0, 0, 100_000),
      supplementDomicile: nombre(corps.supplementDomicile, 0, 0, 100_000),
      domicileDisponible: corps.domicileDisponible !== false,
      image: nettoyer(corps.image, 240) || '/soins/defaut.svg',
      bienfaits: Array.isArray(corps.bienfaits)
        ? (corps.bienfaits as unknown[]).slice(0, 10).map((b) => nettoyer(b, 140))
        : [],
      deroule: Array.isArray(corps.deroule)
        ? (corps.deroule as unknown[]).slice(0, 8).map((e) => {
            const o = (e ?? {}) as Record<string, unknown>;
            return { titre: nettoyer(o.titre, 90), texte: nettoyer(o.texte, 400) };
          })
        : [],
      populaire: corps.populaire === true,
      actif: corps.actif !== false,
      ordre: nombre(corps.ordre, 99, 0, 999),
    },
  };
}

export async function GET(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  try {
    const snap = await adminDb().collection('services').get();
    const soins = snap.docs
      .map((d) => {
        const donnees = d.data() as Record<string, unknown>;
        return { ...donnees, id: d.id } as Record<string, unknown> & { id: string };
      })
      .sort((a, b) => Number(a.ordre ?? 99) - Number(b.ordre ?? 99));

    return Response.json({ soins });
  } catch {
    return Response.json({ error: 'Lecture impossible.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  const resultat = construireSoin(corps);
  if ('erreur' in resultat) {
    return Response.json({ error: resultat.erreur }, { status: 400 });
  }

  try {
    const db = adminDb();

    // Un slug en double casserait le routage : deux soins répondraient à
    // la même URL, et lequel s'affiche deviendrait imprévisible.
    const doublon = await db
      .collection('services')
      .where('slug', '==', resultat.document.slug)
      .limit(1)
      .get();

    if (!doublon.empty) {
      return Response.json(
        { error: 'Un soin utilise déjà cette adresse (slug).' },
        { status: 409 },
      );
    }

    const ref = await db.collection('services').add({
      ...resultat.document,
      creeLe: new Date(),
      creePar: acces.email,
    });

    invaliderCatalogue();
    return Response.json({ id: ref.id }, { status: 201 });
  } catch {
    return Response.json({ error: 'Création impossible.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  const id = nettoyer(corps.id, 90);
  if (!id) return Response.json({ error: 'Identifiant manquant.' }, { status: 400 });

  const resultat = construireSoin(corps);
  if ('erreur' in resultat) {
    return Response.json({ error: resultat.erreur }, { status: 400 });
  }

  try {
    const db = adminDb();

    const doublon = await db
      .collection('services')
      .where('slug', '==', resultat.document.slug)
      .limit(2)
      .get();

    if (doublon.docs.some((d) => d.id !== id)) {
      return Response.json(
        { error: 'Un autre soin utilise déjà cette adresse (slug).' },
        { status: 409 },
      );
    }

    await db
      .collection('services')
      .doc(id)
      .set(
        { ...resultat.document, modifieLe: new Date(), modifiePar: acces.email },
        { merge: true },
      );

    invaliderCatalogue();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Modification impossible.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  const url = new URL(request.url);
  const id = nettoyer(url.searchParams.get('id'), 90);
  if (!id) return Response.json({ error: 'Identifiant manquant.' }, { status: 400 });

  try {
    const db = adminDb();

    // Un soin déjà réservé n'est PAS supprimé : on le désactive. Sinon les
    // rendez-vous passés pointeraient vers un soin inexistant, et
    // l'historique d'une cliente deviendrait illisible.
    const reserve = await db
      .collection('reservations')
      .where('serviceId', '==', id)
      .limit(1)
      .get();

    if (!reserve.empty) {
      await db.collection('services').doc(id).set({ actif: false }, { merge: true });
      invaliderCatalogue();
      return Response.json({
        ok: true,
        desactive: true,
        message:
          'Ce soin a déjà été réservé : il a été désactivé plutôt que supprimé, pour ne pas ' +
          'casser l’historique des rendez-vous.',
      });
    }

    await db.collection('services').doc(id).delete();
    invaliderCatalogue();
    return Response.json({ ok: true, desactive: false });
  } catch {
    return Response.json({ error: 'Suppression impossible.' }, { status: 500 });
  }
}
