'use client';

import Image from 'next/image';

import { Reveal, RevealVisuel } from '@/components/motion/Reveal';
import { Accordeon } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { TitreSection } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { questionsAccueil } from '@/data/faq';

// =====================================================================
//  FAQ de la page d'accueil.
//
//  Quatre questions seulement — celles qui bloquent réellement une
//  première réservation. Le reste vit sur /faq. Un accordéon de quinze
//  entrées sur la page d'accueil est un mur, pas une réponse.
//
//  L'accordéon est à gauche, un visuel à droite avec une pastille en
//  surimpression, comme sur la maquette.
// =====================================================================

export function FaqAccueil() {
  return (
    <section className="bg-canvas2 py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-start gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          {/* --- Questions --- */}
          <div className="flex flex-col gap-8">
            <TitreSection
              surtitre="Questions fréquentes"
              titre={
                <>
                  Ce qu’on nous <span className="italic text-champagne">demande le plus</span>
                </>
              }
              align="gauche"
            />

            <Reveal delai={0.08}>
              <Accordeon entrees={questionsAccueil.map((q) => ({ q: q.q, r: q.r }))} />
            </Reveal>

            <Reveal delai={0.14}>
              <Button href="/faq" variante="secondaire" fleche>
                Toutes les questions
              </Button>
            </Reveal>
          </div>

          {/* --- Visuel + pastille --- */}
          <div className="relative">
            <RevealVisuel className="relative aspect-[4/5] rounded-2xl">
              <Image
                src="/bandeaux/faq.jpg"
                alt="Détail de la cabine de soin"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </RevealVisuel>

            {/* Encart posé sur le visuel — reprend la pastille
                « Our Quality » de la maquette. */}
            <Reveal
              sens="zoom"
              delai={0.28}
              className="absolute -bottom-6 -right-4 max-w-[240px] lg:-right-8"
            >
              <div className="carte flex flex-col gap-2.5 p-5 shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas2 text-champagne">
                  <Icon nom="goutte" taille={20} />
                </span>
                <h3 className="font-display text-xl text-ink">Une question de plus ?</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Écrivez-nous, on répond dans la journée.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
