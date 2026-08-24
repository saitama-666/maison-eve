import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CadreCompte } from '@/components/compte/CadreCompte';

export const metadata: Metadata = {
  // L'espace client n'a rien a faire dans un moteur de recherche : chaque
  // page y est personnelle et vide pour un robot non connecte.
  robots: { index: false, follow: false },
};

export default function LayoutCompte({ children }: { children: ReactNode }) {
  return <CadreCompte>{children}</CadreCompte>;
}
