import 'server-only';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// =====================================================================
//  Firebase Admin — SERVEUR UNIQUEMENT.
//
//  L'Admin SDK CONTOURNE les règles Firestore. C'est exactement pour ça
//  qu'on l'utilise pour créer les réservations : le client n'a pas le
//  droit d'écrire dans `reservations` (`allow create: if false`), donc il
//  ne peut pas décider du prix. Le serveur recalcule tout depuis le
//  catalogue avant d'écrire.
//
//  `import 'server-only'` fait ÉCHOUER LE BUILD si ce fichier est importé
//  par erreur depuis un composant client. Sans cette ligne, une clé de
//  service pourrait se retrouver dans le bundle du navigateur.
// =====================================================================

const NOM_APP = 'maison-eve-admin';

/**
 * Nettoie la valeur collée chez l'hébergeur.
 *
 * Dans `.env.local`, la valeur s'écrit entre guillemets simples — c'est la
 * syntaxe dotenv. Chez Vercel, on colle la valeur BRUTE, sans guillemets.
 * L'erreur est facile à faire, et `JSON.parse` répond alors par un message
 * incompréhensible. On retire donc les guillemets si quelqu'un les a laissés.
 */
function nettoyerCle(brut: string): string {
  let v = brut.trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function credentials() {
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const raw = brut ? nettoyerCle(brut) : undefined;

  if (raw) {
    let parsed: { project_id: string; client_email: string; private_key: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY est présente mais illisible. ' +
          'Colle le contenu du fichier .json sur une seule ligne.',
      );
    }
    if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY est incomplète ' +
          '(private_key, client_email ou project_id manquant).',
      );
    }
    return cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      // Les sauts de ligne de la clé PEM arrivent échappés depuis
      // l'environnement : sans ce remplacement, la signature échoue.
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    });
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') });
  }

  return null;
}

// =====================================================================
//  Mode émulateur.
//
//  Quand `FIRESTORE_EMULATOR_HOST` et `FIREBASE_AUTH_EMULATOR_HOST` sont
//  definies, l'Admin SDK parle aux emulateurs locaux. Il n'a alors besoin
//  d'AUCUN compte de service : un simple `projectId` suffit.
//
//  Sans ce chemin, impossible de faire tourner les routes API en local
//  sans creer un vrai projet Firebase et telecharger une cle privee — soit
//  precisement ce qu'on veut eviter pendant le developpement.
//
//  ⚠️  On exige les DEUX variables d'hote, et jamais une deduction depuis
//      NODE_ENV. Un serveur de production qui se croirait en emulateur
//      accepterait n'importe quel jeton : `verifyIdToken` ne verifie pas
//      la signature contre l'emulateur. Le declencheur doit rester une
//      decision explicite, prise dans l'environnement.
// =====================================================================

export const modeEmulateur = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST,
);

/** Identifiant de projet utilisé en mode émulateur. */
function projetEmule(): string {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'demo-maison-eve'
  );
}

/** Permet aux routes API de répondre 503 proprement au lieu de planter. */
export const adminReady = Boolean(
  modeEmulateur ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY),
);

let cache: App | null = null;

function adminApp(): App {
  if (cache) return cache;

  const existante = getApps().find((a) => a.name === NOM_APP);
  if (existante) {
    cache = existante;
    return cache;
  }

  // Émulateurs : aucun compte de service n'est nécessaire ni souhaitable.
  if (modeEmulateur) {
    cache = initializeApp({ projectId: projetEmule() }, NOM_APP);
    return cache;
  }

  const credential = credentials();
  if (!credential) {
    throw new Error(
      'Firebase Admin n’est pas configuré. Ajoute FIREBASE_SERVICE_ACCOUNT_KEY dans `.env.local`.',
    );
  }

  cache = initializeApp({ credential }, NOM_APP);
  return cache;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

/** Extrait le jeton d'un en-tête `Authorization: Bearer …`. */
export function bearerToken(request: Request): string | null {
  const entete = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!entete) return null;
  const [schema, valeur] = entete.split(' ');
  if (schema?.toLowerCase() !== 'bearer' || !valeur) return null;
  return valeur.trim();
}

/**
 * Vérifie le jeton d'identité envoyé par le navigateur.
 * `checkRevoked: true` invalide la session d'un compte désactivé ou
 * déconnecté ailleurs — sans ça, un jeton volé reste valable une heure.
 */
export async function verifyIdToken(idToken: string) {
  return adminAuth().verifyIdToken(idToken, true);
}

/**
 * Exige un utilisateur CONNECTÉ. Renvoie son uid, ou une `Response`
 * d'erreur prête à être retournée par la route.
 */
export async function requireUser(
  request: Request,
): Promise<{ uid: string; email: string } | Response> {
  if (!adminReady) {
    // Le détail part dans les journaux du SERVEUR, pas dans la réponse.
    // Répondre « FIREBASE_SERVICE_ACCOUNT_KEY manquante » à un appelant
    // anonyme lui apprend la pile technique et ce qui n'est pas configuré —
    // une information gratuite pour quelqu'un qui cherche une prise.
    console.error(
      '[admin] FIREBASE_SERVICE_ACCOUNT_KEY absente : les routes /api/admin sont hors service.',
    );
    return Response.json(
      { error: 'Service momentanément indisponible.' },
      { status: 503 },
    );
  }

  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  try {
    const decoded = await verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? '' };
  } catch {
    return Response.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 });
  }
}

/**
 * Exige un ADMINISTRATEUR.
 *
 * Le booléen `isAdmin` du navigateur ne sert qu'à l'affichage. Ici on
 * revérifie le custom claim dans le jeton signé par Firebase : c'est
 * cette fonction qui protège réellement les données. Quelqu'un qui
 * forcerait le drapeau côté client se ferait refuser ici — et une
 * troisième fois par les règles Firestore.
 */
export async function requireAdmin(
  request: Request,
): Promise<{ uid: string; email: string } | Response> {
  const resultat = await requireUser(request);
  if (resultat instanceof Response) return resultat;

  const token = bearerToken(request);
  if (!token) return Response.json({ error: 'Authentification requise.' }, { status: 401 });

  try {
    const decoded = await verifyIdToken(token);
    if (decoded.admin !== true) {
      return Response.json({ error: 'Accès réservé à l’administration.' }, { status: 403 });
    }
    return { uid: decoded.uid, email: decoded.email ?? '' };
  } catch {
    return Response.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 });
  }
}
