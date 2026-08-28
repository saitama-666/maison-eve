import type { MetadataRoute } from 'next';

import { DEMONSTRATION, site } from '@/data/site';

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
//  ⚠️  EN DEMONSTRATION, ON AUTORISE LE PASSAGE. CE N'EST PAS UNE ERREUR.
//
//      La version precedente ecrivait `Disallow: /`. C'etait le reflexe
//      naturel, et c'etait le mauvais reglage.
//
//      `robots.txt` regit le PASSAGE (aller chercher la page), pas
//      l'INDEXATION (l'afficher dans les resultats). La consigne
//      « ne m'indexe pas » vit dans une balise A L'INTERIEUR de la page.
//      Interdire le passage empeche donc Google de LIRE cette consigne.
//
//      Consequence : s'il apprend l'existence d'une URL autrement — un
//      lien transfere, un partage — il peut la lister toute nue, sans
//      contenu, sous « maison eve spa ». On avait ferme la porte sur le
//      mot qu'on voulait faire passer.
//
//      Ici on ouvre la porte, et chaque page porte `noindex` (voir les
//      metadonnees de `layout.tsx`, pilotees par le meme drapeau). Google
//      entre, lit la consigne, et n'indexe rien. C'est la seule
//      combinaison qui garantit l'absence des resultats.
//
//  Ce n'est PAS une protection : un robot malveillant ignore ce fichier.
//  La protection est dans `firestore.rules` et dans `requireAdmin()`.
// =====================================================================

export default function robots(): MetadataRoute.Robots {
  if (DEMONSTRATION) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/admin/', '/api/', '/compte', '/compte/', '/reservation/'],
        },
      ],
      // Pas de `sitemap` ni de `host` : un plan du site est une INVITATION
      // a indexer. On ne l'envoie qu'une fois la demonstration validee.
    };
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
