import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CadreAdmin } from '@/components/admin/CadreAdmin';
import { ThemeAdmin } from '@/components/admin/ThemeAdmin';

export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s · Administration' },
  robots: { index: false, follow: false },
};

// =====================================================================
//  Mise en page du back-office.
//
//  IMPORTANT : `<ThemeAdmin>` se monte ICI, au-dessus de `<CadreAdmin>`,
//  et jamais l'inverse.
//
//  `CadreAdmin` renvoie un ecran de chargement tant que les droits ne
//  sont pas verifies. S'il portait le fournisseur de theme, chaque
//  rotation de jeton le demonterait, effacerait `data-admin-theme` et
//  renverrait la page en clair au milieu du travail. C'est exactement le
//  bug rencontre sur l'autre projet.
// =====================================================================

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <ThemeAdmin>
      <CadreAdmin>{children}</CadreAdmin>
    </ThemeAdmin>
  );
}
