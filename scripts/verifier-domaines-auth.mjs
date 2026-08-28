// =====================================================================
//  Lit les domaines autorises par Firebase Authentication.
//
//  Firebase Auth refuse toute connexion venant d'un domaine absent de
//  cette liste. Par defaut elle contient `localhost` et les domaines
//  `*.firebaseapp.com` / `*.web.app` du projet — mais PAS le domaine
//  Vercel. Symptome : la page de connexion s'affiche, et l'inscription
//  echoue avec `auth/unauthorized-domain`.
//
//  Lecture seule. Pour ajouter un domaine :
//  console.firebase.google.com > Authentication > Settings >
//  Authorized domains > Add domain.
//
//  Usage : node scripts/verifier-domaines-auth.mjs
// =====================================================================

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);
const compte = compteDeService();

const app = initializeApp({
  credential: cert({
    projectId: compte.project_id,
    clientEmail: compte.client_email,
    privateKey: compte.private_key.replace(/\\n/g, '\n'),
  }),
});

const jeton = await app.options.credential.getAccessToken();

const reponse = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${compte.project_id}/config`,
  { headers: { Authorization: `Bearer ${jeton.access_token}` } },
);

if (!reponse.ok) {
  console.error(`Lecture impossible (${reponse.status}) : ${await reponse.text()}`);
  process.exit(1);
}

const config = await reponse.json();
const domaines = config.authorizedDomains ?? [];

console.log('Domaines autorises par Firebase Auth :');
for (const d of domaines) console.log(`   · ${d}`);

const attendus = ['maison-eve.vercel.app'];
const manquants = attendus.filter((d) => !domaines.includes(d));

if (manquants.length === 0) {
  console.log('\n✓ Le domaine de production est autorise.');
} else {
  console.log(`\n⚠️  MANQUANT : ${manquants.join(', ')}`);
  console.log('   La connexion et l’inscription echoueront depuis ce domaine');
  console.log('   (auth/unauthorized-domain).');
  console.log('   A ajouter : console.firebase.google.com > Authentication >');
  console.log('   Settings > Authorized domains.');
}

await getAuth(app).app.delete();
