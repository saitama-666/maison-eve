'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { LotusMark } from '@/components/ui/Logo';
import { contact } from '@/data/site';

// =====================================================================
//  Erreur inattendue.
//
//  Next monte cette page quand un composant lève une erreur au rendu.
//  Elle DOIT être un composant client : elle reçoit `reset`, qui retente
//  le rendu sans recharger toute la page.
//
//  On n'affiche JAMAIS `error.message` à la visiteuse : il peut contenir
//  un chemin de fichier, un nom de collection ou une requête. Il part
//  dans la console, où l'équipe peut le lire.
//
//  `error.digest` est un identifiant court produit par Next en
//  production. Le montrer permet de relier ce que voit la cliente au
//  journal du serveur, sans rien révéler d'interne.
// =====================================================================

export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-5 py-32">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <LotusMark taille={44} className="text-champagne" />

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[2.5rem] leading-tight text-ink">
            Quelque chose a mal tourné
          </h1>
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            L’incident vient de chez nous, pas de vous. Réessayez : le plus souvent, ça
            suffit.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} fleche>
            Réessayer
          </Button>
          <Button href="/" variante="secondaire">
            Retour à l’accueil
          </Button>
        </div>

        <p className="text-sm text-muted">
          Si ça se reproduit, appelez-nous au{' '}
          <a href={`tel:${contact.phoneHref}`} className="souligne text-ink">
            {contact.phone}
          </a>
          .
        </p>

        {error.digest && (
          <p className="text-xs text-faint">
            Référence technique : <span className="tabular">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
