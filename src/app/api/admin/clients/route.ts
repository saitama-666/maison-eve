import { NextRequest } from 'next/server';

import { adminDb, requireAdmin } from '@/lib/firebase/admin';

// =====================================================================
//  GET /api/admin/clients — liste des comptes clients.
//
//  ⚠️  ON N'EXPOSE QUE CE QUI SERT À TRAVAILLER : identité, contact, date
//      d'inscription, et le nombre de rendez-vous. Pas les adresses, pas
//      les notes de soin, pas l'historique détaillé.
//
//      Ce n'est pas de la pudeur : plus une liste transporte de données
//      personnelles, plus une fuite coûte cher. Les détails restent
//      accessibles un par un, sur demande explicite — jamais déversés en
//      bloc dans une réponse que quelqu'un pourrait copier.
//
//      Aucune donnée bancaire n'existe nulle part dans la base, donc il
//      n'y en a pas non plus ici.
// =====================================================================

export async function GET(request: NextRequest) {
  const acces = await requireAdmin(request);
  if (acces instanceof Response) return acces;

  const url = new URL(request.url);
  const limite = Math.min(Number(url.searchParams.get('limite') ?? 200), 500);

  try {
    const db = adminDb();

    const [snapUsers, snapReservations] = await Promise.all([
      db.collection('users').orderBy('createdAt', 'desc').limit(limite).get(),
      // On lit les rendez-vous une seule fois pour compter côté serveur.
      // Une requête `count()` par cliente ferait N requêtes pour afficher
      // un seul tableau.
      db.collection('reservations').select('userId', 'total', 'status').get(),
    ]);

    const parClient = new Map<string, { nombre: number; depense: number }>();

    snapReservations.docs.forEach((d) => {
      const v = d.data() as Record<string, unknown>;
      const uid = v.userId as string | null;
      if (!uid) return;

      const actuel = parClient.get(uid) ?? { nombre: 0, depense: 0 };
      actuel.nombre += 1;
      // Seuls les soins TERMINÉS comptent dans le total dépensé : un
      // rendez-vous annulé n'a jamais été payé.
      if (v.status === 'terminee' && typeof v.total === 'number') {
        actuel.depense += v.total;
      }
      parClient.set(uid, actuel);
    });

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

    const clients = snapUsers.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      const stats = parClient.get(d.id) ?? { nombre: 0, depense: 0 };

      return {
        id: d.id,
        prenom: (v.firstName as string) ?? '',
        nom: (v.lastName as string) ?? '',
        email: (v.email as string) ?? '',
        telephone: (v.phone as string) ?? '',
        lettre: v.marketingOptIn === true,
        inscritLe: iso(v.createdAt),
        nombreRdv: stats.nombre,
        depense: stats.depense,
      };
    });

    return Response.json({ clients });
  } catch {
    return Response.json({ error: 'Lecture impossible.' }, { status: 500 });
  }
}
