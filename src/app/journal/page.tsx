import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { EnTetePage } from '@/components/layout/EnTetePage';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Badge, EtatVide } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getArticles } from '@/lib/catalogue';
import { dateLongue } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Le journal — conseils, rituels et ingrédients',
  description:
    'Le hammam expliqué, l’huile d’argan décryptée, ce qu’il faut préparer pour un soin ' +
    'à domicile. Nos conseils, sans promesse miracle.',
  alternates: { canonical: '/journal' },
};

// =====================================================================
//  Journal.
//
//  Le premier article est mis en avant en pleine largeur, les suivants en
//  grille de trois. Une grille uniforme donnerait le même poids à tout et
//  n'aiderait personne à choisir par où commencer.
// =====================================================================

export default async function PageJournal() {
  const tous = await getArticles();
  const articles = [...tous]
    .filter((a) => a.publie)
    .sort((a, b) => b.publieLe.localeCompare(a.publieLe));

  const [une, ...suite] = articles;

  return (
    <>
      <EnTetePage
        surtitre="Le journal"
        titre={
          <>
            À lire <span className="italic text-champagnesoft">avant de venir</span>
          </>
        }
        texte="Ce qu’on explique aux clientes en cabine, écrit noir sur blanc."
        image="/bandeaux/journal.jpg"
        filAriane={[{ label: 'Journal' }]}
        hauteur="court"
      />

      <section className="bg-canvas py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          {articles.length === 0 ? (
            <EtatVide
              icone="etincelle"
              titre="Aucun article pour l’instant"
              texte="Les premiers arrivent bientôt."
              action={
                <Button href="/soins" fleche>
                  Voir les soins
                </Button>
              }
            />
          ) : (
            <>
              {/* ============ À la une ============ */}
              <Reveal>
                <Link
                  href={`/journal/${une.slug}`}
                  className="carte zoom-carte group grid overflow-hidden transition-shadow duration-[240ms] hover:shadow-lift lg:grid-cols-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[420px]">
                    <Image
                      src={une.image}
                      alt={une.titre}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4">
                      <Badge ton="clair">À la une</Badge>
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-4 p-7 lg:p-12">
                    <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
                      <span className="text-champagne">{une.categorie}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={une.publieLe}>{dateLongue(une.publieLe)}</time>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Icon nom="horloge" taille={12} />
                        {une.lecture} min
                      </span>
                    </div>

                    <h2 className="font-display text-[2rem] leading-tight text-ink transition-colors duration-[140ms] group-hover:text-champagne sm:text-[2.5rem]">
                      {une.titre}
                    </h2>

                    <p className="text-[0.9375rem] leading-relaxed text-muted">{une.chapeau}</p>

                    <span className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-champagne">
                      Lire l’article
                      <Icon
                        nom="fleche-droite"
                        taille={15}
                        className="transition-transform duration-[140ms] group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>

              {/* ============ Les suivants ============ */}
              {suite.length > 0 && (
                <RevealGroup
                  intervalle={0.07}
                  className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {suite.map((a) => (
                    <RevealItem key={a.slug} className="h-full">
                      <Link
                        href={`/journal/${a.slug}`}
                        className="carte zoom-carte group flex h-full flex-col overflow-hidden transition-shadow duration-[240ms] hover:shadow-lift"
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

                          <h2 className="font-display text-[1.375rem] leading-snug text-ink transition-colors duration-[140ms] group-hover:text-champagne">
                            {a.titre}
                          </h2>

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
                    </RevealItem>
                  ))}
                </RevealGroup>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
