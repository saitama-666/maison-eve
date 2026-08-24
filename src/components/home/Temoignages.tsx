'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import { Reveal } from '@/components/motion/Reveal';
import { BoutonRond, Button } from '@/components/ui/Button';
import { Etoiles, TitreSection } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { avis as avisStatiques, type Avis } from '@/data/galerie';
import { dateLongue } from '@/lib/utils';

// =====================================================================
//  Avis clientes.
//
//  ⚠️  DÉCISION IMPORTANTE, À NE PAS DÉFAIRE :
//      `src/data/galerie.ts` exporte une liste d'avis VIDE, et ce
//      composant sait l'afficher.
//
//      Remplir cette liste de témoignages inventés serait un mensonge
//      commercial. Et ajouter un `aggregateRating` fabriqué dans les
//      données structurées enverrait ce mensonge directement à Google,
//      qui l'afficherait sous forme d'étoiles dans ses résultats.
//      Le même problème existe déjà sur l'autre site de Hamza et attend
//      d'être purgé — on ne le recrée pas ici.
//
//      Tant qu'aucune vraie cliente n'a écrit, la section affiche une
//      invitation honnête. Ça vaut mieux qu'un carrousel truqué, et
//      c'est même plus convaincant : personne ne croit aux cinq
//      témoignages parfaits d'un site qui vient d'ouvrir.
//
//  Les vrais avis arriveront de Firestore (`reviews`), et seulement une
//  fois modérés (`published: true`).
// =====================================================================

export function Temoignages({ liste = avisStatiques }: { liste?: readonly Avis[] }) {
  if (liste.length === 0) {
    return <SectionSansAvis />;
  }
  return <Carrousel liste={liste} />;
}

/** État honnête : aucune cliente n'a encore écrit. */
function SectionSansAvis() {
  return (
    <section className="bg-canvas2 py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <TitreSection
          surtitre="Vos retours"
          titre={
            <>
              Le premier avis, <span className="italic text-champagne">c’est le vôtre</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />

        <Reveal sens="zoom" delai={0.1} className="mx-auto mt-10 max-w-2xl">
          <div className="carte flex flex-col items-center gap-5 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas2 text-champagne">
              <Icon nom="etincelle" taille={26} />
            </span>

            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">
              Nous préférons n’afficher aucun avis plutôt que d’en inventer. Si vous êtes
              déjà venue, votre retour aidera la prochaine personne à se décider.
            </p>

            <Button href="/contact?sujet=avis" variante="secondaire" fleche>
              Laisser un avis
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Carrousel — utilisé dès qu'il existe de vrais avis modérés. */
function Carrousel({ liste }: { liste: readonly Avis[] }) {
  const [index, setIndex] = useState(0);
  // Mémorise le SENS du dernier déplacement : l'avis entre du côté
  // opposé à celui par lequel le précédent est sorti. Sans ça, les deux
  // arrivent toujours de la droite et le mouvement ne dit plus rien.
  const [sens, setSens] = useState(1);

  const suivant = useCallback(() => {
    setSens(1);
    setIndex((i) => (i + 1) % liste.length);
  }, [liste.length]);

  const precedent = useCallback(() => {
    setSens(-1);
    setIndex((i) => (i - 1 + liste.length) % liste.length);
  }, [liste.length]);

  // Défilement automatique, suspendu si la personne préfère moins de
  // mouvement — un carrousel qui avance seul est exactement ce que
  // `prefers-reduced-motion` vise.
  useEffect(() => {
    if (liste.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const minuteur = setInterval(suivant, 7000);
    return () => clearInterval(minuteur);
  }, [suivant, liste.length]);

  const actuel = liste[index];

  return (
    <section className="bg-canvas2 py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <TitreSection
          surtitre="Vos retours"
          titre={
            <>
              Ce qu’en disent <span className="italic text-champagne">nos clientes</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />

        <div className="mx-auto mt-12 max-w-3xl">
          {/* Hauteur minimale fixe : sans elle, un avis court puis un avis
              long font sauter toute la section à chaque transition. */}
          <div className="relative min-h-[260px]">
            {/*
              L'avis est remonté à chaque changement (`key`), ce qui relance
              l'animation CSS `.glisser`. Le sens de lecture — d'où arrive
              l'avis — est passé en variable CSS.

              Il partait auparavant de `opacity: 0` sous Framer : sans
              boucle d'animation, le carrousel restait bloqué sur un cadre
              vide dès le premier clic sur une flèche.
            */}
            <blockquote
              key={actuel.id}
              className="glisser flex flex-col items-center gap-5 text-center"
              style={{ '--glisse-de': `${sens * 40}px` } as CSSProperties}
            >
                <Etoiles note={actuel.note} taille={17} />

                <p className="font-display text-2xl leading-snug text-ink sm:text-[1.75rem]">
                  « {actuel.texte} »
                </p>

                <footer className="flex flex-col items-center gap-1">
                  <cite className="font-sans text-sm not-italic text-ink">{actuel.nom}</cite>
                  <span className="text-xs text-muted">
                    {actuel.soin} · {dateLongue(actuel.date)}
                  </span>
                </footer>
            </blockquote>
          </div>

          {/* --- Commandes --- */}
          {liste.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <BoutonRond icone="fleche-gauche" label="Avis précédent" onClick={precedent} />

              <div className="flex items-center gap-2" role="tablist" aria-label="Avis">
                {liste.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Avis ${i + 1} sur ${liste.length}`}
                    onClick={() => {
                      setSens(i > index ? 1 : -1);
                      setIndex(i);
                    }}
                    className="group flex h-6 items-center px-0.5"
                  >
                    <span
                      className={
                        i === index
                          ? 'h-1.5 w-6 rounded-full bg-champagne transition-all duration-[240ms]'
                          : 'h-1.5 w-1.5 rounded-full bg-line transition-all duration-[240ms] group-hover:bg-champagne/50'
                      }
                    />
                  </button>
                ))}
              </div>

              <BoutonRond icone="fleche-droite" label="Avis suivant" onClick={suivant} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
