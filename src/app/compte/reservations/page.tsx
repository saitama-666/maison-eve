import type { Metadata } from 'next';

import { MesReservations } from '@/components/compte/MesReservations';

export const metadata: Metadata = { title: 'Mes rendez-vous' };

export default function PageMesReservations() {
  return <MesReservations />;
}
