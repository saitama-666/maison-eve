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
  // Deux formes acceptées, dans cet ordre :
  //
  //   1. GOOGLE_APPLICATION_CREDENTIALS — un CHEMIN vers le fichier .json.
  //      Forme à privilégier en local : `.env.local` ne contient alors
  //      qu'un chemin, et le secret reste dans un seul fichier ignoré par
  //      git. Un fichier de configuration finit toujours par être ouvert
  //      devant quelqu'un, collé dans un ticket ou affiché par un outil ;
  //      un chemin ne coûte rien s'il fuite.
  //
  //   2. FIREBASE_SERVICE_ACCOUNT_KEY — le JSON complet sur une ligne.
  //      Nécessaire chez un hébergeur sans système de fichiers persistant.
  let brut = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!brut && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      brut = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    } catch {
      console.error(
        'GOOGLE_APPLICATION_CREDENTIALS désigne « ' +
          process.env.GOOGLE_APPLICATION_CREDENTIALS +
          ' », introuvable ou illisible.',
      );
      process.exit(1);
    }
  }

  if (!brut) {
    console.error('Aucune clé de compte de service trouvée dans .env.local.');
    console.error('Attendu : GOOGLE_APPLICATION_CREDENTIALS (chemin du .json)');
    console.error('      ou : FIREBASE_SERVICE_ACCOUNT_KEY (JSON sur une ligne)');
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
