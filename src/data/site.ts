// =====================================================================
//  MAISON EVE — identité, coordonnées, navigation.
//
//  Source unique. Rien de ce qui suit ne doit être recopié ailleurs :
//  un numéro de téléphone en dur dans un composant, c'est un numéro
//  qu'on oubliera de changer.
//
//  ⚠️  Les valeurs marquées [placeholder] sont à remplacer par Hamza.
//      Elles sont listées dans PROGRESS.md §11. Ne pas les inventer.
// =====================================================================

/**
 * VRAI tant que le site est une DEMONSTRATION montree a un prospect.
 *
 * ⚠️  CE DRAPEAU PILOTE TROIS ENDROITS A LA FOIS, ET C'EST VOLONTAIRE :
 *     `robots.ts`, les metadonnees de `layout.tsx`, et `sitemap.ts`.
 *
 *     Ils etaient reglages separement, et ils se sont contredits : le
 *     `robots.txt` interdisait le passage pendant que chaque page criait
 *     `index, follow`. Deux consignes opposees, et la mauvaise des deux
 *     qui gagne — voir la note en tete de `robots.ts`.
 *
 *     Une seule source, donc. Le jour ou Maison Eve valide sa mise en
 *     ligne : passer a `false` ICI, et les trois suivent.
 */
export const DEMONSTRATION = true;

export const site = {
  name: 'MAISON EVE',
  fullName: 'MAISON EVE — Beauty & Spa',
  tagline: 'Beauty & Spa',
  baseline: 'Votre refuge de détente, à Témara.',
  // 155 caracteres. Google tronque au-dela de ~160 : une description plus
  // longue est coupee en plein milieu d'une phrase dans les resultats.
  description:
    'Institut de beauté et spa à Témara. Hammam traditionnel, massages, soins du visage, ' +
    'coiffure et onglerie. Ouvert 7j/7, de 10h à 20h.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  locale: 'fr_MA',
  lang: 'fr',
  currency: 'MAD',
  currencyLabel: 'DH',
  foundedYear: 2024, // [placeholder] — année réelle de création à confirmer
} as const;

export const contact = {
  // Adresse relevée sur leurs fiches publiques (Google Maps, Planizen).
  street: 'Rue Rajaa, Wifak',
  city: 'Témara',
  postalCode: '[code postal]', // [placeholder] — à confirmer
  country: 'Maroc',
  countryCode: 'MA',

  // Numéros publiés dans leur bio Instagram et sur leurs visuels tarifaires.
  phone: '+212 5 30 25 54 22',
  phoneHref: '+212530255422',
  whatsapp: '212641532754',

  // [placeholder] — aucune adresse e-mail publique n'a ete trouvee chez
  // Maison Eve. `contact@maison-eve.ma` etait une invention du gabarit :
  // publier une boite qui n'existe pas, c'est perdre les messages qu'on
  // y envoie. Masquee tant qu'elle n'est pas confirmee.
  email: '[e-mail à compléter]',

  // Horaires annoncés publiquement : 7j/7, 10h — 20h.
  hours: [
    { day: 'Lundi — Dimanche', slot: '10h00 — 20h00' },
  ],

  // Maison Eve ne propose PAS de soins à domicile. Champ conservé pour
  // compatibilité, volontairement vide : rien ne doit s'afficher.
  homeServiceArea: '',
} as const;

/**
 * Informations legales obligatoires.
 *
 * ⚠️  AUCUNE NE DOIT ETRE INVENTEE. Un RC, un ICE ou un capital social sont
 *     des identifiants officiels : les fabriquer, meme « pour la maquette »,
 *     produit un faux document. Elles restent VIDES tant que l'institut ne
 *     les a pas fournies.
 *
 *     Une chaine vide n'est pas affichee : la page des mentions legales
 *     n'ecrit que les lignes reellement renseignees, et le bandeau
 *     « A faire valider » liste automatiquement ce qui manque encore.
 */
export const legal = {
  formeJuridique: '',
  capital: '',
  registreCommerce: '',
  identifiantFiscal: '',
  ice: '',
  directeurPublication: '',
  hebergeur: '',
  hebergeurAdresse: '',
  hebergeurTelephone: '',
} as const;

/** Les entrees legales encore vides, pour le bandeau d'avertissement. */
export const legalManquant: readonly string[] = (
  [
    ['forme juridique', legal.formeJuridique],
    ['capital social', legal.capital],
    ['registre du commerce', legal.registreCommerce],
    ['identifiant fiscal', legal.identifiantFiscal],
    ['ICE', legal.ice],
    ['directeur de la publication', legal.directeurPublication],
    ['hébergeur du site', legal.hebergeur],
  ] as const
)
  .filter(([, v]) => v.trim() === '')
  .map(([label]) => label);

/**
 * Vrai si la valeur est encore un gabarit, jamais renseigne.
 *
 * ⚠️  A UTILISER AVANT D'AFFICHER OU DE PUBLIER UNE COORDONNEE.
 *
 *     Les gabarits ci-dessous ne sont pas inertes : ils SORTAIENT.
 *       · `social.instagram` valait `[url Instagram]`, et le pied de page
 *         en faisait un `<a href="[url Instagram]">`. Sur chaque page du
 *         site, trois icones menaient a un 404 — pire que pas d'icone.
 *       · l'adresse et le telephone factices partaient dans les donnees
 *         structurees, donc directement chez Google.
 *
 *     Un champ non renseigne doit DISPARAITRE, pas s'afficher vide.
 */
export function estAComplete(valeur: string): boolean {
  // Deux formes de gabarit : les crochets (`[adresse a completer]`) et
  // les numeros de remplissage, qu'ils soient espaces ou non.
  const sansSeparateur = valeur.replace(/[\s.\-()]/g, '');
  return /\[[^\]]*\]/.test(valeur) || /0{6,}/.test(sansSeparateur);
}

/**
 * Les lignes d'adresse réellement affichables, dans l'ordre.
 *
 * ⚠️  La rue et le code postal sont encore des gabarits. Les afficher tels
 *     quels donne « [adresse à compléter] » en clair sur le site public —
 *     ce qui est PIRE que de ne rien montrer : ça dit au visiteur que le
 *     site n'est pas fini, sur chaque page.
 *
 *     La ville et le pays, eux, sont vrais. On les garde : « Témara,
 *     Maroc » informe honnêtement, sans rien inventer.
 *
 *     Les pages légales n'utilisent PAS ce helper : leurs crochets sont
 *     délibérés, ils signalent une obligation encore non remplie.
 */
export function lignesAdresse(): string[] {
  const lignes: string[] = [];
  if (!estAComplete(contact.street)) lignes.push(contact.street);
  const ville = [estAComplete(contact.postalCode) ? '' : contact.postalCode, contact.city]
    .filter(Boolean)
    .join(' ');
  lignes.push(ville);
  return lignes;
}

export const social = {
  // [placeholder] — remplacer par les vrais comptes. Laisser une URL de
  // plateforme générique donne un lien mort qui décrédibilise le site.
  instagram: '[url Instagram]',
  facebook: '[url Facebook]',
  tiktok: '[url TikTok]',
} as const;

/** Navigation principale — l'ordre est celui de la maquette. */
export const navPrincipale = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Soins', href: '/soins' },
  { label: 'Galerie', href: '/galerie' },
  { label: 'Journal', href: '/journal' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Colonnes du pied de page. */
export const navPied = {
  maison: [
    { label: 'À propos', href: '/a-propos' },
    { label: 'Nos soins', href: '/soins' },
    { label: 'Galerie', href: '/galerie' },
    { label: 'Journal', href: '/journal' },
    { label: 'Contact', href: '/contact' },
  ],
  aide: [
    { label: 'Réserver', href: '/reservation' },
    { label: 'Questions fréquentes', href: '/faq' },
    { label: 'Mon compte', href: '/compte' },
    { label: 'Mes rendez-vous', href: '/compte/reservations' },
  ],
  legal: [
    { label: 'Conditions générales', href: '/cgv' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Mentions légales', href: '/mentions-legales' },
  ],
} as const;

/** Navigation de l'espace client. */
export const navCompte = [
  { label: 'Tableau de bord', href: '/compte', exact: true },
  { label: 'Mes rendez-vous', href: '/compte/reservations', exact: false },
  { label: 'Mes adresses', href: '/compte/adresses', exact: false },
  { label: 'Mes favoris', href: '/compte/favoris', exact: false },
  { label: 'Paramètres', href: '/compte/parametres', exact: false },
] as const;

/** Navigation du back-office. */
export const navAdmin = [
  { label: 'Tableau de bord', href: '/admin', exact: true },
  { label: 'Rendez-vous', href: '/admin/reservations', exact: false },
  { label: 'Soins', href: '/admin/soins', exact: false },
  { label: 'Clientes', href: '/admin/clients', exact: false },
  { label: 'Messages', href: '/admin/messages', exact: false },
] as const;

/**
 * Promesses affichées sous le pli — les trois raisons de choisir la
 * maison. Reprend la structure « Mengapa Kami » de la maquette.
 */
export const promesses = [
  {
    icone: 'diplome' as const,
    titre: 'Praticiennes diplômées',
    texte:
      'Chaque praticienne est formée et diplômée. Vous savez qui entre chez vous, ' +
      'et vous retrouvez la même personne d’un rendez-vous à l’autre si vous le souhaitez.',
  },
  {
    icone: 'maison' as const,
    titre: 'À domicile ou en institut',
    texte:
      'On installe la table, les serviettes chaudes et la musique chez vous. ' +
      'Vous n’avez rien à préparer, et rien à ranger après.',
  },
  {
    icone: 'feuille' as const,
    titre: 'Produits naturels',
    texte:
      'Huiles végétales, argile, eau de rose, savon noir. Rien de synthétique ' +
      'sur votre peau, et aucun parfum d’ambiance chimique dans la pièce.',
  },
] as const;

/** Chiffres du bandeau de confiance. [placeholder] — à confirmer. */
export const chiffres = [
  { valeur: 0, suffixe: '+', label: 'Clientes accompagnées' },
  { valeur: 0, suffixe: '', label: 'Soins au catalogue' },
  { valeur: 0, suffixe: '', label: 'Praticiennes diplômées' },
  { valeur: 0, suffixe: '', label: 'Années d’expérience' },
] as const;
