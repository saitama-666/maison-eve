import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// =====================================================================
//  Bande photo pleine largeur.
//
//  ⚠️  Composant SERVEUR, aucun JavaScript envoyé. Ne pas y remettre
//      `useScroll` : sa version d'origine ouvrait un abonnement au
//      défilement PAR INSTANCE, et il y en a plusieurs sur l'accueil.
//
//  ⚠️  DEUX DISPOSITIONS, ET « côté » EST LA VALEUR PAR DÉFAUT.
//      Voir la note détaillée dans `EnTetePage.tsx` — même raisonnement,
//      même conclusion : nos visuels sont en portrait, un portrait
//      recadré en bandeau très large perd l'essentiel de sa hauteur, et
//      poser du texte sur une photo rend le contraste dépendant de ce
//      que la photo contient.
//
//      En « côté », le texte est sur un fond uni : le contraste devient
//      une propriété du code, plus un pari sur l'image.
// =====================================================================

export function BandeauImage({
  src,
  alt = '',
  hauteur = 'moyen',
  align = 'centre',
  parallaxe = true,
  voile = 'moyen',
  disposition = 'cote',
  imageADroite = true,
  children,
  className,
}: {
  src: string;
  alt?: string;
  hauteur?: 'court' | 'moyen' | 'haut' | 'plein';
  align?: 'centre' | 'gauche' | 'droite';
  parallaxe?: boolean;
  voile?: 'leger' | 'moyen' | 'fort';
  disposition?: 'cote' | 'plein';
  /** Côté visuel de l'image sur grand écran. Sans effet sur mobile. */
  imageADroite?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const HAUTEURS = {
    court: 'min-h-[280px] py-14 sm:min-h-[340px] sm:py-20',
    moyen: 'min-h-[360px] py-16 sm:min-h-[460px] sm:py-24',
    haut: 'min-h-[440px] py-20 sm:min-h-[600px] sm:py-28',
    plein: 'min-h-[70svh] py-20 sm:min-h-[85svh] sm:py-28',
  } as const;

  // La colonne image fait 38 % de 1400 px, soit ~532 px. Ces hauteurs
  // fixent donc le rapport du cadre : 532/620 ≈ 0.86, tout près du 3:4
  // de nos photos. Trop court, et le cadre devient carré — le portrait
  // se fait rogner sur la hauteur sans que ça se voie.
  const HAUTEURS_COTE = {
    court: 'py-14 lg:min-h-[420px] lg:py-16',
    moyen: 'py-16 lg:min-h-[620px] lg:py-20',
    haut: 'py-20 lg:min-h-[700px] lg:py-24',
    plein: 'py-20 lg:min-h-[70svh] lg:py-28',
  } as const;

  const ALIGNS = {
    centre: 'items-center text-center',
    gauche: 'items-start text-left',
    droite: 'items-end text-right',
  } as const;

  // ⚠️  Les trois crans sont MESURÉS — voir le bloc « LES DEUX AUTRES
  //     CRANS DU VOILE » dans `globals.css`. Ils étaient écrits
  //     `bg-ink/35` et `bg-ink/62`, c'est-à-dire l'ancien voile déjà
  //     condamné : sur une photo claire, le texte tombait à 1,77 et
  //     3,63 de contraste. Et l'échelle mentait — « fort » était le plus
  //     FAIBLE des trois. Ne pas revenir à des opacités improvisées.
  const VOILES = {
    leger: 'voile-leger',
    moyen: 'voile',
    fort: 'voile-fort',
  } as const;

  // ------------------------------------------------------------------
  //  Disposition « côté ».
  // ------------------------------------------------------------------
  if (disposition === 'cote') {
    return (
      <section className={cn('relative bg-shelldeep', className)}>
        <div
          className={cn(
            'mx-auto grid max-w-[1400px]',
            imageADroite ? 'lg:grid-cols-[1fr_minmax(0,38%)]' : 'lg:grid-cols-[minmax(0,38%)_1fr]',
          )}
        >
          {/*
            Le texte est PREMIER dans le DOM quel que soit le côté choisi :
            au clavier et au lecteur d'écran, on rencontre le message avant
            une image décorative. Seul `lg:order-*` déplace le rendu.
          */}
          <div
            className={cn(
              'flex flex-col justify-center px-5 sm:px-8',
              imageADroite ? 'lg:pr-14' : 'lg:order-2 lg:pl-14',
              HAUTEURS_COTE[hauteur],
              ALIGNS[align],
            )}
          >
            {children}
          </div>

          <div
            className={cn(
              'relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-full',
              imageADroite ? '' : 'lg:order-1',
            )}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 38vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------------
  //  Disposition « plein ».
  // ------------------------------------------------------------------
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

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-5 sm:px-8',
          ALIGNS[align],
        )}
      >
        {children}
      </div>
    </section>
  );
}
