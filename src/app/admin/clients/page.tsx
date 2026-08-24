import type { Metadata } from 'next';

import { ListeClients } from '@/components/admin/ListeClients';

export const metadata: Metadata = { title: 'Clientes' };

export default function PageAdminClients() {
  return <ListeClients />;
}
