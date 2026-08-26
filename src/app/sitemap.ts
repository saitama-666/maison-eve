import type { MetadataRoute } from 'next';

import { site } from '@/data/site';
import { getArticles, getServices } from '@/lib/catalogue';

// =====================================================================
//  Plan du site.
//
//  Construit depuis le catalogue RÉEL, pas depuis une liste écrite à la
//  main : un soin ajouté dans le back-office apparaît automatiquement, et
//  un soin désactivé disparaît. Une liste manuelle finit toujours par
//  pointer vers des pages mortes.
//
//  Sont exclus : l'espace client, le back-office, les routes API et le
//  tunnel de réservation. Ces pages sont personnelles ou sans intérêt
//  pour un moteur de recherche.
// =====================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, articles] = await Promise.all([getServices(), getArticles()]);
  const maintenant = new Date();

  const pagesFixes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: maintenant, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/soins`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.9 },
    // La page qui convertit. Elle était absente du plan alors que
    // `robots.ts` l'autorise — on la déclarait indexable sans jamais la
    // proposer. Seules ses sous-pages `/reservation/<id>`, personnelles,
    // restent exclues.
    {
      url: `${site.url}/reservation`,
      lastModified: maintenant,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    { url: `${site.url}/a-propos`, lastModified: maintenant, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/galerie`, lastModified: maintenant, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/journal`, lastModified: maintenant, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${site.url}/contact`, lastModified: maintenant, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/faq`, lastModified: maintenant, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/cgv`, lastModified: maintenant, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site.url}/confidentialite`, lastModified: maintenant, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site.url}/mentions-legales`, lastModified: maintenant, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const pagesSoins: MetadataRoute.Sitemap = services
    .filter((s) => s.actif)
    .map((s) => ({
      url: `${site.url}/soins/${s.slug}`,
      lastModified: maintenant,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  const pagesJournal: MetadataRoute.Sitemap = articles
    .filter((a) => a.publie)
    .map((a) => ({
      url: `${site.url}/journal/${a.slug}`,
      // La date de publication de l'article, pas celle du build : dire à
      // Google qu'un article de l'an dernier a changé aujourd'hui est
      // faux, et il finit par ne plus croire le fichier.
      lastModified: new Date(a.publieLe),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    }));

  return [...pagesFixes, ...pagesSoins, ...pagesJournal];
}
