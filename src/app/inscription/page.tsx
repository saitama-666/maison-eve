import type { Metadata } from 'next';

import { FormulaireInscription } from '@/components/auth/FormulaireInscription';

export const metadata: Metadata = {
  title: 'Creer un compte',
  description: 'Creez votre compte MAISON EVE pour suivre vos rendez-vous et vos adresses.',
  robots: { index: false, follow: false },
};

export default function PageInscription() {
  return <FormulaireInscription />;
}
