import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// =====================================================================
//  Bandeau pleine largeur sur photo.
//
//  ⚠️  RÉÉCRIT — composant SERVEUR, aucun JavaScript envoyé.
//      Ne pas y remettre `useScroll`.
//
//  Il est utilisé quatre fois sur la seule page d'accueil, et en tête de
//  chaque page intérieure. Sa version précédente ouvrait un abonnement au
//  défilement et une valeur ressort PAR INSTANCE : sur l'accueil, cela
//  faisait cinq boucles d'animation concurrentes sur le fil principal,
//  rien que pour décaler des images de quelques pixels. C'est une des
//  causes directes de la lenteur au défilement.
//
//  La parallaxe passe par `.parallaxe-fond` (CSS, `animation-timeline:
//  scroll()`), donc par le compositeur. Sans prise en charge, l'image est
//  fixe — on perd l'effet, jamais le contenu.
//
//  LE VOILE N'EST PAS OPTIONNEL : le texte est blanc et doit rester
//  lisible même si la photo qui remplacera l'illustration est très claire.
//  On ne parie pas sur des visuels qu'on n'a pas encore.
// =====================================================================

export function BandeauImage({
  src,
  alt = '',
  hauteur = 'moyen',
  align = 'centre',
  parallaxe = true,
  voile = 'moyen',
  children,
  className,
}: {
  src: string;
  alt?: string;
  hauteur?: 'court' | 'moyen' | 'haut' | 'plein';
  align?: 'centre' | 'gauche' | 'droite';
  parallaxe?: boolean;
  voile?: 'leger' | 'moyen' | 'fort';
  children: ReactNode;
  className?: string;
}) {
  const HAUTEURS = {
    court: 'min-h-[280px] py-14 sm:min-h-[340px] sm:py-20',
    moyen: 'min-h-[360px] py-16 sm:min-h-[460px] sm:py-24',
    haut: 'min-h-[440px] py-20 sm:min-h-[600px] sm:py-28',
    plein: 'min-h-[70svh] py-20 sm:min-h-[85svh] sm:py-28',
  } as const;

  const ALIGNS = {
    centre: 'items-center text-center',
    gauche: 'items-start text-left',
    droite: 'items-end text-right',
  } as const;

  const VOILES = {
    leger: 'bg-ink/35',
    moyen: 'voile',
    fort: 'bg-ink/62',
  } as const;

  return (
    <section
      className={cn('relative flex items-center overflow-hidden', HAUTEURS[hauteur], className)}
    >
      {/*
        ⚠️  PAS DE `-z-10` ICI. Ne jamais le remettre.

        Ce conteneur portait `-z-10`. Aucun ancêtre entre lui et `<html>`
        ne crée de contexte d'empilement, donc le `-10` remontait jusqu'à
        la RACINE — où il était peint avant les blocs en flux, dont
        l'enveloppe `Chrome` et son fond crème OPAQUE (`bg-canvas`).

        Résultat : la photo et son voile sombre étaient dessinés, puis
        entièrement recouverts par le crème. Toutes les bandes photo du
        site étaient invisibles, et le texte clair prévu pour être posé
        dessus se retrouvait sur du crème — illisible.

        La règle : le fond reste en flux normal (`z-0`), et c'est le
        CONTENU qu'on remonte (`relative z-10`). Aucun empilement négatif,
        donc aucune dépendance à un contexte d'empilement d'ancêtre.
      */}
      <div className={cn('absolute inset-0 z-0', parallaxe && 'parallaxe-fond')}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
        <div className={cn('absolute inset-0', VOILES[voile])} />
      </div>

      <div className={cn('relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-5 sm:px-8', ALIGNS[align])}>
        {children}
      </div>
    </section>
  );
}
