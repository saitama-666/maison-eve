import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { LigneSoin } from '@/components/soins/CarteSoin';
import { Badge, Encart, Filet } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { categories } from '@/data/services';
import { site } from '@/data/site';
import { getServiceParSlug, getServices } from '@/lib/catalogue';
import { duree, prix } from '@/lib/utils';

// =====================================================================
//  Fiche d'un soin.
//
//  Elle doit répondre à tout ce qui empêche de réserver : combien de
//  temps, combien ça coûte, ce qui se passe pendant, et si on peut
//  l'avoir chez soi. D'où le déroulé étape par étape — c'est la partie
//  que les gens lisent réellement avant un premier rendez-vous.
// =====================================================================

type Params = { params: Promise<{ slug: string }> };

/**
 * Pré-génère une page par soin au build.
 *
 * Le catalogue est petit et change rarement : tout générer coûte quelques
 * secondes de build et évite un rendu à la demande au premier visiteur.
 */
export async function generateStaticParams() {
  const services = await getServices();
  return services.filter((s) => s.actif).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceParSlug(slug);

  if (!service) {
    return { title: 'Soin introuvable' };
  }

  return {
    title: `${service.nom} — ${duree(service.duree)}`,
    description: `${service.resume} ${prix(service.prix)} en institut${
      service.domicileDisponible ? `, ${prix(service.prix + service.supplementDomicile)} à domicile` : ''
    }.`,
    alternates: { canonical: `/soins/${service.slug}` },
    openGraph: {
      title: `${service.nom} · ${site.name}`,
      description: service.resume,
      images: [{ url: service.image }],
    },
  };
}

export default async function PageSoin({ params }: Params) {
  const { slug } = await params;
  const service = await getServiceParSlug(slug);

  if (!service) notFound();

  const tous = await getServices();
  const categorie = categories.find((c) => c.id === service.categorie);

  // Soins proches : même catégorie d'abord, complétés par les populaires
  // pour toujours en proposer trois. Une colonne à un seul élément a l'air
  // cassée.
  const memeCategorie = tous.filter(
    (s) => s.actif && s.categorie === service.categorie && s.id !== service.id,
  );
  const complement = tous.filter(
    (s) => s.actif && s.categorie !== service.categorie && s.populaire,
  );
  const proches = [...memeCategorie, ...complement].slice(0, 4);

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.nom,
    description: service.resume,
    serviceType: categorie?.nom,
    provider: { '@type': 'DaySpa', name: site.fullName, url: site.url },
    offers: {
      '@type': 'Offer',
      price: service.prix,
      priceCurrency: site.currency,
      availability: 'https://schema.org/InStock',
      url: `${site.url}/soins/${service.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <EnTetePage
        surtitre={categorie?.nom}
        titre={service.nom}
        texte={service.resume}
        image={service.image}
        filAriane={[{ label: 'Soins', href: '/soins' }, { label: service.nom }]}
      />

      <section className="bg-canvas py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-16">
          {/* ============ Colonne principale ============ */}
          <div className="flex flex-col gap-12">
            {/* --- Description --- */}
            <Reveal className="flex flex-col gap-5">
              {service.description.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'font-display text-2xl leading-relaxed text-ink sm:text-[1.75rem]'
                      : 'text-[0.9375rem] leading-relaxed text-muted'
                  }
                >
                  {p}
                </p>
              ))}
            </Reveal>

            <Filet />

            {/* --- Bienfaits --- */}
            {service.bienfaits.length > 0 && (
              <div className="flex flex-col gap-6">
                <Reveal>
                  <h2 className="font-display text-3xl text-ink">Ce que ça vous apporte</h2>
                </Reveal>

                <RevealGroup intervalle={0.06} className="grid gap-3 sm:grid-cols-2">
                  {service.bienfaits.map((b) => (
                    <RevealItem key={b}>
                      <div className="flex items-start gap-3 rounded-lg bg-canvas2 px-4 py-3.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne text-surchampagne">
                          <Icon nom="check" taille={11} trait={2.4} />
                        </span>
                        <span className="text-sm leading-snug text-inksoft">{b}</span>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            )}

            {/* --- Déroulé --- */}
            {service.deroule.length > 0 && (
              <div className="flex flex-col gap-6">
                <Reveal>
                  <h2 className="font-display text-3xl text-ink">Comment ça se passe</h2>
                </Reveal>

                <RevealGroup intervalle={0.08} className="flex flex-col">
                  {service.deroule.map((e, i) => (
                    <RevealItem key={e.titre}>
                      <div className="flex gap-5 border-b border-linesoft py-5 last:border-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagnepale/60 font-display text-lg text-champagne tabular">
                          {i + 1}
                        </span>
                        <div className="flex flex-col gap-1">
                          <h3 className="font-display text-xl text-ink">{e.titre}</h3>
                          <p className="text-sm leading-relaxed text-muted">{e.texte}</p>
                        </div>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            )}

            {/* --- Précautions ---
                Obligatoire sur un site de soins. Elle protège la cliente
                ET l'institut, et elle doit rester visible sans avoir à la
                chercher. */}
            <Reveal>
              <Encart ton="attention" titre="À signaler avant le soin">
                Grossesse, opération récente, problème circulatoire, allergie (notamment aux
                fruits à coque pour l’argan), traitement en cours. Dites-le à la réservation :
                on adapte, ou on vous oriente vers un autre soin. Un institut ne remplace pas
                un avis médical.
              </Encart>
            </Reveal>
          </div>

          {/* ============ Carte de réservation ============
              `sticky` : elle suit la lecture. C'est l'action principale de
              la page, elle ne doit jamais être hors de portée. */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <Reveal sens="zoom">
              <div className="carte overflow-hidden shadow-soft">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="380px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col gap-5 p-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge icone="horloge">{duree(service.duree)}</Badge>
                    {categorie && <Badge>{categorie.nom}</Badge>}
                    {service.domicileDisponible ? (
                      <Badge ton="champagne" icone="maison">
                        À domicile possible
                      </Badge>
                    ) : (
                      <Badge>En institut uniquement</Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted">En institut</span>
                      <span className="font-display text-3xl text-ink tabular">
                        {prix(service.prix)}
                      </span>
                    </div>

                    {service.domicileDisponible && (
                      <div className="flex items-baseline justify-between gap-3 border-t border-linesoft pt-2.5">
                        <span className="text-sm text-muted">À domicile</span>
                        <span className="font-display text-2xl text-ink tabular">
                          {prix(service.prix + service.supplementDomicile)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button href={`/reservation?soin=${service.slug}`} pleineLargeur fleche>
                    Réserver ce soin
                  </Button>

                  <p className="text-center text-xs leading-relaxed text-faint">
                    Aucun paiement en ligne. Vous réglez sur place, à la fin du soin.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* --- Soins proches --- */}
            {proches.length > 0 && (
              <Reveal delai={0.1} className="mt-8">
                <h2 className="surtitre mb-3">Autres soins</h2>
                <div className="carte px-5 py-2">
                  {proches.map((s) => (
                    <LigneSoin key={s.id} service={s} />
                  ))}
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
