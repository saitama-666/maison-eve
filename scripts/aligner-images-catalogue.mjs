// =====================================================================
//  Aligne les chemins d'image de Firestore sur les fichiers de `public/`.
//
//  ⚠️  L'ORDRE COMPTE, ET IL EST CONTRE-INTUITIF.
//
//      Firestore fait autorite sur le catalogue. Changer un chemin dans
//      `src/data/services.ts` ne change RIEN en ligne. Mais l'inverse est
//      vrai aussi : pointer Firestore vers un fichier qui n'est pas
//      ENCORE DEPLOYE casse le site en ligne immediatement, meme si tout
//      fonctionne en local.
//
//      C'est arrive le 26/08/2026 : la base a ete migree vers les `.jpg`
//      avant le deploiement, et les images des soins ont disparu du site
//      public jusqu'au retour en arriere.
//
//      LA SEQUENCE EST DONC : deployer d'abord, aligner ensuite.
//        1. `npx vercel --prod` (ou pousser sur `main`)
//        2. `npm run catalogue:aligner`
//
//  Le script ne touche QUE le champ `image`, et seulement si le fichier
//  vise existe vraiment. Les tarifs modifies depuis /admin ne bougent
//  pas — contrairement a `npm run seed`, qui reecrit tout le document.
//
//  Sans `--appliquer`, il ne fait que simuler.
// =====================================================================

import { existsSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);

let compte;
try {
  compte = compteDeService();
} catch {
  console.log('\n⏭  Pas d’identifiants de service — rien à faire.\n');
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
const APPLIQUER = process.argv.includes('--appliquer');

/** Cherche un fichier de meme nom, quelle que soit son extension. */
function equivalentSurDisque(chemin) {
  const dossier = join(RACINE, 'public', chemin.split('/').slice(1, -1).join('/'));
  if (!existsSync(dossier)) return null;
  const souche = basename(chemin, extname(chemin));
  const trouve = readdirSync(dossier).find((n) => basename(n, extname(n)) === souche);
  return trouve ? `/${chemin.split('/').slice(1, -1).join('/')}/${trouve}` : null;
}

let aChanger = 0;
let deja = 0;
let introuvables = 0;

for (const col of ['services', 'journal']) {
  const snap = await db.collection(col).get();
  console.log(`\n${col} — ${snap.size} document(s)`);

  for (const doc of snap.docs) {
    const actuel = doc.data().image;
    if (typeof actuel !== 'string' || !actuel) continue;

    if (existsSync(join(RACINE, 'public', actuel))) {
      deja += 1;
      continue;
    }

    const cible = equivalentSurDisque(actuel);
    if (!cible) {
      console.log(`   ✗ ${doc.id.padEnd(34)} ${actuel} — aucun fichier de ce nom`);
      introuvables += 1;
      continue;
    }

    console.log(`   ${APPLIQUER ? '→' : '·'} ${doc.id.padEnd(34)} ${actuel}  →  ${cible}`);
    if (APPLIQUER) await doc.ref.update({ image: cible });
    aChanger += 1;
  }
}

console.log(
  `\n${APPLIQUER ? 'APPLIQUÉ' : 'SIMULATION'} : ${aChanger} à aligner, ` +
    `${deja} déjà bons, ${introuvables} introuvables`,
);
if (!APPLIQUER && aChanger > 0) {
  console.log('\n⚠️  DÉPLOYER D’ABORD. Puis : npm run catalogue:aligner -- --appliquer\n');
}
process.exit(introuvables > 0 ? 1 : 0);
