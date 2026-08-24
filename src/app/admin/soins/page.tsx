import type { Metadata } from 'next';

import { GestionSoins } from '@/components/admin/GestionSoins';

export const metadata: Metadata = { title: 'Soins' };

export default function PageAdminSoins() {
  return <GestionSoins />;
}
