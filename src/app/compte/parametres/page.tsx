import type { Metadata } from 'next';

import { Parametres } from '@/components/compte/Parametres';

export const metadata: Metadata = { title: 'Parametres' };

export default function PageParametres() {
  return <Parametres />;
}
