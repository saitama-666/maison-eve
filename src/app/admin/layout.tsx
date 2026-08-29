import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { CadreAdmin } from '@/components/admin/CadreAdmin';
import { ThemeAdmin } from '@/components/admin/ThemeAdmin';

// =====================================================================
//  Typographie du back-office.
//
//  ⚠️  ELLE EST DECLAREE ICI, PAS DANS LE LAYOUT RACINE.
//
//      `next/font` n'emet la feuille de style que pour les routes qui
//      referencent la police. Posee ici, Inter n'est telechargee que par
//      /admin — la vitrine ne paie pas un octet pour une police qu'elle
//      n'affiche jamais.
//
//  Trois graisses, pas davantage : 400 pour le texte, 500 pour les
//  libelles, 600 pour les chiffres. Chaque graisse en plus est un
//  fichier de plus.
// =====================================================================
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

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
      {/* `font-admin` bascule tout le back-office sur Inter. Le reste du
          site garde Jost et Cormorant : cette classe ne descend que sur
          les enfants de ce layout. */}
      <div className={`${inter.variable} typo-admin`}>
        <CadreAdmin>{children}</CadreAdmin>
      </div>
    </ThemeAdmin>
  );
}
