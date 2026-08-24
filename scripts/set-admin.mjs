// =====================================================================
//  Donne (ou retire) le rôle administrateur à un compte.
//
//  Le rôle est un CUSTOM CLAIM Firebase : il vit dans le jeton signé, pas
//  dans un document Firestore. Impossible à forcer depuis le navigateur,
//  contrairement à un champ `isAdmin` qu'on pourrait modifier.
//
//  Usage :
//    node scripts/set-admin.mjs email@exemple.com
//    node scripts/set-admin.mjs email@exemple.com --retirer
//
//  ⚠️  La personne doit se DÉCONNECTER puis se reconnecter pour que son
//      nouveau jeton porte le claim. Sinon elle garde l'ancien pendant
//      une heure et croit que la commande n'a pas fonctionné.
// =====================================================================

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { chargerEnv, compteDeService } from './env.mjs';

chargerEnv(import.meta.url);

const email = process.argv[2];
const retirer = process.argv.includes('--retirer');

if (!email || !email.includes('@')) {
  console.error('Usage : node scripts/set-admin.mjs email@exemple.com [--retirer]');
  process.exit(1);
}

const compte = compteDeService();

initializeApp({
  credential: cert({
    projectId: compte.project_id,
    clientEmail: compte.client_email,
    privateKey: compte.private_key.replace(/\\n/g, '\n'),
  }),
});

try {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);

  // `admin: null` retire proprement le claim. Passer `{}` le laisserait
  // en place : `setCustomUserClaims` remplace l'objet entier, mais un
  // claim à `null` est le moyen documenté de le supprimer.
  await auth.setCustomUserClaims(user.uid, retirer ? { admin: null } : { admin: true });

  console.log(
    retirer
      ? `Rôle administrateur RETIRÉ à ${email} (uid ${user.uid}).`
      : `Rôle administrateur DONNÉ à ${email} (uid ${user.uid}).`,
  );
  console.log('');
  console.log('La personne doit se déconnecter puis se reconnecter pour que ce soit actif.');
} catch (e) {
  const code = e?.code ?? '';
  if (code === 'auth/user-not-found') {
    console.error(`Aucun compte avec l’adresse ${email}.`);
    console.error('Le compte doit exister : demande à la personne de s’inscrire d’abord.');
  } else {
    console.error('Échec :', e?.message ?? e);
  }
  process.exit(1);
}
