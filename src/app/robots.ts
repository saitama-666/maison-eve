import type { MetadataRoute } from 'next';

import { site } from '@/data/site';

// =====================================================================
//  robots.txt
//
//  ⚠️  DEMONSTRATION — INDEXATION INTERDITE POUR L'INSTANT
//
//  Ce site porte le nom, l'adresse, le telephone et les tarifs reels de
//  Maison Eve, qui n'a pas encore valide sa mise en ligne. Laisser Google
//  l'indexer creerait une seconde adresse a leur nom, en concurrence avec
//  leurs vraies fiches — un tort pour eux et un risque pour nous.
//
//  Le jour ou l'institut valide : passer DEMONSTRATION a false. Le fichier
//  reprend alors son comportement normal (tout indexable sauf l'espace
//  client, le back-office, les routes API et le tunnel de reservation,
//  dont les URL a parametres creeraient des doublons).
//
//  Ce n'est PAS une protection : un robot malveillant ignore ce fichier.
//  La protection est dans `firestore.rules` et dans `requireAdmin()`.
// =====================================================================

const DEMONSTRATION = true;

export default function robots(): MetadataRoute.Robots {
  if (DEMONSTRATION) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/compte', '/compte/', '/reservation/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
