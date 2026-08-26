// =====================================================================
//  Audit des visuels.
//
//  Il existe une famille de bugs d'images qui ne se voit PAS : le cadre
//  est en paysage, la photo est en portrait, `object-cover` recadre en
//  silence — et une photo recadrée reste une photo plausible. Rien ne
//  casse, rien ne s'affiche en rouge, personne ne le remarque. On a
//  trouvé ce défaut trois fois sur ce site :
//
//    · les cartes de soin en 4/3 avec des photos 3:4  → 44 % perdus ;
//    · la mosaïque de l'accueil, cinq tuiles paysage  → 55 % perdus ;
//    · l'en-tête d'article, colonne portrait          → 56 % perdus.
//
//  Ce script rend la famille détectable. Il vérifie trois choses :
//
//    1. tout chemin d'image cité dans `src/` existe dans `public/` ;
//    2. tout fichier de `public/` est cité quelque part ;
//    3. dans `galerie.ts`, le `format` DÉCLARÉ correspond à la forme
//       RÉELLE du fichier.
//
//  Ce qu'il ne peut pas voir : les cadres définis en CSS (`aspect-[…]`,
//  spans de grille, hauteurs de colonne). Ceux-là se mesurent dans le
//  navigateur — voir la note en tête de `EnTetePage.tsx`.
//
//  Lancer :  npm run audit:visuels
// =====================================================================

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const RACINE = process.cwd();
const DOSSIERS = ['soins', 'galerie', 'bandeaux', 'journal'];

/** Rapport du cadre imposé par chaque `format` de la mosaïque. */
const CADRE = { portrait: 3 / 4, carre: 1, paysage: 4 / 3 };

/** Au-delà, le recadrage mange le sujet et non plus les bords. */
const PERTE_MAX = 0.3;

let erreurs = 0;
let alertes = 0;

// --- Tous les fichiers source, pour y chercher les références --------
function fichiersSource(dossier, acc = []) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const p = join(dossier, e.name);
    if (e.isDirectory()) fichiersSource(p, acc);
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const sources = fichiersSource(join(RACINE, 'src'));
const texte = sources.map((f) => readFileSync(f, 'utf8')).join('\n');

const MOTIF = /\/(soins|galerie|bandeaux|journal)\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif|svg)/g;
const references = new Set(texte.match(MOTIF) ?? []);

// --- 1. Chaque référence a bien son fichier --------------------------
console.log('\n1. Références → fichiers');
for (const r of [...references].sort()) {
  if (!existsSync(join(RACINE, 'public', r))) {
    console.log(`   ✗ MANQUE   ${r}`);
    erreurs += 1;
  }
}
if (erreurs === 0) console.log(`   ✓ ${references.size} références, toutes servies`);

// --- 2. Aucun fichier orphelin ---------------------------------------
console.log('\n2. Fichiers → références');
const surDisque = [];
for (const d of DOSSIERS) {
  const rep = join(RACINE, 'public', d);
  if (!existsSync(rep)) continue;
  for (const nom of readdirSync(rep)) {
    const chemin = `/${d}/${nom}`;
    surDisque.push(chemin);
    if (!references.has(chemin)) {
      console.log(`   ⚠ orphelin ${chemin}`);
      alertes += 1;
    }
  }
}
if (alertes === 0) console.log(`   ✓ ${surDisque.length} fichiers, tous utilisés`);

// --- 3. Le format déclaré suit-il la forme du fichier ? --------------
console.log('\n3. galerie.ts : format déclaré vs forme réelle');
const galerie = readFileSync(join(RACINE, 'src/data/galerie.ts'), 'utf8');
const tuiles = [
  ...galerie.matchAll(/\{\s*src:\s*'([^']+)'[^}]*?format:\s*'(portrait|paysage|carre)'/g),
];

let pire = 0;
for (const [, src, format] of tuiles) {
  const abs = join(RACINE, 'public', src);
  if (!existsSync(abs)) continue;
  const { width, height } = await sharp(abs).metadata();
  const reel = width / height;
  const cadre = CADRE[format];
  const perte = 1 - Math.min(reel / cadre, cadre / reel);
  pire = Math.max(pire, perte);

  const drapeau = perte > PERTE_MAX ? '✗' : perte > 0.2 ? '·' : '✓';
  if (perte > PERTE_MAX) erreurs += 1;
  console.log(
    `   ${drapeau} ${src.padEnd(28)} fichier ${reel.toFixed(2)}  cadre ${cadre.toFixed(2)} (${format})` +
      `  → ${Math.round(perte * 100)}% rogné`,
  );
}
console.log(`   pire recadrage : ${Math.round(pire * 100)}%  (seuil ${PERTE_MAX * 100}%)`);

// --- 4. Chaque dossier a une orientation de contrat -------------------
//
//  Ce n'est pas de la cosmétique : chaque dossier alimente un cadre dont
//  le rapport est fixé dans le code. Déposer un paysage dans `soins/`
//  reviendrait à le faire rogner de moitié dans la grille, en silence.
//
//    soins/     → cartes en 4/5                      → PORTRAIT
//    bandeaux/  → colonne « côté »                   → PORTRAIT (sauf dérogation)
//    journal/   → cartes 16/10 et en-tête 16/9       → PAYSAGE
//    galerie/   → mixte, déjà vérifié au point 3
console.log('');
console.log('4. Orientation attendue par dossier');
const CONTRAT = { soins: 'portrait', bandeaux: 'portrait', journal: 'paysage' };

/** Les dérogations portent leur raison — sinon ce n'est pas une exception, c'est un oubli. */
const DEROGATIONS = {
  '/bandeaux/reservation.jpg': 'bandeau pleine largeur (disposition « plein »)',
};

let horsContrat = 0;
for (const [dossier, attendu] of Object.entries(CONTRAT)) {
  const rep = join(RACINE, 'public', dossier);
  if (!existsSync(rep)) continue;
  for (const nom of readdirSync(rep).filter((n) => !n.endsWith('.svg'))) {
    const chemin = `/${dossier}/${nom}`;
    const { width, height } = await sharp(join(rep, nom)).metadata();
    const r = width / height;
    const oriente = r < 0.9 ? 'portrait' : r > 1.15 ? 'paysage' : 'carré';
    if (oriente === attendu) continue;
    if (DEROGATIONS[chemin]) {
      console.log(`   · ${chemin.padEnd(30)} ${oriente} — ${DEROGATIONS[chemin]}`);
      continue;
    }
    console.log(`   ✗ ${chemin.padEnd(30)} est en ${oriente}, ce dossier attend du ${attendu}`);
    erreurs += 1;
    horsContrat += 1;
  }
}
if (horsContrat === 0) console.log('   ✓ chaque fichier suit l’orientation de son dossier');


// --- Table des rapports, pour choisir un cadre en connaissance -------
console.log('\n5. Rapport de chaque fichier');
for (const d of DOSSIERS) {
  const rep = join(RACINE, 'public', d);
  if (!existsSync(rep)) continue;
  const lignes = [];
  for (const nom of readdirSync(rep).filter((n) => !n.endsWith('.svg'))) {
    const { width, height } = await sharp(join(rep, nom)).metadata();
    const r = width / height;
    lignes.push(`${nom.replace(/\.\w+$/, '')} ${r.toFixed(2)}${r < 0.9 ? '↕' : r > 1.15 ? '↔' : '□'}`);
  }
  console.log(`   ${d.padEnd(9)} ${lignes.join('   ')}`);
}

console.log(
  `\n${erreurs === 0 ? '✓' : '✗'} ${erreurs} erreur(s), ${alertes} alerte(s)\n`,
);
process.exit(erreurs === 0 ? 0 : 1);
