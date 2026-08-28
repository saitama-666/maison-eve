import Image from 'next/image';

import { Reveal, RevealVisuel } from '@/components/motion/Reveal';
import { TexteAnime } from '@/components/motion/Effets';
import { Button } from '@/components/ui/Button';
import { LotusMark } from '@/components/ui/Logo';
import { contact } from '@/data/site';

// =====================================================================
//  « Le calme, chez vous ou chez nous »
//
//  Section de présentation, reprise de la maquette : texte à gauche,
//  visuel à droite avec une pastille circulaire qui déborde.
//
//  Le visuel se dévoile derrière un rideau qui monte, pendant que l'image
//  dé-zoome — deux mouvements en sens inverse, ce qui donne la profondeur.
//  Voir `RevealVisuel`.
// =====================================================================

/**
 * Identifiant du tracé circulaire du texte tournant.
 *
 * Écrit en dur, et c'est volontaire : `useId()` aurait obligé ce composant
 * à devenir client, donc à embarquer du JavaScript pour une section qui
 * n'a aucun état. La section n'est rendue qu'une fois par page — si un
 * jour elle devait l'être deux fois, il faudrait suffixer cet identifiant.
 */
const ID_CERCLE = 'cercle-texte-presentation';

export function Presentation() {
  return (
    <section className="bg-canvas py-14 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 sm:gap-12 sm:px-8 lg:grid-cols-2 lg:gap-20">
        {/* --- Texte --- */}
        <div className="flex flex-col items-start gap-6">
          <Reveal>
            <span className="surtitre">La maison</span>
          </Reveal>

          <h2 className="font-display text-[2.25rem] leading-[1.08] text-ink sm:text-[3rem] lg:text-[3.5rem]">
            <TexteAnime texte="Le calme," />
            <br />
            <span className="italic text-champagne">
              <TexteAnime texte="chez vous ou chez nous." delai={0.12} />
            </span>
          </h2>

          <Reveal delai={0.1}>
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">
              MAISON EVE est né d’un constat simple : à {contact.city}, on trouve des spas
              d’hôtel et des hammams de quartier, mais peu d’endroits entre les deux. Un lieu
              soigné, à taille humaine, où l’on connaît votre prénom.
            </p>
          </Reveal>

          <Reveal delai={0.16}>
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">
              Et parce que sortir n’est pas toujours possible, nos praticiennes se déplacent :
              elles apportent la table, les serviettes chaudes et les huiles. Vous n’avez rien à
              préparer, rien à ranger.
            </p>
          </Reveal>

          <Reveal delai={0.22} className="mt-2">
            <Button href="/a-propos" variante="secondaire" fleche>
              Notre histoire
            </Button>
          </Reveal>
        </div>

        {/* --- Visuel --- */}
        <div className="relative">
          <RevealVisuel className="relative aspect-[4/5] rounded-2xl">
            <Image
              src="/bandeaux/institut.jpg"
              alt="La cabine de soin de MAISON EVE"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </RevealVisuel>

          {/* Pastille circulaire qui déborde du visuel, comme sur la
              maquette. Elle tourne lentement — c'est le seul mouvement
              permanent de la page, et il est assez lent (26 s) pour ne
              pas attirer l'œil pendant la lecture. */}
          <Reveal
            sens="zoom"
            delai={0.3}
            className="absolute -bottom-7 -left-7 hidden sm:block lg:-left-10"
          >
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-card shadow-lift lg:h-36 lg:w-36">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
                <defs>
                  <path id={ID_CERCLE} d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                </defs>
                <text className="fill-muted text-[8.5px] uppercase tracking-[0.3em]">
                  <textPath href={`#${ID_CERCLE}`} startOffset="0%">
                    Beauty &amp; Spa · Maison Eve · Témara ·
                  </textPath>
                </text>
              </svg>
              <LotusMark taille={34} className="text-champagne" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
