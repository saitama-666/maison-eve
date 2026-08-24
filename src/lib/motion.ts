import type { Transition } from 'framer-motion';

// =====================================================================
//  MAISON EVE — vocabulaire d'animation.
//
//  ⚠️  CE FICHIER A ETE VIDE DE L'ESSENTIEL DE SON CONTENU, VOLONTAIREMENT.
//
//  Il exportait dix-neuf helpers Framer, dont des variantes toutes prêtes
//  du genre :
//
//      monteeFondu = { cache: { opacity: 0, y: 26 }, vu: { opacity: 1 } }
//
//  C'est exactement le motif qui a casse le site deux fois : du contenu
//  qui part invisible et compte sur une boucle JavaScript pour le
//  redevenir. Les laisser ici, dans le fichier presente comme la « source
//  unique du mouvement », revenait a poser le piege bien en evidence pour
//  la prochaine personne — ou le prochain moi — qui viendrait chercher un
//  helper d'entree.
//
//  Le mouvement du site est en CSS, dans `globals.css`. Voir PROGRESS.md
//  section 4 pour la regle et les classes disponibles (`.arrivee`,
//  `.surgir`, `.tiroir`, `.volet-liens`, `.glisser`, `.erreur-champ`…).
//
//  IL NE RESTE ICI QUE CE QUI EST REELLEMENT CONSOMME.
// =====================================================================

// --- Courbes ------------------------------------------------------------
//
// Ces trois valeurs sont dupliquees dans `globals.css` sous forme de
// variables (`--ease-out-expo`, `--ease-out-back`, `--ease-in-out-quint`).
// La duplication est assumee : le CSS ne peut pas lire un module TypeScript.
// Si l'une change ici, changer l'autre la-bas.

/** Demarre vite, se pose doucement. C'est elle qui donne le « snappy ». */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** Leger depassement — reserve aux apparitions ponctuelles (coche, badge). */
export const EASE_OUT_BACK = [0.34, 1.4, 0.64, 1] as const;
/** Symetrique et franche — pour ce qui va et vient (tiroirs, volets). */
export const EASE_IN_OUT_QUINT = [0.83, 0, 0.17, 1] as const;

// --- Durees, en millisecondes -------------------------------------------

export const DUREE = {
  /** Survol, clic, focus. Au-dela de ~150 ms l'interface parait molle. */
  reponse: 140,
  /** Ce qui explique un changement d'etat : panneau, onglet, tiroir. */
  continuite: 260,
  /** Apparition au defilement. */
  revelation: 520,
  /** Entree du bandeau de titre. Une par page. */
  arrivee: 620,
  lente: 800,
} as const;

// --- Ressort ------------------------------------------------------------

/**
 * Ressort de continuite — pour ce qui se DEPLACE d'un etat a l'autre.
 * Raide et amorti : il arrive vite et ne rebondit pas mollement.
 *
 * Seul export Framer encore utilise, et par un seul fichier :
 * `CatalogueSoins.tsx`, ou il anime la DISPOSITION (`layout`, `layoutId`)
 * — les cartes glissent a leur nouvelle place quand on filtre, et la
 * pastille du filtre suit l'onglet actif.
 *
 * C'est le seul usage de Framer qu'on garde dans la vitrine, parce qu'il
 * ne masque rien : si l'animation ne se joue pas, les cartes sont deja a
 * leur place et la pastille sur le bon onglet. Rien n'est perdu qu'un
 * glissement.
 */
export const ressort: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 38,
  mass: 0.7,
};
