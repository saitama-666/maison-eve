'use client';

import Image from 'next/image';
import { useState } from 'react';

import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Lightbox } from '@/components/ui/Lightbox';
import { galerie } from '@/data/galerie';
import { cn } from '@/lib/utils';

// =====================================================================
//  Galerie complète.
//
//  Mise en page en COLONNES (`columns-*`), pas en grille. La différence
//  compte : une grille impose une hauteur de ligne commune, donc elle
//  recadre ou laisse du vide autour des visuels de formats différents.
//  Les colonnes laissent chaque visuel garder ses proportions et
//  s'empilent naturellement — c'est la mosaïque de la maquette.
//
//  Contrepartie assumée : l'ordre de lecture devient vertical par colonne
//  au lieu d'être horizontal. Pour une galerie sans ordre significatif,
//  ça n'a aucune conséquence.
// =====================================================================

export function GalerieComplete() {
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <section className="bg-canvas py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <RevealGroup
          intervalle={0.05}
          className="columns-2 gap-3 sm:gap-4 lg:columns-3 xl:columns-4"
        >
          {galerie.map((v, i) => (
            <RevealItem key={v.src} className="mb-3 break-inside-avoid sm:mb-4">
              <button
                type="button"
                onClick={() => setOuvert(i)}
                aria-label={`Agrandir : ${v.legende}`}
                className="zoom-carte group relative block w-full overflow-hidden rounded-lg transition-transform duration-[140ms] ease-out hover:scale-[1.015] active:scale-[0.99] motion-reduce:hover:scale-100"
              >
                <div
                  className={cn(
                    'relative w-full',
                    v.format === 'portrait' && 'aspect-[3/4]',
                    v.format === 'paysage' && 'aspect-[4/3]',
                    v.format === 'carre' && 'aspect-square',
                  )}
                >
                  <Image
                    src={v.src}
                    alt={v.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>

                <span className="voile-bas absolute inset-0 opacity-0 transition-opacity duration-[240ms] group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left text-sm text-onshell opacity-0 transition-all duration-[240ms] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  {v.legende}
                </span>
              </button>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <Lightbox
        visuels={galerie}
        index={ouvert}
        fermer={() => setOuvert(null)}
        aller={(i) => setOuvert(i)}
      />
    </section>
  );
}
