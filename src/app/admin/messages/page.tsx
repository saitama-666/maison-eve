import type { Metadata } from 'next';

import { BoiteMessages } from '@/components/admin/BoiteMessages';

export const metadata: Metadata = { title: 'Messages' };

export default function PageAdminMessages() {
  return <BoiteMessages />;
}
