import type { Metadata } from 'next';

import { TableauBord } from '@/components/compte/TableauBord';

export const metadata: Metadata = { title: 'Mon espace' };

export default function PageCompte() {
  return <TableauBord />;
}
