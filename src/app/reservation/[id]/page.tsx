import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmationReservation } from '@/components/reservation/ConfirmationReservation';
import { adminDb, adminReady } from '@/lib/firebase/admin';
import { LIBELLE_STATUT, type StatutReservation } from '@/lib/reservations';

export const metadata: Metadata = {
  title: 'Votre demande de rendez-vous',
  robots: { index: false, follow: false },
};

// Toujours rendue à la demande : une confirmation mise en cache
// afficherait le rendez-vous de quelqu'un d'autre.
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// =====================================================================
//  Confirmation de rendez-vous.
//
//  ⚠️  MODÈLE D'ACCÈS — « URL-capacité », choisi volontairement.
//
//  On peut réserver SANS COMPTE. Une visiteuse non connectée ne peut donc
//  pas lire son propre document via les règles Firestore, qui exigent
//  `userId == request.auth.uid`. La page est donc lue ici, côté serveur,
//  avec l'Admin SDK.
//
//  Ce qui protège la page, c'est l'IDENTIFIANT lui-même : Firestore
//  génère 20 caractères aléatoires, soit un espace de l'ordre de 10^35.
//  Il n'est pas devinable, et la page est marquée `noindex, nofollow`
//  pour ne jamais se retrouver dans un moteur de recherche.
//
//  Deux conséquences assumées, documentées dans SECURITY.md :
//   · quiconque a le lien voit le rendez-vous — c'est le principe, le
//     lien est envoyé à la cliente et à elle seule ;
//   · on n'affiche donc ici QUE ce que la cliente a elle-même saisi.
//     Aucune note interne, aucune donnée d'un autre rendez-vous.
// =====================================================================

export default async function PageConfirmation({ params }: Params) {
  const { id } = await params;

  if (!adminReady) notFound();

  const snap = await adminDb().collection('reservations').doc(id).get();
  if (!snap.exists) notFound();

  const d = snap.data() as Record<string, unknown>;

  /** Les Timestamp Firestore ne traversent pas la frontière serveur → client. */
  function versISO(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'object' && v !== null && 'toDate' in v) {
      try {
        return (v as { toDate: () => Date }).toDate().toISOString();
      } catch {
        return '';
      }
    }
    return typeof v === 'string' ? v : '';
  }

  const client = (d.client as Record<string, unknown> | undefined) ?? {};

  const vue = {
    id: snap.id,
    reference: (d.reference as string) ?? snap.id.slice(0, 6).toUpperCase(),
    serviceNom: (d.serviceNom as string) ?? 'Soin',
    serviceSlug: (d.serviceSlug as string) ?? '',
    duree: typeof d.duree === 'number' ? d.duree : 60,
    lieu: d.lieu === 'domicile' ? ('domicile' as const) : ('institut' as const),
    prix: typeof d.prix === 'number' ? d.prix : 0,
    supplementDomicile: typeof d.supplementDomicile === 'number' ? d.supplementDomicile : 0,
    total: typeof d.total === 'number' ? d.total : 0,
    startAt: versISO(d.startAt),
    status: ((d.status as StatutReservation) ?? 'en-attente') satisfies StatutReservation,
    statutLabel: LIBELLE_STATUT[(d.status as StatutReservation) ?? 'en-attente'],
    prenom: (client.prenom as string) ?? '',
    nom: (client.nom as string) ?? '',
    email: (client.email as string) ?? '',
    telephone: (client.telephone as string) ?? '',
    adresseSoin: (d.adresseSoin as string) ?? null,
    adresseFacturation: (d.adresseFacturation as string) ?? null,
    notes: (d.notes as string) ?? '',
  };

  return (
    <>
      <ConfirmationReservation reservation={vue} />

      {/* Repli sans JavaScript : le composant client au-dessus porte
          l'animation, ce lien garantit qu'on peut toujours repartir. */}
      <noscript>
        <p className="p-8 text-center">
          <Link href="/" className="souligne">
            Retour à l’accueil
          </Link>
        </p>
      </noscript>
    </>
  );
}
