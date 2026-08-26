// =====================================================================
//  Galerie et avis clientes.
//
//  ⚠️  DÉCISION VOLONTAIRE : `avis` est VIDE.
//
//  Publier des témoignages inventés est un mensonge commercial, et
//  publier un `aggregateRating` fabriqué dans les données structurées
//  envoie ce mensonge directement à Google. Le problème existe déjà sur
//  l'autre site de Hamza et attend d'être purgé — on ne le recrée pas ici.
//
//  Le composant `Temoignages` sait gérer la liste vide : il affiche une
//  invitation à laisser le premier avis au lieu d'un carrousel truqué.
//  Les vrais avis arrivent par la collection Firestore `reviews`, et ne
//  s'affichent qu'une fois modérés (`published: true`).
// =====================================================================

export type Avis = {
  id: string;
  nom: string;
  soin: string;
  note: 1 | 2 | 3 | 4 | 5;
  texte: string;
  date: string;
};

/** Vide, et ça doit le rester tant qu'aucune vraie cliente n'a écrit. */
export const avis: readonly Avis[] = [];

export type Visuel = {
  src: string;
  alt: string;
  /** Format d'affichage dans la mosaïque. */
  format: 'portrait' | 'paysage' | 'carre';
  legende: string;
};

/**
 * Visuels de la galerie.
 *
 * ⚠️  LE FORMAT DÉCLARÉ DOIT SUIVRE LE FORMAT DU FICHIER, JAMAIS
 *     L'INVERSE.
 *
 *     `format` choisit le cadre de la tuile : portrait → 3/4,
 *     paysage → 4/3, carré → 1/1. L'image est ensuite recadrée en
 *     `object-cover` pour le remplir. Déclarer `paysage` sur une photo
 *     en portrait lui coupe 44 % de sa hauteur — le sujet disparaît et
 *     personne ne voit passer l'erreur, parce qu'une image recadrée
 *     reste une image plausible.
 *
 *     Ici : `hammam` et `ghassoul` sont les deux seuls fichiers
 *     réellement en paysage. Tous les autres sont en 3:4. `carré` ne
 *     coupe que 25 %, réservé aux gros plans d'objets centrés.
 *
 * ⚠️  Ce sont des visuels générés, pas des photos de l'institut. À
 *     remplacer par de vraies prises de vue — voir PROGRESS.md §11.
 */
export const galerie: readonly Visuel[] = [
  { src: '/galerie/salle-soin.jpg', alt: 'Cabine de soin, lumière tamisée', format: 'portrait', legende: 'La cabine' },
  { src: '/galerie/huiles.jpg', alt: 'Flacons d’huiles végétales sur un plateau', format: 'carre', legende: 'Les huiles' },
  { src: '/galerie/hammam.jpg', alt: 'Salle de hammam en tadelakt', format: 'paysage', legende: 'Le hammam' },
  { src: '/galerie/savon-noir.jpg', alt: 'Savon noir et gant de kessa', format: 'carre', legende: 'Le savon noir' },
  { src: '/galerie/the.jpg', alt: 'Théière et verres à thé', format: 'portrait', legende: 'La pause thé' },
  { src: '/galerie/serviettes.jpg', alt: 'Serviettes roulées et fleurs séchées', format: 'carre', legende: 'Les serviettes' },
  { src: '/galerie/ghassoul.jpg', alt: 'Ghassoul et eau de rose', format: 'paysage', legende: 'Le ghassoul' },
  { src: '/galerie/accueil.jpg', alt: 'Entrée de l’institut', format: 'portrait', legende: 'L’accueil' },
] as const;

/**
 * Étapes affichées sur la page « À propos ».
 * [placeholder] — les dates et les faits sont à confirmer par Hamza.
 */
export const histoire = [
  {
    annee: '[année]',
    titre: 'L’idée',
    texte:
      'Un constat simple : à Casablanca, on trouve des spas d’hôtel et des hammams de quartier, ' +
      'mais très peu d’endroits entre les deux. [à compléter par Hamza]',
  },
  {
    annee: '[année]',
    titre: 'L’ouverture',
    texte: 'Ouverture de l’institut. [à compléter — lieu, taille, équipe de départ]',
  },
  {
    annee: '[année]',
    titre: 'Les soins à domicile',
    texte:
      'La demande venait des clientes elles-mêmes : venir chez elles, avec la table et les huiles. ' +
      '[à compléter par Hamza]',
  },
] as const;
