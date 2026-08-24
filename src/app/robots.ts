import type { MetadataRoute } from 'next';

import { site } from '@/data/site';

// =====================================================================
//  robots.txt
//
//  On interdit explicitement ce qui n'a rien à faire dans un index :
//  l'espace client, le back-office, les routes API et le tunnel de
//  réservation (dont les URL à paramètres créeraient des doublons).
//
//  Ce n'est PAS une protection : un robot malveillant ignore ce fichier.
//  La protection est dans `firestore.rules` et dans `requireAdmin()`.
// =====================================================================

export default function robots(): MetadataRoute.Robots {
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
