import type { Metadata } from 'next';
import { Suspense } from 'react';

import { GestionReservations } from '@/components/admin/GestionReservations';
import { EcranChargement } from '@/components/ui/Bits';

export const metadata: Metadata = { title: 'Rendez-vous' };

// `<Suspense>` obligatoire : le composant lit `?statut=` via
// `useSearchParams()`, ce qui force un rendu cote client.
export default function PageAdminReservations() {
  return (
    <Suspense fallback={<EcranChargement />}>
      <GestionReservations />
    </Suspense>
  );
}
