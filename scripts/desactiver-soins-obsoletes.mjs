// =====================================================================
//  Desactive dans Firestore les soins qui ne sont plus au catalogue.
//
//  Le catalogue reel de Maison Eve (grille officielle du 12/01/2026) a
//  remplace les soins inventes. Le script `seed.mjs` fait un `merge` :
//  il ecrit les nouveaux mais laisse les anciens en place. Sans ce
//  passage, Firestore contiendrait les deux jeux.
//
//  On ne SUPPRIME pas : on passe `actif: false`. Le site filtre sur
//  `actif`, donc les anciens disparaissent de l'affichage, et rien n'est
//  detruit — c'est reversible depuis /admin.
//
//  Usage : node scripts/desactiver-soins-obsoletes.mjs
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

const catalogue = await import(new URL('../src/data/services.ts', import.meta.url).href);
const idsValides = new Set(catalogue.services.map((s) => s.id));

const snap = await db.collection('services').get();
const obsoletes = snap.docs.filter((d) => !idsValides.has(d.id) && d.data().actif !== false);

if (obsoletes.length === 0) {
  console.log('Rien a desactiver — Firestore est aligne sur le catalogue.');
  process.exit(0);
}

const lot = db.batch();
for (const d of obsoletes) {
  lot.update(d.ref, { actif: false, obsoleteLe: new Date().toISOString() });
}
await lot.commit();

console.log(`${obsoletes.length} soin(s) obsolete(s) desactive(s) :`);
for (const d of obsoletes) console.log(`   · ${d.id}  (${d.data().nom ?? '?'})`);
console.log('\nIls restent en base et sont reactivables depuis /admin.');
