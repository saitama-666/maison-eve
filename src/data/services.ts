// =====================================================================
//  Catalogue de soins — repli statique.
//
//  Firestore fait autorité en production (collection `services`, éditable
//  depuis /admin). Ce fichier est le FILET DE SÉCURITÉ : si Firestore est
//  absent, mal configuré ou en panne, le site continue d'afficher son
//  catalogue au lieu d'afficher une page vide. Voir `src/lib/catalogue.ts`.
//
//  ⚠️  TARIFS ET DURÉES SONT DES PROPOSITIONS, PAS DES PRIX VALIDÉS.
//      Ils sont là pour que la mise en page soit juste et testable. Aucun
//      n'a été confirmé par Hamza. À valider AVANT toute mise en ligne —
//      voir PROGRESS.md §11. Ne pas les présenter comme définitifs.
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
    id: 'massages',
    nom: 'Massages',
    slug: 'massages',
    resume: 'Relâcher les tensions, retrouver le sommeil, respirer plus bas.',
  },
  {
    id: 'visage',
    nom: 'Visage',
    slug: 'visage',
    resume: 'Nettoyer, hydrater, apaiser. Sans agresser la peau.',
  },
  {
    id: 'corps',
    nom: 'Corps & hammam',
    slug: 'corps-hammam',
    resume: 'Le rituel marocain du gommage, du savon noir et du ghassoul.',
  },
  {
    id: 'rituels',
    nom: 'Rituels',
    slug: 'rituels',
    resume: 'Plusieurs soins enchaînés, pour une vraie parenthèse.',
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
  /** Durée en minutes. */
  duree: number;
  /** Tarif en institut, en dirhams. PROPOSITION — à valider. */
  prix: number;
  /** Supplément pour un soin à domicile, en dirhams. PROPOSITION. */
  supplementDomicile: number;
  /** Le soin est-il proposé à domicile ? Le hammam, non. */
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

export const services: readonly Service[] = [
  {
    id: 'massage-traditionnel',
    slug: 'massage-traditionnel',
    nom: 'Massage traditionnel',
    categorie: 'massages',
    resume: 'Le massage complet du corps, à l’huile tiède. Celui qu’on redemande.',
    description: [
      'Un massage lent et profond, du haut du dos jusqu’aux pieds. La praticienne travaille les zones ' +
        'où la tension s’accumule — nuque, épaules, bas du dos — sans jamais forcer.',
      'L’huile est chauffée avant la séance. La pression s’ajuste au fil du soin : vous dites ce qui ' +
        'vous convient, on adapte. C’est votre séance, pas un protocole appliqué à l’identique.',
    ],
    duree: 60,
    prix: 400,
    supplementDomicile: 150,
    domicileDisponible: true,
    image: '/soins/massage-traditionnel.svg',
    bienfaits: [
      'Relâche les tensions du dos et de la nuque',
      'Améliore la qualité du sommeil',
      'Active la circulation',
      'Apaise le mental',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'Quelques minutes pour parler de vos zones sensibles et de la pression que vous aimez.' },
      { titre: 'Le soin', texte: '55 minutes de massage à l’huile tiède, du dos aux pieds.' },
      { titre: 'Le retour', texte: 'Un thé, et le temps de vous relever tranquillement.' },
    ],
    populaire: true,
    actif: true,
    ordre: 1,
  },
  {
    id: 'massage-argan',
    slug: 'massage-huile-argan',
    nom: 'Massage à l’huile d’argan',
    categorie: 'massages',
    resume: 'Le même geste, avec l’huile qui nourrit le plus la peau sèche.',
    description: [
      'L’argan pure, pressée à froid, remplace l’huile de massage habituelle. Elle pénètre lentement ' +
        'et laisse la peau souple pendant plusieurs jours — sans film gras.',
      'On le conseille en hiver, après le soleil, ou simplement quand la peau tire.',
    ],
    duree: 60,
    prix: 480,
    supplementDomicile: 150,
    domicileDisponible: true,
    image: '/soins/massage-argan.svg',
    bienfaits: [
      'Nourrit les peaux sèches en profondeur',
      'Assouplit la peau durablement',
      'Riche en vitamine E',
      'Ne laisse pas de film gras',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On vérifie qu’aucune allergie aux fruits à coque ne contre-indique l’argan.' },
      { titre: 'Le soin', texte: '55 minutes de massage complet à l’argan tiède.' },
      { titre: 'Le retour', texte: 'On laisse l’huile pénétrer — pas de douche juste après.' },
    ],
    populaire: true,
    actif: true,
    ordre: 2,
  },
  {
    id: 'pierres-chaudes',
    slug: 'massage-pierres-chaudes',
    nom: 'Massage aux pierres chaudes',
    categorie: 'massages',
    resume: 'La chaleur descend là où les mains seules n’atteignent pas.',
    description: [
      'Des pierres de basalte chauffées sont posées le long de la colonne, puis glissées sur les muscles. ' +
        'La chaleur fait céder les nœuds profonds sans que la praticienne ait à appuyer fort.',
      'C’est le soin des dos très noués, et des personnes qui ont toujours froid.',
    ],
    duree: 75,
    prix: 620,
    supplementDomicile: 200,
    domicileDisponible: true,
    image: '/soins/pierres-chaudes.svg',
    bienfaits: [
      'Dénoue les tensions profondes',
      'Réchauffe durablement',
      'Détend sans pression forte',
      'Idéal après une période de stress',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On règle la température des pierres selon votre sensibilité.' },
      { titre: 'Le soin', texte: '70 minutes : pose des pierres, puis massage aux pierres et aux mains.' },
      { titre: 'Le retour', texte: 'Un grand verre d’eau — la chaleur déshydrate un peu.' },
    ],
    populaire: false,
    actif: true,
    ordre: 3,
  },
  {
    id: 'massage-prenatal',
    slug: 'massage-prenatal',
    nom: 'Massage prénatal',
    categorie: 'massages',
    resume: 'Sur le côté, en appui, avec des gestes pensés pour la grossesse.',
    description: [
      'À partir du deuxième trimestre. Vous êtes installée sur le côté, calée par des coussins. ' +
        'La praticienne travaille le bas du dos, les hanches et les jambes — là où la grossesse pèse.',
      'Aucune huile essentielle, aucun point contre-indiqué. La praticienne est formée à ce soin en particulier.',
    ],
    duree: 60,
    prix: 450,
    supplementDomicile: 150,
    domicileDisponible: true,
    image: '/soins/massage-prenatal.svg',
    bienfaits: [
      'Soulage le bas du dos et le bassin',
      'Réduit les jambes lourdes',
      'Améliore le sommeil',
      'Sans huile essentielle',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On note le terme et les recommandations éventuelles de votre médecin.' },
      { titre: 'Le soin', texte: '55 minutes en position latérale, calée par des coussins.' },
      { titre: 'Le retour', texte: 'On vous aide à vous relever, sans à-coup.' },
    ],
    populaire: false,
    actif: true,
    ordre: 4,
  },
  {
    id: 'hammam-savon-noir',
    slug: 'hammam-savon-noir',
    nom: 'Hammam & gommage au savon noir',
    categorie: 'corps',
    resume: 'Le vrai rituel : vapeur, savon noir, gant de kessa.',
    description: [
      'On commence par la vapeur, le temps que la peau s’ouvre. Puis le savon noir à l’huile d’olive, ' +
        'laissé à poser. Enfin le gommage au gant de kessa, qui retire les peaux mortes.',
      'On termine au ghassoul, l’argile du Moyen Atlas, et à l’eau de rose. La peau ressort lisse — ' +
        'la différence se sent immédiatement.',
    ],
    duree: 75,
    prix: 350,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/hammam-savon-noir.svg',
    bienfaits: [
      'Élimine les peaux mortes',
      'Resserre les pores',
      'Lisse le grain de peau',
      'Rituel marocain authentique',
    ],
    deroule: [
      { titre: 'La vapeur', texte: '15 minutes, le temps que la peau s’ouvre.' },
      { titre: 'Le savon noir', texte: 'Appliqué puis laissé poser, avant le gant de kessa.' },
      { titre: 'Le ghassoul', texte: 'L’argile, puis l’eau de rose et un rinçage tiède.' },
    ],
    populaire: true,
    actif: true,
    ordre: 5,
  },
  {
    id: 'rituel-ghassoul',
    slug: 'rituel-ghassoul',
    nom: 'Rituel ghassoul',
    categorie: 'corps',
    resume: 'L’argile du Moyen Atlas, sur tout le corps.',
    description: [
      'Le ghassoul est une argile qui lave sans détergent. On l’applique tiède sur tout le corps, ' +
        'on laisse poser, puis on rince longuement.',
      'Il convient aux peaux qui ne supportent plus les savons classiques, et aux cuirs chevelus gras.',
    ],
    duree: 45,
    prix: 280,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/rituel-ghassoul.svg',
    bienfaits: [
      'Lave sans détergent',
      'Absorbe l’excès de sébum',
      'Adoucit les peaux réactives',
      'Convient au cuir chevelu',
    ],
    deroule: [
      { titre: 'La préparation', texte: 'Le ghassoul est délayé à l’eau de rose, tiède.' },
      { titre: 'La pose', texte: 'Application sur tout le corps, 20 minutes de pose.' },
      { titre: 'Le rinçage', texte: 'Long rinçage tiède, puis huile d’argan sur peau humide.' },
    ],
    populaire: false,
    actif: true,
    ordre: 6,
  },
  {
    id: 'soin-visage-rose',
    slug: 'soin-visage-eau-de-rose',
    nom: 'Soin du visage à l’eau de rose',
    categorie: 'visage',
    resume: 'Nettoyer, gommer, hydrater. Rien d’agressif.',
    description: [
      'Démaquillage, nettoyage, gommage doux, masque à l’argile blanche, puis hydratation à l’eau de ' +
        'rose de Kelâat M’Gouna et à l’huile de figue de barbarie.',
      'Le soin se termine par un modelage du visage et du cuir chevelu. C’est souvent le moment que ' +
        'les clientes préfèrent.',
    ],
    duree: 60,
    prix: 420,
    supplementDomicile: 120,
    domicileDisponible: true,
    image: '/soins/soin-visage-rose.svg',
    bienfaits: [
      'Nettoie sans décaper',
      'Hydrate en profondeur',
      'Apaise les rougeurs',
      'Modelage visage et cuir chevelu',
    ],
    deroule: [
      { titre: 'Le diagnostic', texte: 'On regarde votre peau et on choisit le masque en conséquence.' },
      { titre: 'Le soin', texte: 'Nettoyage, gommage doux, masque, puis hydratation.' },
      { titre: 'Le modelage', texte: '10 minutes de modelage du visage et du cuir chevelu.' },
    ],
    populaire: true,
    actif: true,
    ordre: 7,
  },
  {
    id: 'soin-visage-eclat',
    slug: 'soin-visage-eclat',
    nom: 'Soin visage éclat',
    categorie: 'visage',
    resume: 'Pour un teint terne, avant un événement.',
    description: [
      'Un soin plus tonique que le précédent : gommage aux noyaux d’abricot, masque vitaminé, ' +
        'et massage drainant qui décongestionne les traits.',
      'À faire idéalement deux ou trois jours avant l’événement, pas la veille.',
    ],
    duree: 45,
    prix: 380,
    supplementDomicile: 120,
    domicileDisponible: true,
    image: '/soins/soin-visage-eclat.svg',
    bienfaits: [
      'Ravive un teint terne',
      'Décongestionne les traits',
      'Affine le grain de peau',
      'Effet visible dès la sortie',
    ],
    deroule: [
      { titre: 'Le diagnostic', texte: 'On vérifie que la peau supporte un gommage mécanique.' },
      { titre: 'Le soin', texte: 'Gommage, masque vitaminé, massage drainant.' },
      { titre: 'La finition', texte: 'Sérum et protection légère.' },
    ],
    populaire: false,
    actif: true,
    ordre: 8,
  },
  {
    id: 'rituel-maison-eve',
    slug: 'rituel-maison-eve',
    nom: 'Rituel MAISON EVE',
    categorie: 'rituels',
    resume: 'Hammam, gommage, massage et soin du visage. La demi-journée complète.',
    description: [
      'Le rituel le plus complet de la maison. Il commence au hammam, enchaîne sur le gommage au savon ' +
        'noir, puis le massage à l’huile d’argan, et se termine par le soin du visage à l’eau de rose.',
      'Comptez trois heures. On prévoit une pause thé au milieu — l’enchaînement sans respiration ' +
        'fatigue plus qu’il ne détend.',
    ],
    duree: 180,
    prix: 1200,
    supplementDomicile: 0,
    domicileDisponible: false,
    image: '/soins/rituel-maison-eve.svg',
    bienfaits: [
      'Le parcours complet en une séance',
      'Pause thé incluse',
      'Peau lisse et nourrie',
      'Le cadeau qu’on offre',
    ],
    deroule: [
      { titre: 'Hammam & gommage', texte: 'Vapeur, savon noir, gant de kessa, ghassoul.' },
      { titre: 'Pause', texte: 'Thé à la menthe et repos, 15 minutes.' },
      { titre: 'Massage & visage', texte: 'Massage à l’argan, puis soin du visage à l’eau de rose.' },
    ],
    populaire: true,
    actif: true,
    ordre: 9,
  },
  {
    id: 'rituel-duo',
    slug: 'rituel-duo',
    nom: 'Rituel duo',
    categorie: 'rituels',
    resume: 'Deux tables, deux praticiennes, la même pièce.',
    description: [
      'Le massage traditionnel, à deux, dans la même salle. Pour un couple, une mère et sa fille, ' +
        'ou deux amies qui ne se voient pas assez.',
      'Le tarif indiqué est pour deux personnes.',
    ],
    duree: 60,
    prix: 760,
    supplementDomicile: 250,
    domicileDisponible: true,
    image: '/soins/rituel-duo.svg',
    bienfaits: [
      'Deux praticiennes, une seule salle',
      'Tarif pour deux personnes',
      'Possible à domicile',
      'Le cadeau d’anniversaire',
    ],
    deroule: [
      { titre: 'Accueil', texte: 'On installe les deux tables et on règle chaque pression séparément.' },
      { titre: 'Le soin', texte: '55 minutes de massage traditionnel en parallèle.' },
      { titre: 'Le retour', texte: 'Thé à la menthe pour deux.' },
    ],
    populaire: false,
    actif: true,
    ordre: 10,
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
