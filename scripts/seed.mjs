// =====================================================================
//  Remplit Firestore avec le catalogue de repli.
//
//  À lancer UNE FOIS, après avoir configuré `.env.local`. Le site
//  fonctionne très bien sans : il se rabat automatiquement sur
//  `src/data/services.ts`. Ce script sert à passer la main au
//  back-office, pour que le catalogue devienne modifiable depuis /admin
//  sans toucher au code.
//
//  IDEMPOTENT : chaque soin est écrit avec son `id` comme identifiant de
//  document. Relancer le script met à jour au lieu de dupliquer.
//
//  Le catalogue est importé DIRECTEMENT depuis le TypeScript : Node 22+
//  sait retirer les annotations de type tout seul. Une seule source de
//  vérité, donc — pas de copie à maintenir en parallèle.
//
//  Usage : node scripts/seed.mjs
// =====================================================================

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);

const compte = compteDeService();

initializeApp({
  credential: cert({
    projectId: compte.project_id,
    clientEmail: compte.client_email,
    privateKey: compte.private_key.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

// --- Lecture du catalogue ------------------------------------------------
let services;
let categories;
let articles;

try {
  const catalogue = await import(new URL('../src/data/services.ts', import.meta.url).href);
  const journal = await import(new URL('../src/data/journal.ts', import.meta.url).href);
  services = catalogue.services;
  categories = catalogue.categories;
  articles = journal.articles;
} catch (e) {
  console.error('Impossible de lire le catalogue depuis src/data/ :', e?.message ?? e);
  console.error('');
  console.error('Node doit savoir retirer les types TypeScript (Node 22.18 ou plus récent).');
  console.error(`Version détectée : ${process.version}`);
  process.exit(1);
}

console.log(`${services.length} soins, ${categories.length} catégories, ${articles.length} articles.`);
console.log('');

// --- Écriture -------------------------------------------------------------
const lot = db.batch();

for (const c of categories) {
  lot.set(db.collection('categories').doc(c.id), { ...c }, { merge: true });
}

for (const s of services) {
  lot.set(
    db.collection('services').doc(s.id),
    { ...s, seedeLe: new Date() },
    { merge: true },
  );
}

for (const a of articles) {
  lot.set(
    db.collection('journal').doc(a.slug),
    { ...a, seedeLe: new Date() },
    { merge: true },
  );
}

await lot.commit();

console.log('Écriture terminée. Le back-office prend maintenant la main sur le catalogue.');
console.log('');
console.log('⚠️  RAPPEL IMPORTANT');
console.log('   Les tarifs et durées écrits sont des PROPOSITIONS, pas des prix validés.');
console.log('   Ils servent à tenir la mise en page. À confirmer avant toute mise en ligne.');
console.log('   Voir PROGRESS.md, section 11.');
