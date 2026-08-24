import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { LotusMark } from '@/components/ui/Logo';
import { navPrincipale } from '@/data/site';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true },
};

// =====================================================================
//  404.
//
//  Une page d'erreur utile propose une sortie, pas une blague. On donne
//  donc les deux actions les plus probables (réserver, voir les soins) et
//  le plan du site complet — parce qu'on ne sait pas ce que la personne
//  cherchait.
//
//  Elle est SERVEUR : pas de JavaScript nécessaire pour l'afficher. C'est
//  souvent sur les pages d'erreur que le reste a déjà échoué.
// =====================================================================

export default function PageIntrouvable() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-5 py-32">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <LotusMark taille={44} className="text-champagne" />

        {/* `/35` ne donnait que 1,65 de contraste — le nombre etait un
            fantome. `/75` le porte a 3,3, au-dessus du seuil des grands
            textes, tout en le gardant discret face au titre. */}
        <p className="font-display text-[5rem] leading-none text-champagne/75 tabular">404</p>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[2.5rem] leading-tight text-ink">
            Cette page n’existe pas
          </h1>
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            Le lien est peut-être ancien, ou l’adresse comporte une faute de frappe. Voici par
            où repartir.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" fleche>
            Retour à l’accueil
          </Button>
          <Button href="/soins" variante="secondaire">
            Voir les soins
          </Button>
        </div>

        <nav aria-label="Plan du site" className="mt-6 border-t border-line pt-6">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {navPrincipale.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="souligne text-sm text-muted transition-colors duration-[140ms] hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/reservation"
                className="souligne text-sm text-muted transition-colors duration-[140ms] hover:text-ink"
              >
                Réserver
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
