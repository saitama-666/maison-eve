import type { Metadata } from 'next';

import { CarnetAdresses } from '@/components/compte/CarnetAdresses';

export const metadata: Metadata = { title: 'Mes adresses' };

export default function PageAdresses() {
  return <CarnetAdresses />;
}
