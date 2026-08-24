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
//  Six visuels en mosaïque irrégulière : deux occupent deux lignes, ce
//  qui casse la grille et évite l'effet catalogue. La composition est
//  celle de la maquette.
//
//  Chaque vignette ouvre la visionneuse. C'est un `<button>`, pas une
//  `<div>` cliquable : le clavier et les lecteurs d'écran l'atteignent
//  sans qu'on ait à réimplémenter le rôle, le focus et la touche Entrée.
// =====================================================================

/** Les six premiers visuels, avec leur portée dans la grille. */
const PORTEE = [
  'sm:col-span-2 sm:row-span-2',
  'sm:col-span-1 sm:row-span-1',
  'sm:col-span-1 sm:row-span-1',
  'sm:col-span-1 sm:row-span-2',
  'sm:col-span-1 sm:row-span-1',
  'sm:col-span-1 sm:row-span-1',
];

export function Moments() {
  const [ouvert, setOuvert] = useState<number | null>(null);
  const visuels = galerie.slice(0, 6);

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
          className="mt-12 grid auto-rows-[190px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          {visuels.map((v, i) => (
            <RevealItem key={v.src} className={PORTEE[i] ?? ''}>
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
                  sizes="(max-width: 640px) 50vw, 25vw"
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

      <Lightbox
        visuels={galerie}
        index={ouvert}
        fermer={() => setOuvert(null)}
        aller={(i) => setOuvert(i)}
      />
    </section>
  );
}
