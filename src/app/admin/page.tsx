import type { Metadata } from 'next';

import { TableauBordAdmin } from '@/components/admin/TableauBordAdmin';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default function PageAdmin() {
  return <TableauBordAdmin />;
}
