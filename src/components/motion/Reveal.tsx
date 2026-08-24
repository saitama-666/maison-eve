import type { ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

// =====================================================================
//  Révélation au défilement — SANS JAVASCRIPT.
//
//  ⚠️  CE FICHIER A ÉTÉ RÉÉCRIT APRÈS UN INCIDENT. Ne pas le ramener à
//      Framer Motion.
//
//  Version précédente : `motion.div` + `whileInView`. Framer écrivait
//  alors `style="opacity:0"` directement dans le HTML rendu par le
//  serveur, et n'enlevait ce voile qu'une fois la librairie démarrée et
//  l'IntersectionObserver posé. Mesuré sur ce site : **59 éléments
//  invisibles au premier affichage de la page d'accueil, en-tête
//  compris**. Sur une machine ordinaire en développement, ou sur une
//  connexion moyenne en production, on cliquait un lien, on arrivait sur
//  une page blanche sans navigation, et on concluait que le site était
//  cassé.
//
//  Ces composants ne posent plus qu'une CLASSE. Toute l'animation est
//  dans `globals.css`, jouée par le navigateur via
//  `animation-timeline: view()` — sur le fil de composition, sans
//  observateur, sans ré-rendu React.
//
//  Conséquences, toutes voulues :
//   · Ce sont des composants SERVEUR. Aucun JavaScript n'est envoyé pour
//     eux. Le `'use client'` a disparu.
//   · Le contenu est dans le HTML, VISIBLE, dès le premier octet.
//   · Si le navigateur ne sait pas animer sur le défilement, il n'y a
//     tout simplement pas d'animation. Jamais de contenu caché.
// =====================================================================

const SENS = {
  montee: '',
  fondu: '',
  zoom: 'reveler-zoom',
  gauche: 'reveler-gauche',
  droite: 'reveler-droite',
  rideau: 'reveler-rideau',
} as const;

type Sens = keyof typeof SENS;

type Props = {
  children: ReactNode;
  sens?: Sens;
  /**
   * Conservé pour ne pas casser les appels existants, mais SANS EFFET.
   *
   * Le décalage se fait désormais par la position dans le défilement,
   * pas par une minuterie : un retard en secondes n'a plus de sens quand
   * l'animation suit le scroll. Pour décaler des éléments frères, il
   * suffit de les mettre dans un `<RevealGroup>`.
   */
  delai?: number;
  className?: string;
  as?: ElementType;
};

export function Reveal({ children, sens = 'montee', className, as: Composant = 'div' }: Props) {
  const estRideau = sens === 'rideau';

  return (
    <Composant
      className={cn(estRideau ? 'reveler-rideau overflow-hidden' : 'reveler', SENS[sens], className)}
    >
      {children}
    </Composant>
  );
}

/**
 * Conteneur de cascade.
 *
 * Les enfants directs se dévoilent l'un après l'autre. Le décalage est
 * porté par `globals.css` (`.reveler-groupe > *:nth-child(…)`) et lié au
 * DÉFILEMENT, pas à une horloge : il reste donc juste quelle que soit la
 * vitesse à laquelle on descend la page.
 */
export function RevealGroup({
  children,
  className,
  as: Composant = 'div',
}: {
  children: ReactNode;
  /** Sans effet — voir `Reveal.delai`. Conservé pour les appels existants. */
  intervalle?: number;
  attente?: number;
  className?: string;
  as?: ElementType;
}) {
  return <Composant className={cn('reveler-groupe', className)}>{children}</Composant>;
}

/**
 * Enfant d'un `<RevealGroup>`.
 *
 * Il ne porte aucune classe d'animation : c'est le parent qui cible ses
 * enfants directs. Il reste utile pour la mise en page (`h-full`, `li`…)
 * et pour que l'intention soit lisible dans le code.
 */
export function RevealItem({
  children,
  className,
  as: Composant = 'div',
}: {
  children: ReactNode;
  sens?: Sens;
  className?: string;
  as?: ElementType;
}) {
  return <Composant className={className}>{children}</Composant>;
}

/**
 * Visuel qui se dévoile derrière un rideau montant.
 *
 * Le contre-zoom de l'image a été retiré : il demandait un second
 * élément animé par-dessus le premier, pour un effet que personne ne
 * remarque, et il doublait le coût de composition sur chaque visuel de
 * la page.
 */
export function RevealVisuel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** Sans effet — conservé pour les appels existants. */
  duree?: number;
}) {
  return <div className={cn('reveler-rideau overflow-hidden', className)}>{children}</div>;
}
