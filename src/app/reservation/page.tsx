import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TunnelReservation } from '@/components/reservation/TunnelReservation';
import { EcranChargement } from '@/components/ui/Bits';

export const metadata: Metadata = {
  title: 'Réserver un soin',
  // 148 caracteres.
  description:
    'Réservez votre soin en quelques minutes : le soin, le lieu — institut ou domicile — ' +
    'et votre créneau. Paiement sur place.',
  alternates: { canonical: '/reservation' },
  // Le tunnel n'a aucune valeur dans un index de recherche, et ses URL
  // portent des paramètres (?soin=…) qui créent des doublons.
  robots: { index: false, follow: true },
};

// =====================================================================
//  Page de réservation.
//
//  `<Suspense>` est OBLIGATOIRE ici : `TunnelReservation` appelle
//  `useSearchParams()`, ce qui force Next à rendre l'arbre côté client.
//  Sans la frontière Suspense, le build échoue avec une erreur de
//  pré-rendu — ce n'est pas un détail de confort.
// =====================================================================

export default function PageReservation() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-28 sm:px-8 lg:pt-32">
      {/*
        Le titre est rendu PAR LE SERVEUR, hors de la frontière Suspense.

        Tant qu'il était à l'intérieur, le HTML servi ne contenait qu'un
        écran de chargement : la page arrivait sans aucun `<h1>` et sans
        rien de lisible avant que JavaScript ait démarré. Ici, le titre
        est peint avec le premier octet ; seul le tunnel, qui a réellement
        besoin de JavaScript, attend.
      */}
      <div className="arrivee mx-auto mb-10 max-w-2xl text-center">
        <span className="surtitre">Prendre rendez-vous</span>
        <h1 className="mt-3 font-display text-[2.25rem] leading-tight text-ink sm:text-[2.75rem]">
          Réserver un soin
        </h1>
      </div>

      <Suspense fallback={<EcranChargement message="Préparation de votre réservation…" />}>
        <TunnelReservation />
      </Suspense>
    </div>
  );
}
