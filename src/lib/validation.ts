// =====================================================================
//  Validation partagée client ↔ serveur.
//
//  Le même fichier est importé par les formulaires ET par les routes API.
//  C'est volontaire : une validation qui n'existe que côté navigateur ne
//  vaut rien — il suffit d'un `curl` pour la contourner. Celle du client
//  sert le confort (message immédiat), celle du serveur sert la sécurité.
//
//  Les règles Firestore posent une TROISIÈME barrière, indépendante.
// =====================================================================

export type Erreurs<T> = Partial<Record<keyof T, string>>;

// --- Primitives --------------------------------------------------------

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
// Permissif volontairement : la clientèle appelle du Maroc, de France et
// d'ailleurs. On refuse les lettres, pas les indicatifs.
const RE_TEL = /^[+0-9][0-9 ()./-]{5,23}$/;

export function emailValide(v: string): boolean {
  return RE_EMAIL.test(v.trim()) && v.trim().length <= 254;
}

export function telValide(v: string): boolean {
  return RE_TEL.test(v.trim());
}

/**
 * Mot de passe : 8 caractères minimum.
 *
 * On ne réclame ni majuscule, ni chiffre, ni caractère spécial. Ces règles
 * poussent surtout à écrire « Motdepasse1! », qui est plus court à casser
 * qu'une phrase longue. La longueur est ce qui compte.
 */
export function motDePasseValide(v: string): boolean {
  return v.length >= 8 && v.length <= 128;
}

export function texteValide(v: string, min = 1, max = 200): boolean {
  const t = v.trim();
  return t.length >= min && t.length <= max;
}

/**
 * Slug d'URL : minuscules, chiffres et tirets uniquement.
 *
 * Ni accent, ni espace, ni tiret en début ou en fin. Un slug invalide
 * produit une URL cassée ou, pire, une URL qui a l'air de marcher mais
 * ne correspond à rien.
 */
export function slugValide(v: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length <= 90;
}

/** Nettoie une entrée libre avant stockage : espaces et longueur bornés. */
export function nettoyer(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  return v.trim().replace(/\s+/g, ' ').slice(0, max);
}

/** Idem, mais conserve les retours à la ligne (messages, notes). */
export function nettoyerMultiligne(v: unknown, max = 4000): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// =====================================================================
//  GARDE-FOU PAIEMENT
//
//  Aucune donnée bancaire ne doit entrer dans Firestore. Cette liste est
//  le miroir exact de `noPaymentData()` dans `firestore.rules` — les deux
//  doivent rester synchronisées. Si tu ajoutes une clé ici, ajoute-la
//  là-bas aussi.
//
//  Elle sert deux fois : dans les routes API (rejet immédiat), et comme
//  filet si un champ de formulaire était renommé par erreur.
// =====================================================================

export const CHAMPS_BANCAIRES_INTERDITS = [
  'cardNumber', 'card_number', 'pan', 'cvv', 'cvc', 'cardCvc',
  'securityCode', 'expiry', 'expMonth', 'expYear', 'cardholderName',
  'iban', 'rib', 'bic', 'swift', 'accountNumber', 'sortCode',
  'paymentToken', 'stripeToken',
] as const;

/** Vrai si l'objet contient au moins un champ bancaire interdit. */
export function contientDonneeBancaire(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const cles = Object.keys(obj as Record<string, unknown>);
  return cles.some((c) => (CHAMPS_BANCAIRES_INTERDITS as readonly string[]).includes(c));
}

// --- Formulaires -------------------------------------------------------

export type ChampsConnexion = { email: string; motDePasse: string };

export function validerConnexion(v: ChampsConnexion): Erreurs<ChampsConnexion> {
  const e: Erreurs<ChampsConnexion> = {};
  if (!v.email.trim()) e.email = 'Indiquez votre adresse e-mail.';
  else if (!emailValide(v.email)) e.email = 'Cette adresse ne semble pas valide.';
  if (!v.motDePasse) e.motDePasse = 'Indiquez votre mot de passe.';
  return e;
}

export type ChampsInscription = {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  confirmation: string;
  conditions: boolean;
};

export function validerInscription(v: ChampsInscription): Erreurs<ChampsInscription> {
  const e: Erreurs<ChampsInscription> = {};
  if (!texteValide(v.prenom, 2, 60)) e.prenom = 'Indiquez votre prénom.';
  if (!texteValide(v.nom, 2, 60)) e.nom = 'Indiquez votre nom.';
  if (!v.email.trim()) e.email = 'Indiquez votre adresse e-mail.';
  else if (!emailValide(v.email)) e.email = 'Cette adresse ne semble pas valide.';
  if (!motDePasseValide(v.motDePasse)) e.motDePasse = '8 caractères minimum.';
  if (v.confirmation !== v.motDePasse) e.confirmation = 'Les deux mots de passe diffèrent.';
  if (!v.conditions) e.conditions = 'Il faut accepter les conditions pour créer un compte.';
  return e;
}

export type ChampsAdresse = {
  label: string;
  type: 'facturation' | 'soin' | 'les-deux';
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  notes: string;
};

/**
 * Adresse postale — de facturation et/ou d'intervention.
 *
 * Le code postal n'est PAS obligatoire : beaucoup d'adresses au Maroc
 * n'en utilisent pas au quotidien, et le rendre obligatoire bloquerait
 * des clientes réelles pour rien.
 */
export function validerAdresse(v: ChampsAdresse): Erreurs<ChampsAdresse> {
  const e: Erreurs<ChampsAdresse> = {};
  if (!texteValide(v.firstName, 2, 60)) e.firstName = 'Prénom requis.';
  if (!texteValide(v.lastName, 2, 60)) e.lastName = 'Nom requis.';
  if (!v.phone.trim()) e.phone = 'Un numéro est nécessaire pour confirmer le rendez-vous.';
  else if (!telValide(v.phone)) e.phone = 'Ce numéro ne semble pas valide.';
  if (!texteValide(v.line1, 4, 160)) e.line1 = 'Indiquez la rue et le numéro.';
  if (!texteValide(v.city, 2, 80)) e.city = 'Indiquez la ville.';
  if (!texteValide(v.country, 2, 60)) e.country = 'Indiquez le pays.';
  if (v.label && !texteValide(v.label, 1, 40)) e.label = '40 caractères maximum.';
  if (v.postalCode && v.postalCode.trim().length > 16) e.postalCode = '16 caractères maximum.';
  if (v.notes && v.notes.length > 400) e.notes = '400 caractères maximum.';
  return e;
}

export type ChampsContact = {
  nom: string;
  email: string;
  telephone: string;
  sujet: string;
  message: string;
};

export function validerContact(v: ChampsContact): Erreurs<ChampsContact> {
  const e: Erreurs<ChampsContact> = {};
  if (!texteValide(v.nom, 2, 80)) e.nom = 'Indiquez votre nom.';
  if (!v.email.trim()) e.email = 'Indiquez votre adresse e-mail.';
  else if (!emailValide(v.email)) e.email = 'Cette adresse ne semble pas valide.';
  if (v.telephone && !telValide(v.telephone)) e.telephone = 'Ce numéro ne semble pas valide.';
  if (v.sujet && v.sujet.length > 140) e.sujet = '140 caractères maximum.';
  if (!texteValide(v.message, 10, 4000)) e.message = 'Écrivez au moins une phrase (10 caractères).';
  return e;
}

export type ChampsReservation = {
  serviceId: string;
  lieu: 'institut' | 'domicile';
  date: string;
  creneau: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  notes: string;
};

export function validerReservation(v: ChampsReservation): Erreurs<ChampsReservation> {
  const e: Erreurs<ChampsReservation> = {};
  if (!v.serviceId) e.serviceId = 'Choisissez un soin.';
  if (v.lieu !== 'institut' && v.lieu !== 'domicile') e.lieu = 'Choisissez le lieu du soin.';
  if (!v.date) e.date = 'Choisissez une date.';
  if (!v.creneau) e.creneau = 'Choisissez un horaire.';
  if (!texteValide(v.prenom, 2, 60)) e.prenom = 'Indiquez votre prénom.';
  if (!texteValide(v.nom, 2, 60)) e.nom = 'Indiquez votre nom.';
  if (!v.email.trim()) e.email = 'Indiquez votre adresse e-mail.';
  else if (!emailValide(v.email)) e.email = 'Cette adresse ne semble pas valide.';
  if (!v.telephone.trim()) e.telephone = 'Un numéro est nécessaire pour confirmer.';
  else if (!telValide(v.telephone)) e.telephone = 'Ce numéro ne semble pas valide.';
  if (v.notes && v.notes.length > 1000) e.notes = '1000 caractères maximum.';
  return e;
}

/** Vrai s'il n'y a aucune erreur. */
export function estValide<T>(erreurs: Erreurs<T>): boolean {
  return Object.keys(erreurs).length === 0;
}
