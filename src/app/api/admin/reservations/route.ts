import { NextRequest } from 'next/server';

import { adminDb, requireAdmin } from '@/lib/firebase/admin';
import { nettoyer } from '@/lib/validation';

// =====================================================================
//  /api/admin/reservations
//
//  GET   — liste des rendez-vous, filtrable par statut.
//  PATCH — change le statut d'un rendez-vous.
//
//  ⚠️  SEUL LE STATUT EST MODIFIABLE ICI.
//      Ni le prix, ni la date, ni le soin, ni les coordonnées. Un
//      back-office qui laisse réécrire un montant après coup rend la
//      comptabilité inauditable — on ne saurait plus si un écart vient
//      d'une erreur ou d'une correction. Pour changer une date, on annule
//      et on recrée : la trace reste.
// =====================================================================

const STATUTS_VALIDES = ['en-attente', 'confirmee', 'terminee', 'annulee', 'absente'] as const;

type Statut = (typeof STATUTS_VALIDES)[number];

export async function GET(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  const url = new URL(request.url);
  const statut = url.searchParams.get('statut');
  // Plafonné : sans limite, la première ouverture du back-office un an
  // après le lancement téléchargerait toute la base.
  const limite = Math.min(Number(url.searchParams.get('limite') ?? 100), 300);

  try {
    let requete = adminDb()
      .collection('reservations')
      .orderBy('startAt', 'desc')
      .limit(limite);

    if (statut && (STATUTS_VALIDES as readonly string[]).includes(statut)) {
      requete = adminDb()
        .collection('reservations')
        .where('status', '==', statut)
        .orderBy('startAt', 'desc')
        .limit(limite);
    }

    const snap = await requete.get();

    const reservations = snap.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      const client = (v.client as Record<string, unknown> | undefined) ?? {};

      function iso(x: unknown): string | null {
        if (!x) return null;
        if (typeof x === 'object' && x !== null && 'toDate' in x) {
          try {
            return (x as { toDate: () => Date }).toDate().toISOString();
          } catch {
            return null;
          }
        }
        return typeof x === 'string' ? x : null;
      }

      return {
        id: d.id,
        reference: (v.reference as string) ?? d.id.slice(0, 6).toUpperCase(),
        serviceNom: (v.serviceNom as string) ?? 'Soin',
        serviceSlug: (v.serviceSlug as string) ?? '',
        duree: typeof v.duree === 'number' ? v.duree : 60,
        lieu: v.lieu === 'domicile' ? 'domicile' : 'institut',
        total: typeof v.total === 'number' ? v.total : 0,
        startAt: iso(v.startAt),
        status: (v.status as string) ?? 'en-attente',
        client: {
          prenom: (client.prenom as string) ?? '',
          nom: (client.nom as string) ?? '',
          email: (client.email as string) ?? '',
          telephone: (client.telephone as string) ?? '',
        },
        adresseSoin: (v.adresseSoin as string) ?? null,
        adresseFacturation: (v.adresseFacturation as string) ?? null,
        notes: (v.notes as string) ?? '',
        createdAt: iso(v.createdAt),
      };
    });

    return Response.json({ reservations });
  } catch {
    return Response.json({ error: 'Lecture impossible.' }, { status: 500 });
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

  const id = nettoyer(corps.id, 60);
  const statut = nettoyer(corps.status, 20) as Statut;

  if (!id) return Response.json({ error: 'Identifiant manquant.' }, { status: 400 });
  if (!(STATUTS_VALIDES as readonly string[]).includes(statut)) {
    return Response.json({ error: 'Statut inconnu.' }, { status: 400 });
  }

  try {
    const ref = adminDb().collection('reservations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return Response.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });
    }

    await ref.update({
      status: statut,
      // On garde QUI a changé le statut et QUAND. Sur un désaccord avec
      // une cliente (« je n'ai jamais annulé »), c'est la seule chose
      // qui permet de trancher.
      statusModifiePar: acces.email,
      statusModifieLe: new Date(),
      ...(statut === 'annulee' ? { cancelledAt: new Date() } : {}),
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Modification impossible.' }, { status: 500 });
  }
}
