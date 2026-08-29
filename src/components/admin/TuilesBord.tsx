'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Les tuiles de tête du tableau de bord.
//
//  Structure reprise de la maquette : un titre et une flèche au-dessus,
//  puis un encadré teinté qui porte le CONTEXTE en petit et le CHIFFRE
//  en grand.
//
//  L'encadré n'est pas décoratif. Un chiffre seul ne dit rien : « 3 »
//  ne devient utile qu'accompagné de « prochain à 14h, avec Riya ».
//  La ligne de contexte est donc au-dessus du chiffre, là où l'œil passe
//  en premier, et c'est elle qui décide si on clique.
//
//  ⚠️  MOBILE D'ABORD. Les quatre tuiles s'empilent en une colonne sous
//      `sm`, deux à partir de `sm`, quatre à partir de `xl`. On ne passe
//      PAS à quatre dès `lg` : à 1024 px, quatre tuiles font 230 px de
//      large et le montant en dirhams passe à la ligne au milieu.
// =====================================================================

export function GrilleTuiles({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">{children}</div>;
}

export function TuileBord({
  titre,
  href,
  libelleLien,
  contexte,
  children,
}: {
  titre: string;
  href: string;
  /** Nom accessible de la flèche : « Voir » seul ne dit pas où l'on va. */
  libelleLien: string;
  /** La ligne de contexte, au-dessus du chiffre. */
  contexte?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="carte flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[0.9375rem] font-medium leading-snug text-ink">{titre}</h2>
        <Link
          href={href}
          aria-label={libelleLien}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-champagne ring-1 ring-inset ring-champagne/35 transition-colors duration-[140ms] hover:bg-champagnepale"
        >
          <Icon nom="fleche-droite" taille={15} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-xl bg-canvas2 p-3.5 sm:p-4">
        {contexte !== undefined && (
          <p className="min-h-[1.25rem] text-[0.8125rem] leading-snug text-muted">
            {contexte ?? <span className="text-faint">—</span>}
          </p>
        )}
        <div className="mt-auto">{children}</div>
      </div>
    </section>
  );
}

/** Le chiffre en grand, avec sa légende dessous. */
export function ChiffreTuile({
  valeur,
  legende,
  puce,
}: {
  valeur: string | number;
  legende: string;
  puce?: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-2">
        {/*
          ⚠️  `font-sans`, PAS `font-display`. Cormorant Garamond dessine
              des chiffres ELZÉVIRIENS : le 1 y ressemble à un I capitale,
              et « 124 » se lit « I 24 ». Superbe dans un titre, illisible
              sur un chiffre qu'on consulte d'un coup d'œil.
              `tabular` en plus, pour que les colonnes de la grille
              s'alignent quand les valeurs changent.
        */}
        <span className="font-sans text-[2rem] font-medium leading-none text-ink tabular sm:text-[2.25rem]">
          {valeur}
        </span>
        {puce}
      </div>
      <p className="mt-1.5 text-[0.8125rem] text-muted">{legende}</p>
    </>
  );
}

/**
 * Pastille de variation. Verte à la hausse, rouge à la baisse.
 *
 * ⚠️  Le texte prend `dangertexte` / `successtexte`, PAS `danger` /
 *     `success`. Écrire la couleur de base sur son propre aplat à 12 %
 *     donne 3,96 de contraste — sous le seuil. Voir la note dans
 *     `globals.css`.
 *
 *     Le signe `+` / `−` porte l'information autant que la couleur :
 *     une pastille lue en niveaux de gris reste compréhensible.
 */
export function PuceVariation({ variation }: { variation: number }) {
  const hausse = variation >= 0;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium tabular',
        hausse ? 'bg-success/14 text-successtexte' : 'bg-danger/12 text-dangertexte',
      )}
    >
      {hausse ? '+' : '−'}
      {Math.abs(variation)} %
    </span>
  );
}

// ---------------------------------------------------------------------
//  Courbe minuscule, pour la tuile du chiffre d'affaires.
//
//  Pas de librairie : un `<path>` suffit. Elle n'a ni axe ni valeur —
//  elle donne une FORME, pas une mesure. La mesure est le montant écrit
//  juste à côté.
//
//  `aria-hidden` : un lecteur d'écran n'a rien à tirer d'une silhouette.
//  Il lit le montant et la variation, qui disent la même chose en mieux.
// ---------------------------------------------------------------------
export function CourbeMinuscule({
  valeurs,
  hausse,
  className,
}: {
  valeurs: readonly number[];
  hausse: boolean;
  className?: string;
}) {
  // Moins de deux points ne fait pas une ligne.
  if (valeurs.length < 2) return null;

  const L = 100;
  const H = 32;
  const max = Math.max(...valeurs, 1);
  const min = Math.min(...valeurs, 0);
  const amplitude = max - min || 1;

  const points = valeurs.map((v, i) => {
    const x = (i / (valeurs.length - 1)) * L;
    const y = H - ((v - min) / amplitude) * H;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={cn('h-8 w-full', className)}
    >
      <path
        d={`M${points.join(' L')}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={hausse ? 'text-success' : 'text-danger'}
      />
    </svg>
  );
}
