import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// =====================================================================
//  Effets de mouvement — TOUS EN CSS, TOUS EN COMPOSANTS SERVEUR.
//
//  ⚠️  Ce fichier a été vidé de son JavaScript après un incident de
//      performance. Ne pas y remettre `useScroll`, `useSpring` ni
//      d'écouteur de défilement.
//
//  Ce qui a été retiré, et pourquoi :
//
//   · `Aimant` — un écouteur `mousemove` et deux valeurs ressort pour
//     qu'un bouton suive le curseur de quelques pixels. Coût permanent,
//     bénéfice invisible sur téléphone (il n'y a pas de survol).
//
//   · `Parallaxe` et `Compteur` — n'étaient utilisés nulle part. Du code
//     mort qui pesait quand même dans le paquet JavaScript.
//
//   · L'ancienne `ProgressionLecture` ouvrait un abonnement au défilement
//     et une valeur ressort. C'est exactement ce que
//     `animation-timeline: scroll()` fait gratuitement, sur le
//     compositeur.
//
//  Règle qui vaut pour tout le fichier : une propriété CSS qui masque
//  (`opacity: 0`, `clip-path`) n'apparaît QUE dans un bloc `@supports`
//  garantissant que l'animation se jouera. Sans prise en charge, on perd
//  l'effet — jamais le contenu.
// =====================================================================

/**
 * Bandeau défilant.
 *
 * Le contenu est dupliqué DEUX fois et la piste translate de -50 % : au
 * moment où la première copie sort, la seconde est exactement à sa place,
 * donc la boucle est invisible.
 *
 * `aria-hidden` sur la copie — sans quoi un lecteur d'écran lit deux fois
 * la même liste de mots.
 */
export function Bandeau({
  children,
  vitesse = 42,
  inverse = false,
  className,
}: {
  children: ReactNode;
  /** Durée d'un cycle complet, en secondes. Plus grand = plus lent. */
  vitesse?: number;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('fondu-bords relative flex overflow-hidden', className)}>
      <div
        className="flex shrink-0 items-center gap-12 pr-12 motion-reduce:animate-none"
        style={{
          animation: `${inverse ? 'marquee-reverse' : 'marquee'} ${vitesse}s linear infinite`,
        }}
      >
        <div className="flex shrink-0 items-center gap-12 pr-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12 pr-12" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Texte qui arrive mot par mot au défilement.
 *
 * Découpé par MOTS, jamais par lettres : une découpe par lettres met
 * chaque caractère dans son propre `<span>`, ce qui hache la sélection,
 * casse le copier-coller et fait épeler les lecteurs d'écran. Le gain
 * visuel ne vaut pas ça.
 *
 * Le texte complet reste dans le flux, lisible ; ce sont les mots qui
 * portent l'animation, et seulement là où le navigateur sait la jouer.
 */
export function TexteAnime({
  texte,
  className,
  as: Composant = 'span',
}: {
  texte: string;
  className?: string;
  /** Conservés pour les appels existants — sans effet, voir `Reveal`. */
  delai?: number;
  intervalle?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const mots = texte.split(' ');

  return (
    <Composant className={cn('mots-animes inline-block', className)}>
      {mots.map((mot, i) => (
        // Le conteneur en `overflow-hidden` fait que le mot monte DEPUIS
        // SOUS la ligne, au lieu d'apparaître en fondu sur place.
        <span key={`${mot}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span className="mot inline-block">
            {mot}
            {i < mots.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </Composant>
  );
}

/**
 * Barre de progression de lecture — réservée aux articles du journal.
 *
 * Sur une page courte elle ne dit rien d'utile ; sur un article de cinq
 * minutes, elle répond à « il m'en reste combien ? ». D'où l'usage limité.
 *
 * Entièrement CSS : `animation-timeline: scroll()` suit le défilement du
 * document sans une ligne de JavaScript.
 */
export function ProgressionLecture() {
  return (
    <div
      aria-hidden
      className="progression-lecture fixed inset-x-0 top-0 z-[120] h-[2px] origin-left bg-champagne"
    />
  );
}
