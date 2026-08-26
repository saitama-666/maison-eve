'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Lightbox } from '@/components/ui/Lightbox';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { TitreSection } from '@/components/ui/Bits';
import { galerie } from '@/data/galerie';

// =====================================================================
//  « Nos instants » — mosaïque de la page d'accueil.
//
//  Six visuels en mosaïque irrégulière, qui casse la grille et évite
//  l'effet catalogue.
//
//  Chaque vignette ouvre la visionneuse. C'est un `<button>`, pas une
//  `<div>` cliquable : le clavier et les lecteurs d'écran l'atteignent
//  sans qu'on ait à réimplémenter le rôle, le focus et la touche Entrée.
//
//  ⚠️  LA FORME DE LA TUILE SUIT LA FORME DU FICHIER, JAMAIS L'INVERSE.
//
//      La mosaïque d'origine posait cinq tuiles en paysage (≈1.7) et une
//      seule en portrait. Nos photos sont l'inverse : quatre portraits en
//      3:4 pour deux paysages. Chaque portrait perdait 55 % de sa hauteur
//      — et ça ne se voyait pas, parce qu'une photo recadrée reste une
//      photo plausible. C'est exactement ce qui rend cette erreur chère :
//      elle ne casse rien, elle abîme.
//
//      La règle tient en une ligne : un paysage prend deux colonnes, un
//      portrait une seule, et toutes les tuiles prennent deux lignes.
//      La portée n'est donc plus une constante posée à la main, elle est
//      DÉDUITE de `format`.
//
//  ⚠️  L'ARITHMÉTIQUE DOIT TOMBER JUSTE.
//      La grille fait quatre colonnes. La somme des largeurs doit être un
//      multiple de 4, sinon la dernière bande garde un trou.
//      Ici : 2 paysages ×2 + 4 portraits ×1 = 8. Si on change la
//      sélection ci-dessous, on refait ce calcul.
// =====================================================================

/** Les six visuels de la mosaïque, choisis pour que le compte tombe juste. */
const MOSAIQUE = ['hammam', 'salle-soin', 'huiles', 'savon-noir', 'the', 'ghassoul'] as const;

export function Moments() {
  const [ouvert, setOuvert] = useState<number | null>(null);
  // `flatMap` plutôt que `find` + `!` : si un nom disparaît de la galerie,
  // la tuile s'efface au lieu de faire planter le rendu.
  const visuels = MOSAIQUE.flatMap((n) => galerie.filter((v) => v.src === `/galerie/${n}.jpg`));

  return (
    <section className="bg-canvas py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <TitreSection
            surtitre="En images"
            titre={
              <>
                Nos <span className="italic text-champagne">instants</span>
              </>
            }
            texte="La cabine, le hammam, les huiles. Pour savoir où vous mettez les pieds."
            align="gauche"
          />

          <Button href="/galerie" variante="secondaire" fleche className="shrink-0">
            Toute la galerie
          </Button>
        </div>

        <RevealGroup
          intervalle={0.06}
          className="mt-12 grid auto-rows-[230px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          {visuels.map((v, i) => (
            <RevealItem
              key={v.src}
              className={
                v.format === 'paysage'
                  ? 'sm:col-span-2 sm:row-span-2'
                  : 'sm:col-span-1 sm:row-span-2'
              }
            >
              <button
                type="button"
                onClick={() => setOuvert(i)}
                aria-label={`Agrandir : ${v.legende}`}
                className="zoom-carte group relative h-full w-full overflow-hidden rounded-lg transition-transform duration-[140ms] ease-out hover:scale-[1.015] active:scale-[0.99] motion-reduce:hover:scale-100"
              >
                <Image
                  src={v.src}
                  alt={v.alt}
                  fill
                  sizes={`(max-width: 640px) 50vw, ${v.format === 'paysage' ? '50vw' : '25vw'}`}
                  className="object-cover"
                />

                {/* Légende révélée au survol, sur un dégradé pour rester
                    lisible quelle que soit la photo dessous. */}
                <span className="voile-bas absolute inset-0 opacity-0 transition-opacity duration-[240ms] group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left text-sm text-onshell opacity-0 transition-all duration-[240ms] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  {v.legende}
                </span>
              </button>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {/*
        La visionneuse reçoit `visuels`, PAS `galerie` : `ouvert` est un
        index dans les tuiles affichées. Tant que la mosaïque était un
        `slice(0, 6)` les deux coïncidaient ; avec une sélection ordonnée
        à la main, passer `galerie` ouvrirait la mauvaise photo.
      */}
      <Lightbox
        visuels={visuels}
        index={ouvert}
        fermer={() => setOuvert(null)}
        aller={(i) => setOuvert(i)}
      />
    </section>
  );
}
