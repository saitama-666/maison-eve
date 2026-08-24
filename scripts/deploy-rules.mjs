// =====================================================================
//  Déploie les règles Firestore via l'API REST.
//
//  POURQUOI CE SCRIPT PLUTÔT QUE `firebase deploy` :
//  sur l'autre projet, `firebase deploy` échoue en 403 — la permission
//  `serviceusage.services.get` manque au compte de service. Le
//  contournement est d'appeler directement l'API Firebase Rules, qui n'a
//  pas besoin de cette permission.
//
//  Ne pas « réparer » en réessayant `firebase deploy` : le problème est
//  côté droits Google Cloud, pas côté fichier de règles.
//
//  Usage : node scripts/deploy-rules.mjs
// =====================================================================

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);

const compte = compteDeService();
const projet = compte.project_id;

const app = initializeApp({
  credential: cert({
    projectId: projet,
    clientEmail: compte.client_email,
    privateKey: compte.private_key.replace(/\\n/g, '\n'),
  }),
});

// Jeton OAuth obtenu depuis les identifiants du compte de service.
const jeton = await app.options.credential.getAccessToken();

const entetes = {
  Authorization: `Bearer ${jeton.access_token}`,
  'Content-Type': 'application/json',
};

/**
 * Déploie un fichier de règles en deux temps :
 *  1. créer un « ruleset » (une version des règles) ;
 *  2. publier ce ruleset sur la ressource visée.
 *
 * L'étape 1 valide la syntaxe : une erreur ici signale une faute dans le
 * fichier, pas un problème de droits.
 */
async function deployer(fichier, ressource) {
  const contenu = readFileSync(new URL(`../${fichier}`, import.meta.url), 'utf8');

  const creation = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projet}/rulesets`,
    {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify({ source: { files: [{ name: fichier, content: contenu }] } }),
    },
  );

  if (!creation.ok) {
    throw new Error(`Validation de ${fichier} refusée :\n${await creation.text()}`);
  }

  const ruleset = await creation.json();

  const publication = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projet}/releases/${ressource}?updateMask=rulesetName`,
    {
      method: 'PATCH',
      headers: entetes,
      body: JSON.stringify({
        release: {
          name: `projects/${projet}/releases/${ressource}`,
          rulesetName: ruleset.name,
        },
      }),
    },
  );

  if (!publication.ok) {
    throw new Error(`Publication de ${fichier} refusée :\n${await publication.text()}`);
  }

  console.log(`${fichier} déployé.`);
}

try {
  await deployer('firestore.rules', 'cloud.firestore');

  console.log('');
  console.log('Règles Firestore en ligne.');
  console.log('');
  console.log('storage.rules n’est PAS déployé : Cloud Storage exige le plan Blaze.');
  console.log('Les visuels vivent dans public/ en attendant. Voir SECURITY.md.');
} catch (e) {
  console.error('Échec :', e?.message ?? e);
  process.exit(1);
}
