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

export const site = {
  name: 'MAISON EVE',
  fullName: 'MAISON EVE — Beauty & Spa',
  tagline: 'Beauty & Spa',
  baseline: 'Le calme, chez vous ou chez nous.',
  // 155 caracteres. Google tronque au-dela de ~160 : une description plus
  // longue est coupee en plein milieu d'une phrase dans les resultats.
  description:
    'Institut de beauté et spa à Casablanca. Massages, soins du visage et rituels du hammam, ' +
    'en institut ou chez vous. Praticiennes diplômées.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  locale: 'fr_MA',
  lang: 'fr',
  currency: 'MAD',
  currencyLabel: 'DH',
  foundedYear: 2024, // [placeholder] — année réelle de création à confirmer
} as const;

export const contact = {
  // [placeholder] — adresse réelle de l'institut
  street: '[adresse à compléter]',
  city: 'Casablanca',
  postalCode: '[code postal]',
  country: 'Maroc',
  countryCode: 'MA',

  // [placeholder] — numéro réel. Le format doit rester international :
  // une bonne partie de la clientèle appelle depuis l'étranger.
  phone: '+212 6 00 00 00 00',
  phoneHref: '+212600000000',
  whatsapp: '212600000000',

  // [placeholder] — boîte réelle
  email: 'contact@maison-eve.ma',

  // Horaires — [placeholder], à confirmer avec l'institut
  hours: [
    { day: 'Lundi — Vendredi', slot: '10h00 — 20h00' },
    { day: 'Samedi', slot: '10h00 — 19h00' },
    { day: 'Dimanche', slot: 'Sur rendez-vous' },
  ],

  // Zone couverte pour les soins à domicile — [placeholder] à confirmer
  homeServiceArea: 'Casablanca et périphérie (Ain Diab, Anfa, Maârif, Californie, Bouskoura)',
} as const;

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
