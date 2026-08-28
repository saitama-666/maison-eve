// =====================================================================
//  Journal — articles de repli.
//
//  Firestore (collection `journal`) fait autorité. Ce fichier sert de
//  filet : la page /journal ne doit jamais être vide, même sans base.
//
//  Le contenu ci-dessous est rédigé et publiable en l'état. Il ne
//  contient aucune affirmation médicale, aucun chiffre inventé, et
//  aucune promesse de résultat.
// =====================================================================

export type Article = {
  slug: string;
  titre: string;
  chapeau: string;
  categorie: string;
  /** ISO. Sert au tri et à `datePublished` dans les données structurées. */
  publieLe: string;
  auteur: string;
  lecture: number;
  image: string;
  /** Corps de l'article. `h2` pour les sous-titres, `p` pour le texte. */
  corps: readonly { type: 'h2' | 'p' | 'liste'; texte?: string; items?: readonly string[] }[];
  publie: boolean;
};

export const articles: readonly Article[] = [
  {
    slug: 'hammam-marocain-a-quoi-sattendre',
    titre: 'Le hammam marocain : à quoi s’attendre la première fois',
    chapeau:
      'Ce qu’il se passe vraiment, dans quel ordre, et ce qu’il faut apporter. ' +
      'Si vous n’y êtes jamais allée, lisez ceci d’abord.',
    categorie: 'Rituels',
    publieLe: '2026-07-14',
    auteur: 'MAISON EVE',
    lecture: 5,
    image: '/journal/hammam.jpg',
    corps: [
      {
        type: 'p',
        texte:
          'Le hammam intimide quand on n’y est jamais allée. On ne sait pas comment s’habiller, ' +
          'ce qu’on doit apporter, ni ce qu’on va nous demander de faire. Voilà le déroulé, dans l’ordre.',
      },
      { type: 'h2', texte: 'La vapeur, d’abord' },
      {
        type: 'p',
        texte:
          'On vous installe dans la salle chaude pendant une quinzaine de minutes. Il ne se passe rien ' +
          'd’autre : la chaleur ouvre les pores et ramollit les peaux mortes. Sans cette étape, le ' +
          'gommage qui suit n’accroche pas.',
      },
      { type: 'h2', texte: 'Le savon noir' },
      {
        type: 'p',
        texte:
          'Une pâte brune à l’huile d’olive, appliquée sur tout le corps, puis laissée à poser cinq à ' +
          'dix minutes. Ce n’est pas un savon qui mousse — c’est un émollient. Il prépare la peau au gant.',
      },
      { type: 'h2', texte: 'Le gant de kessa' },
      {
        type: 'p',
        texte:
          'C’est l’étape qui surprend. Le gant retire visiblement les peaux mortes. Ça frotte, ' +
          'et ça doit frotter — mais ça ne doit jamais faire mal. Dites-le si c’est trop fort : ' +
          'la pression s’ajuste.',
      },
      { type: 'h2', texte: 'Le ghassoul, puis l’eau de rose' },
      {
        type: 'p',
        texte:
          'L’argile du Moyen Atlas lave sans détergent et resserre les pores. On termine à l’eau de ' +
          'rose, puis à l’huile d’argan appliquée sur peau encore humide — c’est comme ça qu’elle pénètre.',
      },
      { type: 'h2', texte: 'Ce qu’il faut apporter' },
      {
        type: 'liste',
        items: [
          'Un maillot de bain ou une culotte que vous ne craignez pas de tacher',
          'Une serviette (souvent fournie, à vérifier)',
          'Des tongs',
          'De quoi vous attacher les cheveux',
        ],
      },
      { type: 'h2', texte: 'Après' },
      {
        type: 'p',
        texte:
          'Buvez. La chaleur déshydrate plus qu’on ne croit. Évitez le maquillage et l’épilation dans ' +
          'les vingt-quatre heures : la peau vient d’être gommée, elle est plus réactive que d’habitude.',
      },
    ],
    publie: true,
  },
  {
    slug: 'huile-argan-comment-la-choisir',
    titre: 'Huile d’argan : comment reconnaître la vraie',
    chapeau:
      'Le rayon est plein de flacons qui portent le mot « argan ». Trois vérifications ' +
      'suffisent à écarter les mélanges.',
    categorie: 'Ingrédients',
    publieLe: '2026-06-22',
    auteur: 'MAISON EVE',
    lecture: 4,
    image: '/journal/argan.jpg',
    corps: [
      {
        type: 'p',
        texte:
          'L’argan cosmétique pure coûte cher, parce qu’il faut beaucoup de fruits pour peu d’huile. ' +
          'Un flacon vendu très bas est rarement de l’argan seul. Voici ce qu’on regarde.',
      },
      { type: 'h2', texte: '1. La liste des ingrédients' },
      {
        type: 'p',
        texte:
          'Elle doit tenir en une ligne : Argania Spinosa Kernel Oil. Rien d’autre. Si vous lisez une ' +
          'huile de tournesol ou de soja avant l’argan, l’argan est minoritaire.',
      },
      { type: 'h2', texte: '2. La couleur et l’odeur' },
      {
        type: 'p',
        texte:
          'L’argan cosmétique est jaune pâle et sent très peu. L’argan alimentaire, lui, est plus foncé ' +
          'et sent la noisette grillée — les amandons ont été torréfiés. Les deux sont bons, mais pas ' +
          'pour le même usage.',
      },
      { type: 'h2', texte: '3. Le flacon' },
      {
        type: 'p',
        texte:
          'Verre teinté, jamais plastique transparent. L’argan s’oxyde à la lumière : un flacon clair ' +
          'signale un producteur qui n’a pas prévu que l’huile dure.',
      },
      { type: 'h2', texte: 'Comment on l’applique' },
      {
        type: 'p',
        texte:
          'Sur peau humide, pas sèche. Deux ou trois gouttes réchauffées entre les paumes suffisent ' +
          'pour le visage. Plus, et l’huile reste en surface.',
      },
    ],
    publie: true,
  },
  {
    slug: 'massage-a-domicile-comment-preparer',
    titre: 'Massage à domicile : ce qu’il faut préparer (presque rien)',
    chapeau:
      'On apporte la table, les serviettes et la musique. De votre côté, quatre choses ' +
      'suffisent pour que la séance soit bonne.',
    categorie: 'À domicile',
    publieLe: '2026-05-30',
    auteur: 'MAISON EVE',
    lecture: 3,
    image: '/journal/domicile.jpg',
    corps: [
      {
        type: 'p',
        texte:
          'La question revient à chaque première réservation à domicile : « qu’est-ce que je dois ' +
          'prévoir ? » Réponse courte : de la place et du calme. Le reste, on l’apporte.',
      },
      { type: 'h2', texte: 'Ce qu’on apporte' },
      {
        type: 'liste',
        items: [
          'La table de massage et son drap propre',
          'Les serviettes, chauffées sur place',
          'Les huiles, adaptées à votre peau',
          'Une enceinte, si vous voulez de la musique',
        ],
      },
      { type: 'h2', texte: 'Ce qu’on vous demande' },
      {
        type: 'liste',
        items: [
          'Deux mètres sur deux de place, dans une pièce qui ferme',
          'Une pièce chauffée — on se refroidit vite allongée',
          'Un accès à un point d’eau pour se laver les mains',
          'Le téléphone en silencieux, le vôtre comme le nôtre',
        ],
      },
      { type: 'h2', texte: 'Le moment de la journée' },
      {
        type: 'p',
        texte:
          'Si vous pouvez choisir : en fin de journée. Un massage détend profondément, et repartir ' +
          'travailler juste après gâche une partie de l’effet. Le soir, vous enchaînez sur une bonne nuit.',
      },
      { type: 'h2', texte: 'Après le départ de la praticienne' },
      {
        type: 'p',
        texte:
          'Ne prenez pas de douche tout de suite : laissez l’huile pénétrer une heure ou deux. ' +
          'Buvez un grand verre d’eau, et évitez le sport dans la foulée.',
      },
    ],
    publie: false, // Maison Eve ne propose pas de soins a domicile — depublie le 27/08/2026
  },
  {
    slug: 'peau-seche-hiver',
    titre: 'Peau qui tire en hiver : trois gestes qui changent tout',
    chapeau:
      'Le froid, le chauffage et l’eau calcaire assèchent plus que le soleil. ' +
      'Ce qu’on conseille aux clientes entre novembre et mars.',
    categorie: 'Conseils',
    publieLe: '2026-04-18',
    auteur: 'MAISON EVE',
    lecture: 4,
    image: '/journal/hiver.jpg',
    corps: [
      {
        type: 'p',
        texte:
          'On associe la peau sèche à l’été et au soleil. En réalité, c’est l’hiver qui fait le plus de ' +
          'dégâts : l’air froid dehors, l’air chauffé dedans, et des douches plus chaudes qu’en été.',
      },
      { type: 'h2', texte: '1. Baisser la température de la douche' },
      {
        type: 'p',
        texte:
          'L’eau très chaude dissout le film qui protège la peau. Tiède suffit. C’est le geste le moins ' +
          'agréable de la liste, et de loin le plus efficace.',
      },
      { type: 'h2', texte: '2. Appliquer l’huile sur peau humide' },
      {
        type: 'p',
        texte:
          'Sur peau sèche, l’huile reste en surface. Sur peau encore humide, elle emprisonne l’eau ' +
          'présente et la garde. Trente secondes après la douche, pas dix minutes.',
      },
      { type: 'h2', texte: '3. Espacer les gommages' },
      {
        type: 'p',
        texte:
          'Une peau qui tire n’a pas besoin d’être gommée plus souvent — c’est même l’inverse. ' +
          'Un gommage toutes les deux à trois semaines en hiver, contre une fois par semaine en été.',
      },
      {
        type: 'p',
        texte:
          'Si malgré ça la peau reste rouge, squameuse ou douloureuse, ce n’est plus de la sécheresse ' +
          'ordinaire : parlez-en à un dermatologue. Un institut ne remplace pas un avis médical.',
      },
    ],
    publie: true,
  },
] as const;

export function articleParSlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** Articles publiés, du plus récent au plus ancien. */
export function articlesPublies(): readonly Article[] {
  return [...articles]
    .filter((a) => a.publie)
    .sort((a, b) => b.publieLe.localeCompare(a.publieLe));
}
