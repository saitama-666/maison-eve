import type { Metadata } from 'next';

import { FormulaireConnexion } from '@/components/auth/FormulaireConnexion';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous a votre espace MAISON EVE pour retrouver vos rendez-vous.',
  robots: { index: false, follow: false },
};

// Plus de `<Suspense>` : le formulaire ne lit plus `?suite=` via
// `useSearchParams()` mais au moment ou il en a besoin. La page est donc
// rendue par le serveur, titre et champs compris.
export default function PageConnexion() {
  return <FormulaireConnexion />;
}
