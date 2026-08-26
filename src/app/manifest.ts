import type { MetadataRoute } from 'next';

import { site } from '@/data/site';

// =====================================================================
//  Manifeste d'application.
//
//  Permet d'ajouter le site à l'écran d'accueil d'un téléphone. Les
//  couleurs reprennent les jetons de `globals.css` : le moka en fond, le
//  crème en surface.
//
//  Les icônes existent désormais : le lotus de `Logo.tsx`, rastérisé en
//  PNG. La version « maskable » porte une marge, parce qu'Android rogne
//  l'icône dans un cercle de 80 % — sans marge, il mange les pétales.
//
//  ⚠️  Ne déclarer que des fichiers qui existent VRAIMENT : un manifeste
//      qui pointe vers une icône absente fait échouer l'installation,
//      alors qu'un manifeste sans icône se contente d'une capture.
// =====================================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.fullName,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f1ea',
    theme_color: '#6f5f52',
    lang: 'fr',
    categories: ['beauty', 'health', 'lifestyle'],
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icones/icone-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
