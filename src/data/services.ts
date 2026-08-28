// =====================================================================
//  Catalogue de soins — repli statique.
//
//  Firestore fait autorité en production (collection `services`, éditable
//  depuis /admin). Ce fichier est le FILET DE SÉCURITÉ : si Firestore est
//  absent, mal configuré ou en panne, le site continue d'afficher son
//  catalogue au lieu d'afficher une page vide. Voir `src/lib/catalogue.ts`.
//
//  ---------------------------------------------------------------------
//  TARIFS — RELEVÉS SUR LA GRILLE OFFICIELLE DE MAISON EVE (27/08/2026)
//  ---------------------------------------------------------------------
//  Source : publication épinglée @maison_eve_spa « Notre nouvelle grille
//  tarifaire », carrousel de 11 visuels, publié le 12 janvier 2026.
//  https://www.instagram.com/p/DTbD48dCNLP/
//  Relevé complet : `CLAUDE MARKETING/clicklab/prospects/maison-eve-tarifs.md`
//
//  ✅ PRIX et INCLUSIONS : réels, relevés sur leurs propres visuels.
//  ⚠️  DURÉES : Maison Eve ne publie de durée que pour les massages. Les
//      autres sont des LONGUEURS DE CRÉNEAU estimées — nécessaires au
//      moteur de réservation, pas des engagements. À confirmer.
//  ⚠️  TEXTES DESCRIPTIFS (resume, description, bienfaits, deroule) :
//      rédactionnels, à faire valider par Yasmine avant mise en ligne.
//  ⚠️  DOMICILE : aucune prestation à domicile n'est annoncée par Maison
//      Eve. Tout est à `false`. Ne pas activer sans confirmation.
//
//  Prestations à la carte (coiffure, mains & pieds, cils, épilation) :
//  voir l'export `tarifsALaCarte` en bas de fichier.
// =====================================================================

export type CategorieId = 'massages' | 'visage' | 'corps' | 'rituels';

export type Categorie = {
  id: CategorieId;
  nom: string;
  slug: string;
  resume: string;
};

export const categories: readonly Categorie[] = [
  {
    id: 'corps',
    nom: 'Hammam & spa',
    slug: 'hammam-spa',
    resume: 'Quatre formules, du hammam traditionnel au Majestic.',
  },
  {
    id: 'massages',
    nom: 'Massages',
    slug: 'massages',
    resume: 'Relâcher les tensions, retrouver le sommeil, respirer plus bas.',
  },
  {
    id: 'visage',
    nom: 'Soins du visage',
    slug: 'soins-du-visage',
    resume: 'Nettoyer, hydrater, apaiser. Sans agresser la peau.',
  },
  {
    id: 'rituels',
    nom: 'Beauté & coiffure',
    slug: 'beaute-coiffure',
    resume: 'Ongles, cils, épilation, coiffure. Le rendez-vous complet.',
  },
] as const;

export type Service = {
  id: string;
  slug: string;
  nom: string;
  categorie: CategorieId;
  /** Une phrase, affichée sur la carte du catalogue. */
  resume: string;
  /** Paragraphes de la fiche détaillée. */
  description: readonly string[];
  /** Durée en minutes. Réelle pour les massages, créneau estimé ailleurs. */
  duree: number;
  /** Tarif en institut, en dirhams. Relevé sur la grille officielle. */
  prix: number;
  /** Supplément domicile. Maison Eve n'en propose pas : 0 partout. */
  supplementDomicile: number;
  /** Aucune prestation à domicile annoncée : `false` partout. */
  domicileDisponible: boolean;
  /** Visuel principal — fichier dans `public/soins/`. */
  image: string;
  bienfaits: readonly string[];
  /** Le déroulé du soin, étape par étape. Rassure avant de réserver. */
  deroule: readonly { titre: string; texte: string }[];
  /** Mis en avant sur la page d'accueil. */
  populaire: boolean;
  actif: boolean;
  ordre: number;
};

/** Les cinq saveurs de hammam proposées, selon disponibilité. */
export const saveursHammam = [
  'Rose',
  'Fleur d’oranger',
  'Eucalyptus',
  'Jasmin',
  'Coco, à base d’huile de coco bio africain',
] as const;

/** Le Majestic a ses propres saveurs. */
export const saveursMajestic = ['Oud', 'Fleur d’oranger'] as const;

export const services: readonly Service[] = [
  // ---------------------------------------------------------------
  //  HAMMAM & SPA — 4 formules, prix et inclusions officiels
  // ---------------------------------------------------------------
  {
    id: 'hammam-traditionnel',
    slug: 'hammam-traditionnel',
    nom: 'Hammam traditionnel',
    categorie: 'corps',
    resume: 'Le rituel de base, complet. Un gommage corporel offert.',
    description: [
      'Le hammam marocain dans sa forme la plus simple et la plus efficace : la vapeur, le savon noir, ' +
        'le gant. La peau est débarrassée, la circulation relancée.',
      'La formule comprend le gommage traditionnel ou au savon noir, la tebrima, le gommage, le lavage ' +
        'des cheveux et le savonnage. Un gommage corporel est offert.',
    ],
    duree: 45,
    prix: 120,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/hammam-traditionnel.jpg',
    bienfaits: [
      'Débarrasse la peau des cellules mortes',
      'Ouvre les pores et nettoie en profondeur',
      'Relance la circulation',
      'Un gommage corporel offert',
    ],
    deroule: [
      { titre: 'La vapeur', texte: 'Le temps qu’il faut pour que la peau s’ouvre.' },
      { titre: 'Le gommage', texte: 'Savon noir ou gommage traditionnel, tebrima, gommage au gant.' },
      { titre: 'Le lavage', texte: 'Lavage des cheveux et savonnage pour finir.' },
    ],
    populaire: true,
    actif: true,
    ordre: 1,
  },
  {
    id: 'hammam-charme-orient',
    slug: 'hammam-charme-d-orient',
    nom: 'Hammam charme d’orient',
    categorie: 'corps',
    resume: 'Le hammam parfumé à la saveur de votre choix, massage de 10 min inclus.',
    description: [
      'Le rituel traditionnel, mais parfumé. Vous choisissez la saveur — rose, fleur d’oranger, ' +
        'eucalyptus ou jasmin — et le savon noir est préparé à partir de celle-ci.',
      'La formule comprend le gommage traditionnel au savon noir selon la saveur choisie, la tebrima ME, ' +
        'le gommage corporel, le savonnage Maison Eve et un massage de 10 minutes.',
    ],
    duree: 60,
    prix: 150,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/hammam-charme-orient.jpg',
    bienfaits: [
      'Quatre saveurs au choix',
      'Savonnage Maison Eve',
      'Massage de 10 minutes inclus',
      'La peau reste parfumée',
    ],
    deroule: [
      { titre: 'Le choix', texte: 'Rose, fleur d’oranger, eucalyptus ou jasmin — selon la disponibilité.' },
      { titre: 'Le rituel', texte: 'Savon noir parfumé, tebrima ME, gommage corporel, savonnage Maison Eve.' },
      { titre: 'Le massage', texte: '10 minutes pour finir en douceur.' },
    ],
    populaire: true,
    actif: true,
    ordre: 2,
  },
  {
    id: 'hammam-maison-eve',
    slug: 'hammam-maison-eve',
    nom: 'Hammam Maison Eve',
    categorie: 'corps',
    resume: 'Le rituel complet : gommage visage, massage 15 min, kit de hammam inclus.',
    description: [
      'La formule signature. Cinq saveurs au choix, dont la coco à base d’huile de coco bio africain, ' +
        'qui n’est proposée que sur cette formule et au-dessus.',
      'Comprend : gommage traditionnel au choix, gommage au choix, lavage de cheveux, gommage visage, ' +
        'savonnage au choix, gel douche, shampoing et après-shampoing offerts, massage relaxant de ' +
        '15 minutes, sortie de bain et kit de hammam inclus.',
    ],
    duree: 75,
    prix: 200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/hammam-maison-eve.jpg',
    bienfaits: [
      'Cinq saveurs, dont la coco bio africaine',
      'Gommage du visage inclus',
      'Massage relaxant de 15 minutes',
      'Sortie de bain et kit de hammam fournis',
    ],
    deroule: [
      { titre: 'Le choix', texte: 'Rose, fleur d’oranger, eucalyptus, jasmin ou coco bio africain.' },
      { titre: 'Le rituel', texte: 'Gommage corps et visage, lavage de cheveux, savonnage au choix.' },
      { titre: 'Le massage', texte: '15 minutes de massage relaxant, puis sortie de bain et kit fournis.' },
    ],
    populaire: true,
    actif: true,
    ordre: 3,
  },
  {
    id: 'hammam-majestic',
    slug: 'le-majestic-hammam',
    nom: 'Le Majestic Hammam',
    categorie: 'corps',
    resume: 'À l’oud. Massage relaxant 20 min et massage crânien 10 min inclus.',
    description: [
      'La formule la plus complète, et la seule proposée à l’oud. Deux saveurs : oud ou fleur d’oranger.',
      'Comprend : gommage traditionnel au choix, gommage au choix, lavage de cheveux, gommage visage, ' +
        'savonnage au choix, gel douche, shampoing et après-shampoing offerts, massage relaxant de ' +
        '20 minutes, massage crânien de 10 minutes, sortie de bain et kit de hammam inclus.',
    ],
    duree: 90,
    prix: 300,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/hammam-majestic.jpg',
    bienfaits: [
      'À l’oud — exclusif à cette formule',
      '20 minutes de massage relaxant',
      '10 minutes de massage crânien',
      'Sortie de bain et kit de hammam fournis',
    ],
    deroule: [
      { titre: 'Le choix', texte: 'Oud ou fleur d’oranger.' },
      { titre: 'Le rituel', texte: 'Gommage corps et visage, lavage de cheveux, savonnage au choix.' },
      { titre: 'Les massages', texte: '20 minutes de massage relaxant, puis 10 minutes de massage crânien.' },
    ],
    populaire: true,
    actif: true,
    ordre: 4,
  },

  // ---------------------------------------------------------------
  //  MASSAGES — durées et prix officiels
  // ---------------------------------------------------------------
  {
    id: 'enchantement-dorsal',
    slug: 'enchantement-dorsal',
    nom: 'L’enchantement dorsal',
    categorie: 'massages',
    resume: 'Trente minutes concentrées sur le dos. Le format court.',
    description: [
      'Un massage ciblé sur le dos, la nuque et les épaules — là où la tension s’installe quand on ' +
        'travaille assis toute la journée.',
      'Trente minutes, sans préparation longue. Le format qui se glisse dans une pause.',
    ],
    duree: 30,
    prix: 100,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/enchantement-dorsal.jpg',
    bienfaits: [
      'Relâche le haut du dos et la nuque',
      'Format court, 30 minutes',
      'Soulage les tensions de bureau',
      'La formule la plus accessible',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'Quelques mots sur vos zones sensibles et la pression que vous aimez.' },
      { titre: 'Le soin', texte: '30 minutes sur le dos, la nuque et les épaules.' },
      { titre: 'Le retour', texte: 'Le temps de vous relever tranquillement.' },
    ],
    populaire: true,
    actif: true,
    ordre: 5,
  },
  {
    id: 'ceremonial-relaxant',
    slug: 'ceremonial-relaxant',
    nom: 'Le cérémonial relaxant',
    categorie: 'massages',
    resume: 'Le massage complet du corps, 45 minutes. Celui qu’on redemande.',
    description: [
      'Un massage lent et complet, du haut du dos jusqu’aux pieds. La praticienne travaille les zones ' +
        'où la tension s’accumule, sans jamais forcer.',
      'La pression s’ajuste au fil de la séance : vous dites ce qui vous convient, on adapte.',
    ],
    duree: 45,
    prix: 200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/ceremonial-relaxant.jpg',
    bienfaits: [
      'Relâche les tensions du dos et de la nuque',
      'Améliore la qualité du sommeil',
      'Active la circulation',
      'Apaise le mental',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'Quelques minutes pour parler de vos zones sensibles.' },
      { titre: 'Le soin', texte: '45 minutes de massage complet, du dos aux pieds.' },
      { titre: 'Le retour', texte: 'Un thé, et le temps de vous relever tranquillement.' },
    ],
    populaire: true,
    actif: true,
    ordre: 6,
  },
  {
    id: 'chiro-cranien',
    slug: 'chiro-cranien',
    nom: 'Le chiro crânien',
    categorie: 'massages',
    resume: 'Crâne, nuque et cuir chevelu. Quarante-cinq minutes.',
    description: [
      'Un massage du crâne, de la nuque et du cuir chevelu, par pressions lentes.',
      'On le conseille quand la tension se loge dans la tête plutôt que dans le dos.',
    ],
    duree: 45,
    prix: 200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/chiro-cranien.jpg',
    bienfaits: [
      'Détend le cuir chevelu',
      'Relâche la nuque',
      'Apaise le mental',
      'Favorise l’endormissement',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On vérifie vos zones sensibles.' },
      { titre: 'Le soin', texte: '45 minutes sur le crâne, la nuque et le cuir chevelu.' },
      { titre: 'Le retour', texte: 'Le temps de reprendre pied doucement.' },
    ],
    populaire: false,
    actif: true,
    ordre: 7,
  },
  {
    id: 'rituel-jambes-toniques',
    slug: 'rituel-jambes-toniques',
    nom: 'Le rituel jambes toniques',
    categorie: 'massages',
    resume: 'Pour les jambes lourdes. Quarante-cinq minutes, en remontant.',
    description: [
      'Un massage des jambes, travaillé de bas en haut pour relancer la circulation.',
      'On le conseille aux journées passées debout, et l’été quand la chaleur alourdit tout.',
    ],
    duree: 45,
    prix: 200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/rituel-jambes-toniques.jpg',
    bienfaits: [
      'Soulage la sensation de jambes lourdes',
      'Relance la circulation',
      'Draine',
      'Repose les jambes après une journée debout',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'Quelques questions sur votre circulation.' },
      { titre: 'Le soin', texte: '45 minutes sur les jambes, de bas en haut.' },
      { titre: 'Le retour', texte: 'On vous laisse les jambes surélevées quelques minutes.' },
    ],
    populaire: false,
    actif: true,
    ordre: 8,
  },
  {
    id: 'rituel-minceur',
    slug: 'rituel-minceur',
    nom: 'Le rituel minceur',
    categorie: 'massages',
    resume: 'Une heure de massage drainant, en mouvements profonds.',
    description: [
      'Un massage d’une heure en mouvements profonds et drainants, sur les zones que vous indiquez.',
      'Il se pense en série plutôt qu’en séance isolée. La praticienne vous conseille le rythme.',
    ],
    duree: 60,
    prix: 250,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/rituel-minceur.jpg',
    bienfaits: [
      'Draine en profondeur',
      'Travaille les zones que vous choisissez',
      'Une heure complète',
      'Se pense en série',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On définit ensemble les zones à travailler.' },
      { titre: 'Le soin', texte: '60 minutes de massage drainant en mouvements profonds.' },
      { titre: 'Le retour', texte: 'Un grand verre d’eau, et le conseil sur le rythme à tenir.' },
    ],
    populaire: false,
    actif: true,
    ordre: 9,
  },

  // ---------------------------------------------------------------
  //  SOINS DU VISAGE
  // ---------------------------------------------------------------
  {
    id: 'soin-visage-specifique',
    slug: 'soin-visage-specifique',
    nom: 'Soin de visage spécifique',
    categorie: 'visage',
    resume: 'Le soin adapté à votre peau, après diagnostic.',
    description: [
      'L’esthéticienne examine votre peau avant de choisir les produits et les gestes. Peau sèche, ' +
        'mixte, réactive : le protocole n’est pas le même.',
      'Nettoyage, exfoliation douce, masque adapté, hydratation.',
    ],
    duree: 45,
    prix: 200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/soin-visage-specifique.jpg',
    bienfaits: [
      'Protocole choisi après diagnostic',
      'Nettoie sans agresser',
      'Hydrate en profondeur',
      'Adapté aux peaux réactives',
    ],
    deroule: [
      { titre: 'Le diagnostic', texte: 'On regarde votre peau avant de choisir quoi que ce soit.' },
      { titre: 'Le soin', texte: 'Nettoyage, exfoliation douce, masque adapté, hydratation.' },
      { titre: 'Le conseil', texte: 'Ce qu’il faut faire chez vous entre deux soins.' },
    ],
    populaire: true,
    actif: true,
    ordre: 10,
  },
  {
    id: 'soin-hydra-facial',
    slug: 'soin-hydra-facial-phytoceane',
    nom: 'Soin hydra-facial Phytocéane',
    categorie: 'visage',
    resume: 'Le soin le plus complet du visage, à la gamme Phytocéane.',
    description: [
      'Un soin hydra-facial mené avec la gamme marine Phytocéane. Nettoyage en profondeur, extraction ' +
        'douce, apport d’actifs hydratants.',
      'C’est le soin du visage le plus complet de la carte.',
    ],
    duree: 60,
    prix: 400,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/soin-hydra-facial.jpg',
    bienfaits: [
      'Nettoyage en profondeur',
      'Extraction douce',
      'Gamme marine Phytocéane',
      'Le soin visage le plus complet',
    ],
    deroule: [
      { titre: 'Le diagnostic', texte: 'On examine votre peau et on adapte les actifs.' },
      { titre: 'Le soin', texte: 'Nettoyage profond, extraction douce, apport d’actifs hydratants.' },
      { titre: 'Le conseil', texte: 'La routine à tenir pour faire durer le résultat.' },
    ],
    populaire: true,
    actif: true,
    ordre: 11,
  },

  // ---------------------------------------------------------------
  //  BEAUTÉ & COIFFURE — les formules complètes.
  //  Le détail à la carte est dans `tarifsALaCarte` plus bas.
  // ---------------------------------------------------------------
  {
    id: 'manucure-rituals',
    slug: 'manucure-rituals',
    nom: 'Manucure Rituals',
    categorie: 'rituels',
    resume: 'La manucure la plus complète de la carte.',
    description: [
      'Mise en forme, soin des cuticules, gommage, massage des mains et finition.',
      'Trois autres formules existent : normale, spa et russe. Voir la carte à la carte.',
    ],
    duree: 60,
    prix: 150,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/manucure-rituals.jpg',
    bienfaits: [
      'Mise en forme et soin des cuticules',
      'Gommage et massage des mains',
      'La formule la plus complète',
      'Trois autres formules disponibles',
    ],
    deroule: [
      { titre: 'La préparation', texte: 'Mise en forme et soin des cuticules.' },
      { titre: 'Le soin', texte: 'Gommage puis massage des mains.' },
      { titre: 'La finition', texte: 'Pose au choix — voir les options à la carte.' },
    ],
    populaire: true,
    actif: true,
    ordre: 12,
  },
  {
    id: 'pedicure-rituals',
    slug: 'pedicure-rituals',
    nom: 'Pédicure Rituals',
    categorie: 'rituels',
    resume: 'La pédicure la plus complète de la carte.',
    description: [
      'Bain, mise en forme, soin des cuticules, gommage, massage des pieds et finition.',
      'Deux autres formules existent : normale et spa. Voir la carte à la carte.',
    ],
    duree: 60,
    prix: 160,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/pedicure-rituals.jpg',
    bienfaits: [
      'Bain et mise en forme',
      'Gommage et massage des pieds',
      'La formule la plus complète',
      'Deux autres formules disponibles',
    ],
    deroule: [
      { titre: 'Le bain', texte: 'Pour assouplir avant de travailler.' },
      { titre: 'Le soin', texte: 'Mise en forme, cuticules, gommage, massage des pieds.' },
      { titre: 'La finition', texte: 'Pose au choix — voir les options à la carte.' },
    ],
    populaire: false,
    actif: true,
    ordre: 13,
  },
  {
    id: 'rehaussement-cils',
    slug: 'rehaussement-de-cils',
    nom: 'Rehaussement de cils',
    categorie: 'rituels',
    resume: 'Vos cils redressés, sans extension. Tient plusieurs semaines.',
    description: [
      'Le rehaussement travaille vos cils naturels : ils sont redressés et courbés à la racine. ' +
        'Pas d’extension, pas de pose à entretenir.',
      'L’extension de cils et la pose cil à cil sont également proposées. Voir la carte à la carte.',
    ],
    duree: 60,
    prix: 250,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/rehaussement-cils.jpg',
    bienfaits: [
      'Travaille vos cils naturels',
      'Aucune extension à entretenir',
      'Le regard s’ouvre',
      'Tient plusieurs semaines',
    ],
    deroule: [
      { titre: 'La préparation', texte: 'Nettoyage et pose des protections sous l’œil.' },
      { titre: 'Le soin', texte: 'Redressage et courbure des cils à la racine.' },
      { titre: 'Le conseil', texte: 'Ce qu’il faut éviter les 24 premières heures.' },
    ],
    populaire: false,
    actif: true,
    ordre: 14,
  },
  {
    id: 'epilation-complete',
    slug: 'epilation-complete',
    nom: 'Épilation complète',
    categorie: 'rituels',
    resume: 'Toutes les zones en une séance, au tarif le plus avantageux.',
    description: [
      'L’ensemble des zones en une seule séance. Chaque zone est également disponible séparément — ' +
        'voir la carte à la carte.',
    ],
    duree: 60,
    prix: 250,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/epilation-complete.jpg',
    bienfaits: [
      'Toutes les zones en une séance',
      'Plus avantageux que zone par zone',
      'Un seul rendez-vous',
      'Chaque zone reste disponible seule',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On définit ensemble les zones à traiter.' },
      { titre: 'La séance', texte: 'Zone par zone, dans l’ordre le plus confortable.' },
      { titre: 'Le soin après', texte: 'Application d’un apaisant sur les zones traitées.' },
    ],
    populaire: false,
    actif: true,
    ordre: 15,
  },
] as const;

// =====================================================================
//  TARIFS À LA CARTE
//  Prestations facturées à l'unité, non réservables comme un créneau
//  complet. Prix officiels — même source que ci-dessus.
// =====================================================================

export type LigneTarif = {
  nom: string;
  /** Prix en dirhams. */
  prix: number;
  /** `true` quand le tarif est un point de départ (« à partir de »). */
  aPartirDe?: boolean;
};

export type SectionTarifs = {
  id: string;
  titre: string;
  lignes: readonly LigneTarif[];
};

export const tarifsALaCarte: readonly SectionTarifs[] = [
  {
    id: 'coiffure',
    titre: 'Coiffure',
    lignes: [
      { nom: 'Shampoing', prix: 20 },
      { nom: 'Coupe pointes', prix: 30 },
      { nom: 'Brushing', prix: 40, aPartirDe: true },
      { nom: 'Coupe simple', prix: 80 },
      { nom: 'Wavy', prix: 100, aPartirDe: true },
      { nom: 'Coupe relooking', prix: 100 },
    ],
  },
  {
    id: 'mains-pieds',
    titre: 'Beauté des mains et pieds',
    lignes: [
      { nom: 'Ongle cassé', prix: 25 },
      { nom: 'Dépose vernis permanent', prix: 30 },
      { nom: 'Pose vernis normale', prix: 40 },
      { nom: 'Dépose BIAB ou gel', prix: 50 },
      { nom: 'Manucure normale', prix: 80 },
      { nom: 'Manucure spa', prix: 100 },
      { nom: 'Pédicure normale', prix: 100 },
      { nom: 'Vernis permanent', prix: 100 },
      { nom: 'Manucure russe', prix: 120 },
      { nom: 'Pédicure spa', prix: 130 },
      { nom: 'Manucure Rituals', prix: 150 },
      { nom: 'Pédicure Rituals', prix: 160 },
      { nom: 'Gel', prix: 300 },
      { nom: 'BIAB', prix: 300 },
      { nom: 'Nails art', prix: 10, aPartirDe: true },
    ],
  },
  {
    id: 'cils',
    titre: 'Techniques de cils',
    lignes: [
      { nom: 'Pose cil à cil', prix: 100 },
      { nom: 'Rehaussement de cils', prix: 250 },
      { nom: 'Extension de cils', prix: 250, aPartirDe: true },
    ],
  },
  {
    id: 'epilation',
    titre: 'Épilation',
    lignes: [
      { nom: 'Duvet', prix: 15 },
      { nom: 'Sourcils', prix: 20 },
      { nom: 'Menton', prix: 20 },
      { nom: 'Aisselles', prix: 30 },
      { nom: 'Demi-bras', prix: 35 },
      { nom: 'Maillot classique', prix: 40 },
      { nom: 'Demi-jambes', prix: 45 },
      { nom: 'Bras', prix: 70 },
      { nom: 'Visage complet', prix: 80 },
      { nom: 'Maillot intégral', prix: 80 },
      { nom: 'Jambes complètes', prix: 90 },
      { nom: 'Épilation complète', prix: 250 },
    ],
  },
] as const;

// --- Sélecteurs --------------------------------------------------------

export function serviceParSlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function servicesParCategorie(categorie: CategorieId): readonly Service[] {
  return services.filter((s) => s.categorie === categorie && s.actif);
}

export function servicesPopulaires(): readonly Service[] {
  return services.filter((s) => s.populaire && s.actif);
}

export function categorieParId(id: CategorieId): Categorie | undefined {
  return categories.find((c) => c.id === id);
}

export function sectionTarifsParId(id: string): SectionTarifs | undefined {
  return tarifsALaCarte.find((s) => s.id === id);
}
