// =====================================================================
//  Traduction des erreurs Firebase.
//
//  Firebase renvoie des codes comme `auth/invalid-credential`. Les
//  afficher tels quels à une cliente est inutile et inquiétant. On les
//  traduit en français, en disant CE QU'IL FAUT FAIRE, pas ce qui a raté.
//
//  Registre : on VOUVOIE, comme partout ailleurs sur le site. Le
//  message d'erreur est lu avec attention, au moment précis où
//  quelque chose vient de rater : c'est le pire endroit pour changer
//  de ton sans raison.
//
//  Note de sécurité : `auth/user-not-found` et `auth/wrong-password`
//  reçoivent VOLONTAIREMENT le même message. Les distinguer permettrait
//  d'énumérer les comptes existants — on saurait quelles adresses sont
//  inscrites. Firebase le fait déjà de son côté en renvoyant
//  `invalid-credential` pour les deux ; on ne défait pas cette protection.
// =====================================================================

const MESSAGES: Record<string, string> = {
  // --- Connexion ---
  'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
  'auth/invalid-email': 'Cette adresse e-mail n’est pas valide.',
  'auth/user-not-found': 'Adresse e-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'Adresse e-mail ou mot de passe incorrect.',
  'auth/user-disabled': 'Ce compte a été désactivé. Écrivez-nous pour le réactiver.',
  'auth/too-many-requests':
    'Trop de tentatives. Patientez quelques minutes, ou réinitialisez votre mot de passe.',

  // --- Inscription ---
  'auth/email-already-in-use':
    'Un compte existe déjà avec cette adresse. Connectez-vous, ou réinitialisez votre mot de passe.',
  'auth/weak-password': 'Le mot de passe doit faire au moins 8 caractères.',
  'auth/operation-not-allowed':
    'Ce mode de connexion n’est pas activé. Écrivez-nous, on s’en occupe.',

  // --- Connexion Google ---
  'auth/popup-closed-by-user': 'La fenêtre s’est fermée avant la fin. Réessayez.',
  'auth/cancelled-popup-request': 'Une autre fenêtre de connexion est déjà ouverte.',
  'auth/popup-blocked':
    'Le navigateur a bloqué la fenêtre de connexion. Autorisez-la, puis réessayez.',
  'auth/account-exists-with-different-credential':
    'Cette adresse est déjà utilisée avec un autre mode de connexion. Essayez par e-mail.',
  'auth/unauthorized-domain':
    'Ce domaine n’est pas autorisé pour la connexion. Contactez l’administrateur du site.',

  // --- Session ---
  'auth/requires-recent-login':
    'Pour des raisons de sécurité, reconnectez-vous avant de faire cette modification.',
  'auth/network-request-failed': 'Connexion impossible. Vérifiez votre accès à Internet.',

  // --- Firestore ---
  'permission-denied': 'Vous n’avez pas les droits nécessaires pour cette action.',
  unauthenticated: 'Connectez-vous pour continuer.',
  unavailable: 'Le service est momentanément indisponible. Réessayez dans un instant.',
  'not-found': 'Cet élément n’existe plus.',
  'already-exists': 'Cet élément existe déjà.',
  'resource-exhausted': 'Trop de requêtes. Patientez un instant.',
  'failed-precondition':
    'Action impossible dans l’état actuel. Rechargez la page et réessayez.',
};

const REPLI = 'Une erreur est survenue. Réessayez, et écrivez-nous si ça persiste.';

/** Vrai si l'objet ressemble à une erreur Firebase (elle porte un `code`). */
function aUnCode(e: unknown): e is { code: string; message?: string } {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as { code: unknown }).code === 'string';
}

/**
 * Message affichable pour n'importe quelle erreur.
 *
 * On n'expose JAMAIS `error.message` brut d'une erreur inconnue : il peut
 * contenir un chemin de fichier, une requête, ou le nom d'un champ interne.
 */
export function messageErreur(e: unknown): string {
  if (aUnCode(e)) {
    const code = e.code.replace(/^firestore\//, '');
    return MESSAGES[code] ?? MESSAGES[e.code] ?? REPLI;
  }

  // Les erreurs qu'on lève nous-mêmes sont déjà rédigées pour l'humain.
  if (e instanceof Error && e.message && !e.message.includes('Firebase:')) {
    return e.message;
  }

  return REPLI;
}
