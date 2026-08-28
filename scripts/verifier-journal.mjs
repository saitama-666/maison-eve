// Verification ponctuelle : etat du flag `publie` dans Firestore.
// Usage : node scripts/verifier-journal.mjs

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
const snap = await db.collection('journal').get();

for (const d of snap.docs) {
  console.log(`  ${d.id.padEnd(40)} publie = ${d.data().publie}`);
}
