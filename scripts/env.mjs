// =====================================================================
//  Lecture de .env.local pour les scripts lancés à la main.
//
//  Next charge `.env.local` tout seul, mais pas `node scripts/…`. Plutôt
//  que d'ajouter `dotenv` en dépendance pour trente lignes, on le lit
//  ici — et les trois scripts partagent le même code.
// =====================================================================

import { readFileSync } from 'node:fs';

export function chargerEnv(base = import.meta.url) {
  try {
    const brut = readFileSync(new URL('../.env.local', base), 'utf8');

    for (const ligne of brut.split('\n')) {
      const nettoyee = ligne.trim();
      if (!nettoyee || nettoyee.startsWith('#')) continue;

      const index = nettoyee.indexOf('=');
      if (index === -1) continue;

      const cle = nettoyee.slice(0, index).trim();
      let valeur = nettoyee.slice(index + 1).trim();

      // Les guillemets sont la syntaxe dotenv, pas une partie de la
      // valeur. On les retire, sinon `JSON.parse` échoue plus loin avec
      // un message incompréhensible.
      const premier = valeur[0];
      const dernier = valeur[valeur.length - 1];
      if ((premier === "'" && dernier === "'") || (premier === '"' && dernier === '"')) {
        valeur = valeur.slice(1, -1);
      }

      // On n'écrase jamais une variable déjà présente dans
      // l'environnement : sur un serveur, c'est elle qui fait autorité.
      if (!process.env[cle]) process.env[cle] = valeur;
    }
  } catch {
    console.error(
      'Impossible de lire .env.local — les variables doivent alors venir de l’environnement.',
    );
  }
}

/**
 * Renvoie les identifiants du compte de service, ou arrête le script
 * avec un message qui dit quoi faire.
 */
export function compteDeService() {
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!brut) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY est absente de .env.local.');
    console.error(
      'Console Firebase > Paramètres du projet > Comptes de service > Générer une clé privée.',
    );
    process.exit(1);
  }

  try {
    const compte = JSON.parse(brut);
    if (!compte.project_id || !compte.client_email || !compte.private_key) {
      throw new Error('champs manquants');
    }
    return compte;
  } catch {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT_KEY est illisible. Colle le contenu du fichier .json ' +
        'sur une seule ligne.',
    );
    process.exit(1);
  }
}
