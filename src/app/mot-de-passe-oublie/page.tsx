import type { Metadata } from 'next';

import { FormulaireReinitialisation } from '@/components/auth/FormulaireReinitialisation';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: false },
};

export default function PageMotDePasseOublie() {
  return <FormulaireReinitialisation />;
}
