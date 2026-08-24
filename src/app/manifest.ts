import type { MetadataRoute } from 'next';

import { site } from '@/data/site';

// =====================================================================
//  Manifeste d'application.
//
//  Permet d'ajouter le site à l'écran d'accueil d'un téléphone. Les
//  couleurs reprennent les jetons de `globals.css` : le moka en fond, le
//  crème en surface.
//
//  ⚠️  Les icônes ne sont pas encore fournies. Tant qu'un vrai logo
//      n'existe pas en PNG 192 et 512, on n'en déclare aucune : déclarer
//      un fichier absent fait échouer l'installation côté navigateur,
//      alors qu'un manifeste sans icône se contente d'utiliser une
//      capture de la page. Voir PROGRESS.md §11.
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
  };
}
