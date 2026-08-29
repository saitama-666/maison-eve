import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EnTetePage } from '@/components/layout/EnTetePage';
import { ProgressionLecture } from '@/components/motion/Effets';
import { Reveal } from '@/components/motion/Reveal';
import { Badge, Filet } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { site } from '@/data/site';
import { getArticleParSlug, getArticles } from '@/lib/catalogue';
import { dateLongue } from '@/lib/utils';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.filter((a) => a.publie).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleParSlug(slug);

  if (!article) return { title: 'Article introuvable' };

  return {
    title: article.titre,
    description: article.chapeau,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.titre,
      description: article.chapeau,
      publishedTime: article.publieLe,
      authors: [article.auteur],
      // Les visuels du journal sont déjà en paysage (≈1.79), donc
      // proches du 1200×630 attendu : un recadrage sur les bords, jamais
      // sur le sujet. On les garde tels quels.
      images: [{ url: article.image, width: 2400, height: 1340, alt: article.titre }],
    },
    twitter: { card: 'summary_large_image', images: [article.image] },
  };
}

// =====================================================================
//  Article du journal.
//
//  La barre de progression de lecture n'apparaît QUE sur cette page. Sur
//  une page courte elle ne dit rien d'utile et devient du décor ; sur un
//  article de cinq minutes, elle répond à « il m'en reste combien ? ».
//
//  La colonne de texte est bornée à ~68 caractères (`max-w-[68ch]`).
//  Au-delà, l'œil peine à retrouver le début de la ligne suivante — c'est
//  la mesure classique de lisibilité, et elle vaut plus qu'une préférence
//  esthétique.
// =====================================================================

export default async function PageArticle({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleParSlug(slug);

  if (!article) notFound();

  const tous = await getArticles();
  const autres = tous
    .filter((a) => a.publie && a.slug !== article.slug)
    .sort((a, b) => b.publieLe.localeCompare(a.publieLe))
    .slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titre,
    description: article.chapeau,
    image: `${site.url}${article.image}`,
    datePublished: article.publieLe,
    author: { '@type': 'Organization', name: article.auteur },
    publisher: {
      '@type': 'Organization',
      name: site.fullName,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/journal/${article.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <ProgressionLecture />

      <EnTetePage
        surtitre={article.categorie}
        titre={article.titre}
        texte={article.chapeau}
        image={article.image}
        filAriane={[{ label: 'Journal', href: '/journal' }, { label: article.titre }]}
        disposition="dessous"
      />

      <article className="bg-canvas py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[68ch] px-5 sm:px-8">
          {/* --- Métadonnées --- */}
          <div className="flex flex-wrap items-center gap-4 border-b border-line pb-6 text-sm text-muted">
            <Badge>{article.categorie}</Badge>
            <time dateTime={article.publieLe}>{dateLongue(article.publieLe)}</time>
            <span className="inline-flex items-center gap-1.5">
              <Icon nom="horloge" taille={14} className="text-champagne" />
              {article.lecture} min de lecture
            </span>
          </div>

          {/* --- Corps --- */}
          <div className="mt-10 flex flex-col gap-6">
            {article.corps.map((bloc, i) => {
              if (bloc.type === 'h2') {
                return (
                  <Reveal key={i} delai={0}>
                    <h2 className="mt-6 font-display text-[1.75rem] leading-snug text-ink sm:text-[2rem]">
                      {bloc.texte}
                    </h2>
                  </Reveal>
                );
              }

              if (bloc.type === 'liste') {
                return (
                  <Reveal key={i}>
                    <ul className="flex flex-col gap-2.5">
                      {(bloc.items ?? []).map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                          <span className="text-[1.0625rem] leading-relaxed text-inksoft">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                );
              }

              return (
                <Reveal key={i}>
                  <p className="text-[1.0625rem] leading-[1.75] text-inksoft">{bloc.texte}</p>
                </Reveal>
              );
            })}
          </div>

          <div className="my-14">
            <Filet />
          </div>

          {/* --- Appel à réserver --- */}
          <Reveal>
            <div className="carte flex flex-col items-center gap-5 p-8 text-center">
              <h2 className="font-display text-3xl text-ink">Envie d’essayer ?</h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                Réservez en quelques minutes, en ligne ou par téléphone. Vous ne réglez qu’après
                le soin.
              </p>
              <Button href="/reservation" fleche>
                Prendre rendez-vous
              </Button>
            </div>
          </Reveal>
        </div>

        {/* --- Autres articles --- */}
        {autres.length > 0 && (
          <div className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
            <h2 className="surtitre mb-6">À lire aussi</h2>

            <div className="grid gap-6 sm:grid-cols-3">
              {autres.map((a) => (
                <Reveal key={a.slug} className="h-full">
                  <Link
                    href={`/journal/${a.slug}`}
                    className="carte zoom-carte group flex h-full flex-col overflow-hidden transition-shadow duration-[240ms] hover:shadow-lift"
                  >
                    <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                      <Image
                        src={a.image}
                        alt={a.titre}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-champagne">
                        {a.categorie}
                      </span>
                      <h3 className="font-display text-xl leading-snug text-ink transition-colors duration-[140ms] group-hover:text-champagne">
                        {a.titre}
                      </h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
