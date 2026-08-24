import { NextRequest } from 'next/server';

import { adminDb, requireAdmin } from '@/lib/firebase/admin';
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
      serviceNom: string;
      lieu: string;
    };

    const lignes: Ligne[] = snapReservations.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      const brut = v.startAt as { toDate?: () => Date } | undefined;
      return {
        status: (v.status as string) ?? 'en-attente',
        total: typeof v.total === 'number' ? v.total : 0,
        startAt: brut?.toDate ? brut.toDate() : null,
        serviceNom: (v.serviceNom as string) ?? 'Soin',
        lieu: (v.lieu as string) ?? 'institut',
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
    });
  } catch {
    return Response.json({ error: 'Lecture impossible.' }, { status: 500 });
  }
}
