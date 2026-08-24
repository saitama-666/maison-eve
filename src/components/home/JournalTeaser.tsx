import Image from 'next/image';
import Link from 'next/link';

import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Badge, TitreSection } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { Article } from '@/data/journal';
import { dateLongue } from '@/lib/utils';

// =====================================================================
//  Derniers articles du journal.
//
//  Trois cartes, comme sur la maquette. Elles servent le référencement
//  (des pages de contenu qui répondent à de vraies recherches) autant que
//  la confiance : un institut qui explique le hammam sait de quoi il parle.
// =====================================================================

export function JournalTeaser({ articles }: { articles: readonly Article[] }) {
  const derniers = [...articles]
    .filter((a) => a.publie)
    .sort((a, b) => b.publieLe.localeCompare(a.publieLe))
    .slice(0, 3);

  if (derniers.length === 0) return null;

  return (
    <section className="bg-canvas py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <TitreSection
            surtitre="Le journal"
            titre={
              <>
                À lire <span className="italic text-champagne">avant de venir</span>
              </>
            }
            texte="Le hammam expliqué, l’argan décrypté, et ce qu’il faut préparer chez soi."
            align="gauche"
          />

          <Button href="/journal" variante="secondaire" fleche className="shrink-0">
            Tous les articles
          </Button>
        </div>

        <RevealGroup intervalle={0.08} className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {derniers.map((a) => (
            <RevealItem key={a.slug} className="h-full">
              <article className="group h-full transition-transform duration-[140ms] ease-out hover:-translate-y-1.5">
                <Link
                  href={`/journal/${a.slug}`}
                  className="carte zoom-carte flex h-full flex-col overflow-hidden transition-shadow duration-[240ms] hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                    <Image
                      src={a.image}
                      alt={a.titre}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute left-3 top-3">
                      <Badge ton="clair">{a.categorie}</Badge>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
                      <time dateTime={a.publieLe}>{dateLongue(a.publieLe)}</time>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Icon nom="horloge" taille={12} />
                        {a.lecture} min
                      </span>
                    </div>

                    <h3 className="font-display text-[1.375rem] leading-snug text-ink transition-colors duration-[140ms] group-hover:text-champagne">
                      {a.titre}
                    </h3>

                    <p className="flex-1 text-sm leading-relaxed text-muted">{a.chapeau}</p>

                    <span className="mt-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-champagne">
                      Lire
                      <Icon
                        nom="fleche-droite"
                        taille={14}
                        className="transition-transform duration-[140ms] group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
