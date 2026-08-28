// =====================================================================
//  Depublie dans Firestore les articles qui ne sont plus au sommaire.
//
//  `seed.mjs` fait un `merge` : il ecrit les articles courants mais laisse
//  en base ceux dont le slug a change ou qui ont ete retires. Sans ce
//  passage, un ancien slug continue de servir une page.
//
//  On ne SUPPRIME pas : on passe `publie: false`. Reversible depuis /admin.
//
//  Usage : node scripts/depublier-journal-obsolete.mjs
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
    privateKey: compte.private_key.replace(/\n/g, '\n'),
  }),
});

const db = getFirestore();

const journal = await import(new URL('../src/data/journal.ts', import.meta.url).href);
const slugsValides = new Set(journal.articles.map((a) => a.slug));

const snap = await db.collection('journal').get();
const obsoletes = snap.docs.filter((d) => !slugsValides.has(d.id) && d.data().publie !== false);

if (obsoletes.length === 0) {
  console.log('Rien a depublier — le journal est aligne.');
  process.exit(0);
}

const lot = db.batch();
for (const d of obsoletes) lot.update(d.ref, { publie: false, obsoleteLe: new Date().toISOString() });
await lot.commit();

console.log(`${obsoletes.length} article(s) obsolete(s) depublie(s) :`);
for (const d of obsoletes) console.log(`   · ${d.id}  (${d.data().titre ?? '?'})`);
