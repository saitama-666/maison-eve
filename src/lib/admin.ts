'use client';

import { getFirebaseAuth } from '@/lib/firebase/client';

// =====================================================================
//  Appels au back-office.
//
//  Toutes les routes `/api/admin` exigent un en-tête
//  `Authorization: Bearer <jeton>`. Ce fichier évite de recopier la
//  récupération du jeton dans chaque écran — et surtout d'en oublier un.
//
//  Le jeton est demandé À CHAQUE APPEL, pas mis en cache : Firebase le
//  fait tourner toutes les heures, et `getIdToken()` renvoie le jeton en
//  cours de validité (il le renouvelle tout seul si besoin). Le garder
//  dans une variable produirait des 401 aléatoires au bout d'une heure de
//  travail dans l'administration.
// =====================================================================

export class ErreurAdmin extends Error {
  constructor(
    message: string,
    public readonly statut: number,
  ) {
    super(message);
    this.name = 'ErreurAdmin';
  }
}

async function jetonActuel(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) throw new ErreurAdmin('Session expirée. Reconnectez-vous.', 401);

  try {
    return await user.getIdToken();
  } catch {
    throw new ErreurAdmin('Impossible de vérifier votre session.', 401);
  }
}

/**
 * Appelle une route `/api/admin/*` avec le jeton d'identité.
 *
 * Renvoie directement les données ; lève une `ErreurAdmin` portant le
 * code HTTP, ce qui permet à l'appelant de distinguer un 403 (droits) d'un
 * 500 (panne) et d'adapter son message.
 */
export async function appelAdmin<T>(
  chemin: string,
  options: { methode?: string; corps?: unknown } = {},
): Promise<T> {
  const jeton = await jetonActuel();

  const reponse = await fetch(chemin, {
    method: options.methode ?? 'GET',
    headers: {
      Authorization: `Bearer ${jeton}`,
      ...(options.corps ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.corps ? JSON.stringify(options.corps) : undefined,
    // Le back-office doit toujours voir l'état réel de la base : une
    // réponse servie depuis le cache du navigateur ferait croire qu'un
    // enregistrement n'a pas été pris en compte.
    cache: 'no-store',
  });

  let donnees: unknown = null;
  try {
    donnees = await reponse.json();
  } catch {
    donnees = null;
  }

  if (!reponse.ok) {
    const message =
      (donnees as { error?: string } | null)?.error ?? 'La requête a échoué.';
    throw new ErreurAdmin(message, reponse.status);
  }

  return donnees as T;
}
