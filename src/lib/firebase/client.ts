'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

// =====================================================================
//  Firebase côté navigateur.
//
//  Ces clés sont PUBLIQUES par nature : elles identifient le projet, elles
//  ne l'autorisent pas. Les voir dans le bundle n'est pas une faille.
//  La sécurité réelle vient de :
//    · `firestore.rules` (c'est là que tout se joue)
//    · la restriction de la clé API par référent HTTP, dans Google Cloud
//    · App Check en production
//
//  Tout est initialisé PARESSEUSEMENT. Si `.env.local` est vide, le site
//  se charge quand même : la vitrine, le catalogue et le journal
//  fonctionnent sans Firebase. Seuls les comptes et les réservations en
//  ligne sont indisponibles. Un site qui refuse de démarrer parce qu'une
//  variable manque est un site qu'on ne peut pas déboguer.
// =====================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Vrai seulement si les variables sont réellement remplies. */
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

// ⚠️  UN DRAPEAU PAR SERVICE, ET NON UN SEUL POUR LES DEUX.
//
//     Il n'y en avait qu'un. `getFirebaseAuth()` etant appele en premier,
//     il le passait a `true` et branchait Auth ; `dbInstance` etant encore
//     `null` a cet instant, Firestore n'etait pas branche. Au tour de
//     `getDb()`, le drapeau valait deja `true` et la fonction sortait tout
//     de suite.
//
//     Resultat : en mode emulateur, l'authentification parlait bien a
//     l'emulateur, mais Firestore parlait a la PRODUCTION. On croyait
//     tester en local, on ecrivait pour de vrai.
let authEmulee = false;
let dbEmulee = false;

function ensureApp(): FirebaseApp | null {
  if (!firebaseReady) return null;
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

/** Vrai uniquement si on a demande explicitement les emulateurs. */
function modeEmulateur(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1';
}

function brancherAuth() {
  if (authEmulee || !authInstance || !modeEmulateur()) return;
  authEmulee = true;
  try {
    connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch {
    // Déjà connecté (rechargement à chaud) — sans conséquence.
  }
}

function brancherDb() {
  if (dbEmulee || !dbInstance || !modeEmulateur()) return;
  dbEmulee = true;
  try {
    connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
  } catch {
    // Déjà connecté — sans conséquence.
  }
}

export function getFirebaseAuth(): Auth | null {
  const a = ensureApp();
  if (!a) return null;
  if (!authInstance) {
    authInstance = getAuth(a);
    // Une cliente ne doit pas se reconnecter à chaque visite pour
    // consulter ses rendez-vous.
    // L'emulateur se branche AVANT la persistance : `connectAuthEmulator`
    // refuse d'agir sur une instance qui a deja servi.
    brancherAuth();
    // La session survit à la fermeture de l'onglet.
    void setPersistence(authInstance, browserLocalPersistence).catch(() => {});
  }
  return authInstance;
}

export function getDb(): Firestore | null {
  const a = ensureApp();
  if (!a) return null;
  if (!dbInstance) {
    dbInstance = getFirestore(a);
    brancherDb();
  }
  return dbInstance;
}

const MESSAGE_ABSENT =
  'Firebase n’est pas configuré. Copie `.env.local.example` en `.env.local` et remplis les clés.';

/**
 * Variantes strictes : lèvent une erreur lisible au lieu de laisser un
 * `null` se propager et planter trois appels plus loin avec un message
 * incompréhensible.
 */
export function requireAuth(): Auth {
  const a = getFirebaseAuth();
  if (!a) throw new Error(MESSAGE_ABSENT);
  return a;
}

export function requireDb(): Firestore {
  const d = getDb();
  if (!d) throw new Error(MESSAGE_ABSENT);
  return d;
}
