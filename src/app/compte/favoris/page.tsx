import type { Metadata } from 'next';

import { Favoris } from '@/components/compte/Favoris';

export const metadata: Metadata = { title: 'Mes favoris' };

export default function PageFavoris() {
  return <Favoris />;
}
