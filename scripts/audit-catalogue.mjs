// =====================================================================
//  Audit du catalogue Firestore.
//
//  Firestore FAIT AUTORITÉ sur le catalogue : `catalogue.ts` ne se rabat
//  sur `src/data/*` que si la base est absente ou vide. Conséquence peu
//  intuitive et déjà coûteuse : corriger un chemin d'image dans le code
//  ne corrige RIEN sur le site en ligne.
//
//  C'est arrivé le 26/08/2026. Les 34 photos ont été déposées et les 44
//  références du code passées de `.svg` à `.jpg` — mais Firestore, peuplé
//  avant, servait toujours `/soins/massage-traditionnel.svg`. Le HTML de
//  production PRÉCHARGEAIT trois fichiers supprimés. Rien dans le code ne
//  pouvait le montrer : la dérive est entre la base et le disque.
//
//  Ce script compare donc les deux. Sans identifiants, il le dit et sort
//  proprement — il ne fait jamais échouer une CI qui n'a pas la clé.
//
//  Lancer :  npm run audit:catalogue
// =====================================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);

let compte;
try {
  compte = compteDeService();
} catch {
  console.log('\n⏭  Pas d’identifiants de service — audit du catalogue ignoré.');
  console.log('   (normal en CI ; en local, vérifier GOOGLE_APPLICATION_CREDENTIALS)\n');
  process.exit(0);
}

const { cert, initializeApp } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

initializeApp({
  credential: cert({
    projectId: compte.project_id,
    clientEmail: compte.client_email,
    privateKey: compte.private_key.replace(/\n/g, '\n'),
  }),
});

const db = getFirestore();
const RACINE = process.cwd();

let erreurs = 0;
let verifies = 0;

for (const col of ['services', 'journal']) {
  const snap = await db.collection(col).get();
  console.log(`\n${col} — ${snap.size} document(s)`);

  if (snap.empty) {
    console.log('   ⚠  vide : le site sert le repli de `src/data/`.');
    continue;
  }

  for (const doc of snap.docs) {
    const image = doc.data().image;
    if (typeof image !== 'string' || !image) {
      console.log(`   ·  ${doc.id.padEnd(26)} pas de champ image (le repli du code s’applique)`);
      continue;
    }
    verifies += 1;
    if (existsSync(join(RACINE, 'public', image))) {
      console.log(`   ✓  ${doc.id.padEnd(26)} ${image}`);
    } else {
      console.log(`   ✗  ${doc.id.padEnd(26)} ${image}  ← ABSENT DE public/`);
      erreurs += 1;
    }
  }
}

console.log(
  `\n${erreurs === 0 ? '✓' : '✗'} ${verifies} image(s) vérifiée(s), ${erreurs} introuvable(s)\n`,
);
process.exit(erreurs === 0 ? 0 : 1);
