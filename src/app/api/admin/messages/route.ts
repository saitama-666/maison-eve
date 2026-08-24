import { NextRequest } from 'next/server';

import { adminDb, requireAdmin } from '@/lib/firebase/admin';
import { nettoyer } from '@/lib/validation';

// =====================================================================
//  /api/admin/messages
//
//  GET    — les messages du formulaire de contact.
//  PATCH  — change le statut (lu, traité).
//  DELETE — supprime définitivement un message.
//
//  La suppression est réellement définitive : elle sert à honorer une
//  demande d'effacement de données personnelles. Un « archivage » qui
//  garderait le document ne répondrait pas à cette demande, il la
//  ferait seulement disparaître de l'écran.
// =====================================================================

const STATUTS = ['nouveau', 'lu', 'traite'] as const;

export async function GET(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  const url = new URL(request.url);
  const limite = Math.min(Number(url.searchParams.get('limite') ?? 100), 300);

  try {
    const snap = await adminDb()
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limite)
      .get();

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

    const messages = snap.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        nom: (v.name as string) ?? '',
        email: (v.email as string) ?? '',
        telephone: (v.phone as string) ?? '',
        sujet: (v.subject as string) ?? '',
        message: (v.message as string) ?? '',
        statut: (v.status as string) ?? 'nouveau',
        recuLe: iso(v.createdAt),
      };
    });

    return Response.json({ messages });
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
  const statut = nettoyer(corps.statut, 20);

  if (!id) return Response.json({ error: 'Identifiant manquant.' }, { status: 400 });
  if (!(STATUTS as readonly string[]).includes(statut)) {
    return Response.json({ error: 'Statut inconnu.' }, { status: 400 });
  }

  try {
    await adminDb().collection('messages').doc(id).update({
      status: statut,
      traiteLe: new Date(),
      traitePar: acces.email,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Modification impossible.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  const url = new URL(request.url);
  const id = nettoyer(url.searchParams.get('id'), 60);
  if (!id) return Response.json({ error: 'Identifiant manquant.' }, { status: 400 });

  try {
    await adminDb().collection('messages').doc(id).delete();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Suppression impossible.' }, { status: 500 });
  }
}
