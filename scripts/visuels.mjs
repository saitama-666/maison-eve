// =====================================================================
//  Génère les visuels de remplacement du site.
//
//  ⚠️  CE SONT DES ILLUSTRATIONS, PAS DES PHOTOS.
//      Elles doivent TOUTES être remplacées par de vraies photographies
//      de l'institut avant la mise en ligne — voir PROGRESS.md §11. Un
//      encart le dit au visiteur sur /galerie.
//
//  Pourquoi elles ne sont pas de simples dégradés :
//  la première version produisait des taches abstraites. Sur un site de
//  spa, ça ne raconte rien et ça fait « site pas fini ». Ici, chaque
//  visuel est une SCÈNE COMPOSÉE — bougies, serviettes roulées, pierres,
//  théière, lanterne, zellige — avec les quatre ingrédients qui font
//  qu'une image vectorielle cesse d'avoir l'air plate :
//
//    1. UNE SOURCE DE LUMIÈRE unique, en haut à gauche, qui décide de
//       tous les reflets et de toutes les ombres portées.
//    2. DE LA PROFONDEUR DE CHAMP : l'arrière-plan est réellement flouté
//       (`feGaussianBlur`), avec des ronds de lumière hors focus.
//    3. DU GRAIN (`feTurbulence` désaturé, très faible opacité). C'est le
//       détail qui coûte le moins et qui change le plus : sans grain, un
//       SVG se lit immédiatement comme un aplat.
//    4. UN VIGNETTAGE chaud, qui referme le cadre et concentre l'œil.
//
//  Palette strictement alignée sur `globals.css`.
//
//  Lancer :  node scripts/visuels.mjs
// =====================================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, '..', 'public');

// --- Palettes ----------------------------------------------------------
// Chacune décrit une ambiance : le fond lointain, le fond proche, la
// lumière, et la couleur des objets.
const AMBIANCES = {
  // Cabine de soin, fin de journée : chaud, intime.
  cabine: { loin: '#3a2c22', pres: '#5c4636', lumiere: '#f3d9a8', objet: '#2a1f18', accent: '#c9a877' },
  // Hammam : vapeur, tadelakt, plus gris-rosé.
  hammam: { loin: '#4a3b31', pres: '#6d5546', lumiere: '#f6e4c6', objet: '#33261e', accent: '#d8b98c' },
  // Table d'huiles : crème, lumineux, presque studio.
  huiles: { loin: '#8a7460', pres: '#b39a80', lumiere: '#fff2dc', objet: '#4a3728', accent: '#7d5925' },
  // Salon marocain : profond, lanternes.
  salon: { loin: '#2e231b', pres: '#4d3b2c', lumiere: '#ffd89d', objet: '#241a13', accent: '#e0b878' },
  // Extérieur / accueil : plus clair et frais.
  accueil: { loin: '#6f5f52', pres: '#9a8471', lumiere: '#fff5e6', objet: '#4a3a2d', accent: '#d9bb90' },
};

// --- Générateur pseudo-aléatoire déterministe --------------------------
// Le même nom de fichier donne toujours exactement le même visuel : on
// peut relancer le script sans que la mise en page bouge.
function graine(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function alea(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const n = (v) => Number(v.toFixed(1));

// =====================================================================
//  Accessoires — dessinés une fois, réutilisés dans toutes les scènes.
//  Chacun reçoit sa position, son échelle et l'ambiance.
// =====================================================================

/** Serviette roulée, vue de face : un cylindre et sa spirale. */
function serviette(x, y, r, a, opacite = 1) {
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${opacite}">
    <ellipse cx="0" cy="${n(r * 0.92)}" rx="${n(r * 1.25)}" ry="${n(r * 0.3)}" fill="#000" opacity="0.28"/>
    <circle cx="0" cy="0" r="${n(r)}" fill="${a.lumiere}" opacity="0.95"/>
    <circle cx="0" cy="0" r="${n(r)}" fill="url(#volume)"/>
    <path d="M ${n(-r * 0.55)} 0 A ${n(r * 0.55)} ${n(r * 0.55)} 0 1 1 ${n(r * 0.3)} ${n(r * 0.46)}"
      fill="none" stroke="${a.objet}" stroke-width="${n(r * 0.07)}" opacity="0.2" stroke-linecap="round"/>
    <path d="M ${n(-r * 0.28)} 0 A ${n(r * 0.28)} ${n(r * 0.28)} 0 1 1 ${n(r * 0.15)} ${n(r * 0.24)}"
      fill="none" stroke="${a.objet}" stroke-width="${n(r * 0.06)}" opacity="0.14" stroke-linecap="round"/>
  </g>`;
}

/** Bougie allumée, avec son halo. La flamme porte la lumière de la scène. */
function bougie(x, y, l, h, a) {
  return `<g transform="translate(${n(x)} ${n(y)})">
    <ellipse cx="0" cy="${n(h * 0.04)}" rx="${n(l * 1.5)}" ry="${n(l * 0.32)}" fill="#000" opacity="0.3"/>
    <rect x="${n(-l / 2)}" y="${n(-h)}" width="${n(l)}" height="${n(h)}" rx="${n(l * 0.12)}" fill="${a.lumiere}" opacity="0.9"/>
    <rect x="${n(-l / 2)}" y="${n(-h)}" width="${n(l)}" height="${n(h)}" rx="${n(l * 0.12)}" fill="url(#volume)"/>
    <ellipse cx="0" cy="${n(-h)}" rx="${n(l / 2)}" ry="${n(l * 0.16)}" fill="${a.objet}" opacity="0.35"/>
    <!-- flamme + halo -->
    <circle cx="0" cy="${n(-h - l * 0.5)}" r="${n(l * 2.4)}" fill="url(#halo)"/>
    <path d="M 0 ${n(-h - l * 0.95)} C ${n(l * 0.3)} ${n(-h - l * 0.5)}, ${n(l * 0.22)} ${n(-h - l * 0.08)}, 0 ${n(-h - l * 0.06)}
             C ${n(-l * 0.22)} ${n(-h - l * 0.08)}, ${n(-l * 0.3)} ${n(-h - l * 0.5)}, 0 ${n(-h - l * 0.95)} Z"
      fill="#ffe6b0"/>
    <path d="M 0 ${n(-h - l * 0.62)} C ${n(l * 0.12)} ${n(-h - l * 0.36)}, ${n(l * 0.09)} ${n(-h - l * 0.1)}, 0 ${n(-h - l * 0.08)}
             C ${n(-l * 0.09)} ${n(-h - l * 0.1)}, ${n(-l * 0.12)} ${n(-h - l * 0.36)}, 0 ${n(-h - l * 0.62)} Z"
      fill="#fff6e0"/>
  </g>`;
}

/** Pile de galets — le classique du spa, en trois tailles décroissantes. */
function pierres(x, y, r, a) {
  const tailles = [1, 0.78, 0.56];
  let out = `<ellipse cx="${n(x)}" cy="${n(y + r * 0.42)}" rx="${n(r * 1.7)}" ry="${n(r * 0.4)}" fill="#000" opacity="0.3"/>`;
  let cy = y;
  tailles.forEach((t, i) => {
    const rx = r * t;
    const ry = r * t * 0.42;
    out += `<g transform="translate(${n(x)} ${n(cy)})">
      <ellipse cx="0" cy="0" rx="${n(rx)}" ry="${n(ry)}" fill="${a.objet}"/>
      <ellipse cx="${n(-rx * 0.18)}" cy="${n(-ry * 0.34)}" rx="${n(rx * 0.62)}" ry="${n(ry * 0.46)}" fill="${a.lumiere}" opacity="${0.22 - i * 0.04}"/>
    </g>`;
    cy -= ry * 1.85;
  });
  return out;
}

/** Bol de tadelakt, avec l'eau et son reflet. */
function bol(x, y, r, a) {
  return `<g transform="translate(${n(x)} ${n(y)})">
    <ellipse cx="0" cy="${n(r * 0.5)}" rx="${n(r * 1.15)}" ry="${n(r * 0.26)}" fill="#000" opacity="0.3"/>
    <path d="M ${n(-r)} 0 A ${n(r)} ${n(r * 0.9)} 0 0 0 ${n(r)} 0 Z" fill="${a.objet}"/>
    <ellipse cx="0" cy="0" rx="${n(r)}" ry="${n(r * 0.28)}" fill="${a.pres}"/>
    <ellipse cx="0" cy="0" rx="${n(r * 0.88)}" ry="${n(r * 0.23)}" fill="${a.lumiere}" opacity="0.5"/>
    <ellipse cx="${n(-r * 0.3)}" cy="${n(-r * 0.04)}" rx="${n(r * 0.26)}" ry="${n(r * 0.06)}" fill="#fff" opacity="0.35"/>
  </g>`;
}

/** Fleur flottante, cinq pétales. Sert de ponctuation colorée. */
function fleur(x, y, r, a, rot = 0) {
  let petales = '';
  for (let i = 0; i < 5; i += 1) {
    const ang = (i * 72 + rot) * (Math.PI / 180);
    const px = Math.cos(ang) * r * 0.62;
    const py = Math.sin(ang) * r * 0.62;
    petales += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(r * 0.5)}" ry="${n(r * 0.34)}"
      transform="rotate(${n(i * 72 + rot)} ${n(px)} ${n(py)})" fill="${a.lumiere}" opacity="0.9"/>`;
  }
  return `<g transform="translate(${n(x)} ${n(y)})">${petales}
    <circle cx="0" cy="0" r="${n(r * 0.22)}" fill="${a.accent}"/></g>`;
}

/** Branche d'eucalyptus — verticalité végétale, casse les rondeurs. */
function branche(x, y, h, a, sens = 1) {
  let feuilles = '';
  const nb = 7;
  for (let i = 0; i < nb; i += 1) {
    const t = i / (nb - 1);
    const fy = -t * h;
    const fx = Math.sin(t * 2.6) * h * 0.1 * sens;
    const taille = h * (0.11 - t * 0.045);
    feuilles += `<ellipse cx="${n(fx + taille * 1.1 * sens)}" cy="${n(fy)}" rx="${n(taille * 1.25)}" ry="${n(taille * 0.62)}"
      transform="rotate(${n(-26 * sens)} ${n(fx + taille * 1.1 * sens)} ${n(fy)})" fill="${a.objet}" opacity="0.82"/>`;
    feuilles += `<ellipse cx="${n(fx - taille * 1.1 * sens)}" cy="${n(fy - taille * 0.5)}" rx="${n(taille * 1.15)}" ry="${n(taille * 0.58)}"
      transform="rotate(${n(26 * sens)} ${n(fx - taille * 1.1 * sens)} ${n(fy - taille * 0.5)})" fill="${a.objet}" opacity="0.68"/>`;
  }
  return `<g transform="translate(${n(x)} ${n(y)})">
    <path d="M 0 0 C ${n(h * 0.06 * sens)} ${n(-h * 0.4)}, ${n(-h * 0.04 * sens)} ${n(-h * 0.7)}, ${n(h * 0.02 * sens)} ${n(-h)}"
      fill="none" stroke="${a.objet}" stroke-width="${n(h * 0.018)}" opacity="0.7"/>
    ${feuilles}</g>`;
}

/** Théière marocaine — la signature culturelle de la marque. */
function theiere(x, y, r, a) {
  return `<g transform="translate(${n(x)} ${n(y)})">
    <ellipse cx="0" cy="${n(r * 0.98)}" rx="${n(r * 1.25)}" ry="${n(r * 0.28)}" fill="#000" opacity="0.32"/>
    <path d="M ${n(-r * 0.72)} ${n(r * 0.9)} L ${n(-r * 0.5)} ${n(r * 0.34)} Q 0 ${n(r * 0.1)} ${n(r * 0.5)} ${n(r * 0.34)} L ${n(r * 0.72)} ${n(r * 0.9)} Z" fill="${a.objet}"/>
    <ellipse cx="0" cy="${n(r * 0.28)}" rx="${n(r * 0.62)}" ry="${n(r * 0.5)}" fill="${a.objet}"/>
    <ellipse cx="${n(-r * 0.2)}" cy="${n(r * 0.12)}" rx="${n(r * 0.3)}" ry="${n(r * 0.24)}" fill="${a.accent}" opacity="0.3"/>
    <path d="M ${n(r * 0.5)} ${n(r * 0.2)} Q ${n(r * 1.15)} ${n(r * 0.05)}, ${n(r * 1.02)} ${n(-r * 0.55)}"
      fill="none" stroke="${a.objet}" stroke-width="${n(r * 0.12)}" stroke-linecap="round"/>
    <path d="M ${n(-r * 0.52)} ${n(r * 0.05)} Q ${n(-r * 0.95)} ${n(-r * 0.15)}, ${n(-r * 0.72)} ${n(-r * 0.5)}"
      fill="none" stroke="${a.objet}" stroke-width="${n(r * 0.1)}" stroke-linecap="round"/>
    <path d="M ${n(-r * 0.3)} ${n(-r * 0.2)} Q 0 ${n(-r * 0.62)}, ${n(r * 0.3)} ${n(-r * 0.2)} Z" fill="${a.objet}"/>
    <circle cx="0" cy="${n(-r * 0.5)}" r="${n(r * 0.11)}" fill="${a.accent}"/>
  </g>`;
}

/** Lanterne ajourée, suspendue. Pose la profondeur en haut du cadre. */
function lanterne(x, y, l, h, a) {
  const trous = [];
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      trous.push(`<circle cx="${n(-l * 0.26 + i * l * 0.26)}" cy="${n(h * 0.18 + j * h * 0.22)}" r="${n(l * 0.055)}" fill="${a.lumiere}" opacity="0.85"/>`);
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)})">
    <line x1="0" y1="${n(-h * 0.9)}" x2="0" y2="${n(-h * 0.1)}" stroke="${a.objet}" stroke-width="${n(l * 0.03)}" opacity="0.6"/>
    <circle cx="0" cy="${n(h * 0.42)}" r="${n(l * 1.5)}" fill="url(#halo)" opacity="0.75"/>
    <path d="M 0 ${n(-h * 0.12)} L ${n(l * 0.42)} ${n(h * 0.06)} L ${n(l * 0.42)} ${n(h * 0.78)} L 0 ${n(h * 0.96)} L ${n(-l * 0.42)} ${n(h * 0.78)} L ${n(-l * 0.42)} ${n(h * 0.06)} Z"
      fill="${a.objet}"/>
    ${trous.join('')}
    <path d="M 0 ${n(h * 0.96)} l ${n(l * 0.07)} ${n(h * 0.12)} l ${n(-l * 0.07)} ${n(h * 0.07)} l ${n(-l * 0.07)} ${n(-h * 0.07)} Z" fill="${a.objet}"/>
  </g>`;
}

/** Flacon d'huile avec sa pipette. */
function flacon(x, y, l, h, a) {
  return `<g transform="translate(${n(x)} ${n(y)})">
    <ellipse cx="0" cy="${n(h * 0.04)}" rx="${n(l * 0.95)}" ry="${n(l * 0.25)}" fill="#000" opacity="0.3"/>
    <rect x="${n(-l / 2)}" y="${n(-h * 0.72)}" width="${n(l)}" height="${n(h * 0.72)}" rx="${n(l * 0.18)}" fill="${a.objet}" opacity="0.9"/>
    <rect x="${n(-l * 0.34)}" y="${n(-h * 0.6)}" width="${n(l * 0.24)}" height="${n(h * 0.44)}" rx="${n(l * 0.1)}" fill="${a.lumiere}" opacity="0.28"/>
    <rect x="${n(-l * 0.2)}" y="${n(-h * 0.92)}" width="${n(l * 0.4)}" height="${n(h * 0.22)}" rx="${n(l * 0.06)}" fill="${a.accent}" opacity="0.85"/>
    <rect x="${n(-l * 0.09)}" y="${n(-h * 1.12)}" width="${n(l * 0.18)}" height="${n(h * 0.22)}" rx="${n(l * 0.05)}" fill="${a.objet}"/>
  </g>`;
}

/** Volutes de vapeur — indispensables pour le hammam. */
function vapeur(x, y, h, r, opacite = 0.16) {
  let d = `M ${n(x)} ${n(y)}`;
  const pas = h / 5;
  for (let i = 1; i <= 5; i += 1) {
    const sens = i % 2 === 0 ? 1 : -1;
    d += ` Q ${n(x + r * sens)} ${n(y - pas * (i - 0.5))} ${n(x)} ${n(y - pas * i)}`;
  }
  return `<path d="${d}" fill="none" stroke="#fff" stroke-width="${n(r * 0.5)}" opacity="${opacite}" stroke-linecap="round" filter="url(#flou-doux)"/>`;
}

/** Motif de zellige, en filigrane sur un mur. */
function zellige(x, y, l, a, opacite = 0.07) {
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const cx = x + i * l;
      const cy = y + j * l;
      out += `<path d="M ${n(cx)} ${n(cy - l * 0.42)} L ${n(cx + l * 0.42)} ${n(cy)} L ${n(cx)} ${n(cy + l * 0.42)} L ${n(cx - l * 0.42)} ${n(cy)} Z"
        fill="none" stroke="${a.accent}" stroke-width="${n(l * 0.045)}" opacity="${opacite}"/>`;
      out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(l * 0.14)}" fill="${a.accent}" opacity="${opacite * 0.8}"/>`;
    }
  }
  return out;
}

// =====================================================================
//  Scènes
// =====================================================================

/**
 * Assemble un visuel complet.
 *
 * L'ordre de dessin EST la profondeur : fond, flou, décor, objets
 * lointains, objets proches, vignettage, grain. Chaque couche ajoutée
 * par-dessus paraît plus près de l'œil.
 */
function scene(nom, L, H, ambiance, composer) {
  const a = AMBIANCES[ambiance];
  const r = alea(graine(nom));
  const petit = Math.min(L, H);

  // Ronds de lumière hors focus — le « bokeh » qui donne l'illusion
  // d'un objectif ouvert.
  let bokeh = '';
  for (let i = 0; i < 7; i += 1) {
    const bx = r() * L;
    const by = r() * H * 0.7;
    const br = petit * (0.04 + r() * 0.09);
    bokeh += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(br)}" fill="${a.lumiere}" opacity="${(0.05 + r() * 0.09).toFixed(3)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Illustration MAISON EVE">
  <defs>
    <linearGradient id="fond" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${a.pres}"/>
      <stop offset="55%" stop-color="${a.loin}"/>
      <stop offset="100%" stop-color="${a.loin}"/>
    </linearGradient>

    <!-- Source de lumière unique, en haut à gauche. Tout le reste en découle. -->
    <radialGradient id="lumiere" cx="26%" cy="16%" r="72%">
      <stop offset="0%" stop-color="${a.lumiere}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${a.lumiere}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${a.lumiere}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffdca6" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffdca6" stop-opacity="0"/>
    </radialGradient>

    <!-- Volume : le côté éclairé et le côté ombré d'un même objet. -->
    <linearGradient id="volume" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="52%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.3"/>
    </linearGradient>

    <radialGradient id="vignette" cx="50%" cy="46%" r="72%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1a120c" stop-opacity="0.6"/>
    </radialGradient>

    <filter id="flou-fond" x="-12%" y="-12%" width="124%" height="124%">
      <feGaussianBlur stdDeviation="${n(petit * 0.028)}"/>
    </filter>
    <filter id="flou-doux" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${n(petit * 0.014)}"/>
    </filter>

    <!-- Grain photographique : bruit désaturé, posé très léger. C'est ce
         qui empêche l'image de se lire comme un aplat vectoriel. -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="bruit"/>
      <feColorMatrix in="bruit" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${L}" height="${H}" fill="url(#fond)"/>

  <!-- Arrière-plan flouté : profondeur de champ -->
  <g filter="url(#flou-fond)">
    ${zellige(L * 0.06, H * 0.08, petit * 0.19, a, 0.09)}
    ${bokeh}
  </g>

  <rect width="${L}" height="${H}" fill="url(#lumiere)"/>

  ${composer(L, H, a, petit, r)}

  <rect width="${L}" height="${H}" fill="url(#vignette)"/>
  <rect width="${L}" height="${H}" filter="url(#grain)" opacity="0.16" style="mix-blend-mode:overlay"/>
</svg>
`;
}

/** Sol / plan de travail sur lequel les objets reposent. */
function plan(L, H, a, y) {
  return `<rect x="0" y="${n(y)}" width="${L}" height="${n(H - y)}" fill="${a.loin}" opacity="0.55"/>
  <rect x="0" y="${n(y)}" width="${L}" height="${n(H * 0.012)}" fill="${a.lumiere}" opacity="0.12"/>`;
}

// --- Compositions ------------------------------------------------------

const COMPOSITIONS = {
  /** Bougies, serviettes et vapeur — l'ambiance générale de la maison. */
  accueilSpa: (L, H, a, p) => `
    ${plan(L, H, a, H * 0.72)}
    ${vapeur(L * 0.78, H * 0.7, H * 0.42, p * 0.05, 0.13)}
    ${vapeur(L * 0.84, H * 0.72, H * 0.3, p * 0.04, 0.09)}
    ${branche(L * 0.14, H * 0.74, H * 0.34, a, -1)}
    ${bougie(L * 0.3, H * 0.72, p * 0.05, p * 0.15, a)}
    ${bougie(L * 0.38, H * 0.72, p * 0.038, p * 0.1, a)}
    ${serviette(L * 0.56, H * 0.65, p * 0.075, a)}
    ${serviette(L * 0.66, H * 0.67, p * 0.06, a, 0.94)}
    ${pierres(L * 0.86, H * 0.71, p * 0.05, a)}
    ${fleur(L * 0.48, H * 0.76, p * 0.035, a, 12)}`,

  /** Cabine : table de soin, lanterne, végétal. */
  cabineSoin: (L, H, a, p) => `
    ${lanterne(L * 0.79, H * 0.12, p * 0.11, p * 0.2, a)}
    ${plan(L, H, a, H * 0.68)}
    <!-- table de massage -->
    <g>
      <ellipse cx="${n(L * 0.5)}" cy="${n(H * 0.79)}" rx="${n(L * 0.4)}" ry="${n(H * 0.035)}" fill="#000" opacity="0.3"/>
      <rect x="${n(L * 0.12)}" y="${n(H * 0.6)}" width="${n(L * 0.76)}" height="${n(H * 0.1)}" rx="${n(H * 0.03)}" fill="${a.lumiere}" opacity="0.92"/>
      <rect x="${n(L * 0.12)}" y="${n(H * 0.6)}" width="${n(L * 0.76)}" height="${n(H * 0.1)}" rx="${n(H * 0.03)}" fill="url(#volume)"/>
      <rect x="${n(L * 0.16)}" y="${n(H * 0.7)}" width="${n(L * 0.03)}" height="${n(H * 0.12)}" fill="${a.objet}" opacity="0.8"/>
      <rect x="${n(L * 0.81)}" y="${n(H * 0.7)}" width="${n(L * 0.03)}" height="${n(H * 0.12)}" fill="${a.objet}" opacity="0.8"/>
    </g>
    ${serviette(L * 0.3, H * 0.57, p * 0.055, a)}
    ${bougie(L * 0.62, H * 0.6, p * 0.032, p * 0.1, a)}
    ${branche(L * 0.9, H * 0.68, H * 0.26, a, 1)}
    ${fleur(L * 0.7, H * 0.585, p * 0.03, a, 30)}`,

  /** Hammam : vapeur dense, bol, savon noir. */
  hammamVapeur: (L, H, a, p) => `
    ${vapeur(L * 0.2, H * 0.82, H * 0.6, p * 0.07, 0.2)}
    ${vapeur(L * 0.34, H * 0.86, H * 0.48, p * 0.055, 0.15)}
    ${vapeur(L * 0.72, H * 0.84, H * 0.55, p * 0.065, 0.18)}
    ${vapeur(L * 0.86, H * 0.88, H * 0.4, p * 0.05, 0.12)}
    ${plan(L, H, a, H * 0.74)}
    ${bol(L * 0.5, H * 0.72, p * 0.13, a)}
    ${pierres(L * 0.22, H * 0.75, p * 0.055, a)}
    ${serviette(L * 0.78, H * 0.69, p * 0.07, a)}
    ${fleur(L * 0.5, H * 0.7, p * 0.03, a, 0)}
    ${fleur(L * 0.44, H * 0.715, p * 0.024, a, 40)}`,

  /** Table d'huiles — lumineux, presque studio. */
  tableHuiles: (L, H, a, p) => `
    ${plan(L, H, a, H * 0.7)}
    ${flacon(L * 0.32, H * 0.7, p * 0.075, p * 0.26, a)}
    ${flacon(L * 0.46, H * 0.7, p * 0.06, p * 0.2, a)}
    ${bol(L * 0.68, H * 0.68, p * 0.1, a)}
    ${branche(L * 0.86, H * 0.7, H * 0.28, a, 1)}
    ${fleur(L * 0.58, H * 0.73, p * 0.032, a, 18)}
    ${fleur(L * 0.24, H * 0.75, p * 0.026, a, 55)}`,

  /** Salon marocain : théière, lanterne, verres. */
  salonThe: (L, H, a, p) => `
    ${lanterne(L * 0.16, H * 0.1, p * 0.1, p * 0.19, a)}
    ${plan(L, H, a, H * 0.72)}
    ${theiere(L * 0.44, H * 0.66, p * 0.13, a)}
    <g>
      <ellipse cx="${n(L * 0.66)}" cy="${n(H * 0.735)}" rx="${n(p * 0.05)}" ry="${n(p * 0.014)}" fill="#000" opacity="0.3"/>
      <path d="M ${n(L * 0.635)} ${n(H * 0.66)} L ${n(L * 0.645)} ${n(H * 0.73)} L ${n(L * 0.675)} ${n(H * 0.73)} L ${n(L * 0.685)} ${n(H * 0.66)} Z" fill="${a.accent}" opacity="0.55"/>
      <ellipse cx="${n(L * 0.66)}" cy="${n(H * 0.678)}" rx="${n(p * 0.025)}" ry="${n(p * 0.007)}" fill="${a.lumiere}" opacity="0.6"/>
    </g>
    ${bougie(L * 0.78, H * 0.72, p * 0.035, p * 0.1, a)}
    ${branche(L * 0.9, H * 0.72, H * 0.24, a, 1)}`,

  /** Pierres chaudes et pétales — le visuel de réservation. */
  galetsPetales: (L, H, a, p) => `
    ${plan(L, H, a, H * 0.66)}
    ${vapeur(L * 0.68, H * 0.66, H * 0.3, p * 0.045, 0.12)}
    ${pierres(L * 0.42, H * 0.68, p * 0.075, a)}
    ${pierres(L * 0.62, H * 0.7, p * 0.05, a)}
    ${serviette(L * 0.22, H * 0.64, p * 0.07, a)}
    ${fleur(L * 0.53, H * 0.72, p * 0.034, a, 10)}
    ${fleur(L * 0.72, H * 0.74, p * 0.028, a, 65)}
    ${fleur(L * 0.34, H * 0.75, p * 0.024, a, 120)}
    ${branche(L * 0.86, H * 0.68, H * 0.26, a, 1)}`,

  /** Serviettes et fleurs — détail, format portrait. */
  detailServiettes: (L, H, a, p) => `
    ${plan(L, H, a, H * 0.62)}
    ${serviette(L * 0.36, H * 0.55, p * 0.15, a)}
    ${serviette(L * 0.64, H * 0.58, p * 0.12, a, 0.95)}
    ${fleur(L * 0.5, H * 0.68, p * 0.055, a, 22)}
    ${bougie(L * 0.2, H * 0.63, p * 0.05, p * 0.16, a)}
    ${branche(L * 0.84, H * 0.62, H * 0.22, a, 1)}`,
};

// --- Ce qu'il faut produire ---------------------------------------------

const A_PRODUIRE = [
  // --- Bandeaux pleine largeur ---
  ['bandeaux/accueil.svg', 1920, 1080, 'salon', 'accueilSpa'],
  ['bandeaux/domicile.svg', 1920, 900, 'cabine', 'cabineSoin'],
  ['bandeaux/relaxation.svg', 1920, 900, 'cabine', 'galetsPetales'],
  ['bandeaux/reservation.svg', 1920, 1000, 'salon', 'galetsPetales'],
  ['bandeaux/institut.svg', 1600, 1100, 'cabine', 'cabineSoin'],
  ['bandeaux/equipe.svg', 1400, 1000, 'huiles', 'tableHuiles'],
  ['bandeaux/faq.svg', 900, 1100, 'cabine', 'detailServiettes'],
  ['bandeaux/contact.svg', 1600, 900, 'salon', 'salonThe'],

  // --- Soins ---
  ['soins/massage-traditionnel.svg', 800, 600, 'cabine', 'cabineSoin'],
  ['soins/massage-argan.svg', 800, 600, 'huiles', 'tableHuiles'],
  ['soins/pierres-chaudes.svg', 800, 600, 'cabine', 'galetsPetales'],
  ['soins/massage-prenatal.svg', 800, 600, 'cabine', 'detailServiettes'],
  ['soins/hammam-savon-noir.svg', 800, 600, 'hammam', 'hammamVapeur'],
  ['soins/rituel-ghassoul.svg', 800, 600, 'hammam', 'hammamVapeur'],
  ['soins/soin-visage-rose.svg', 800, 600, 'huiles', 'tableHuiles'],
  ['soins/soin-visage-eclat.svg', 800, 600, 'huiles', 'detailServiettes'],
  ['soins/rituel-maison-eve.svg', 800, 600, 'salon', 'salonThe'],
  ['soins/rituel-duo.svg', 800, 600, 'cabine', 'cabineSoin'],
  ['soins/defaut.svg', 800, 600, 'cabine', 'detailServiettes'],

  // --- Journal ---
  ['journal/hammam.svg', 1200, 675, 'hammam', 'hammamVapeur'],
  ['journal/argan.svg', 1200, 675, 'huiles', 'tableHuiles'],
  ['journal/domicile.svg', 1200, 675, 'cabine', 'cabineSoin'],
  ['journal/hiver.svg', 1200, 675, 'salon', 'salonThe'],
  ['journal/defaut.svg', 1200, 675, 'cabine', 'detailServiettes'],

  // --- Galerie ---
  ['galerie/salle-soin.svg', 700, 950, 'cabine', 'cabineSoin'],
  ['galerie/huiles.svg', 800, 800, 'huiles', 'tableHuiles'],
  ['galerie/hammam.svg', 1100, 720, 'hammam', 'hammamVapeur'],
  ['galerie/savon-noir.svg', 800, 800, 'hammam', 'hammamVapeur'],
  ['galerie/the.svg', 700, 950, 'salon', 'salonThe'],
  ['galerie/serviettes.svg', 800, 800, 'cabine', 'detailServiettes'],
  ['galerie/ghassoul.svg', 1100, 720, 'hammam', 'galetsPetales'],
  ['galerie/accueil.svg', 700, 950, 'salon', 'salonThe'],
];

let compte = 0;
for (const [chemin, L, H, ambiance, composition] of A_PRODUIRE) {
  const cible = join(PUBLIC, chemin);
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, scene(chemin, L, H, ambiance, COMPOSITIONS[composition]), 'utf8');
  compte += 1;
}

console.log(`${compte} illustrations generees dans public/.`);
console.log('');
console.log('RAPPEL : ce sont des ILLUSTRATIONS, pas des photographies.');
console.log('A remplacer par de vraies photos de l institut avant mise en ligne.');
console.log('Voir PROGRESS.md section 11.');
