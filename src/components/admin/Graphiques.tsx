'use client';

import { useId } from 'react';

import { cn, dateCourte } from '@/lib/utils';

// =====================================================================
//  Graphiques faits main, en SVG.
//
//  Aucune librairie. Une bibliothèque de graphiques pèse 100 à 200 Ko
//  pour tracer deux courbes, impose son propre système de couleurs, et
//  résiste au thème sombre. Ici tout est en `currentColor` et en
//  variables CSS : les graphiques suivent la bascule clair/sombre sans
//  une ligne de code de plus.
//
//  ⚠️  `fill` et `stroke` ne sont PAS animés au changement de thème.
//      Sur l'autre projet, animer les couleurs de 1 186 nœuds SVG à
//      chaque image faisait chuter la bascule à ~400 ms. Le thème change
//      instantanément ; seules les entrées de données sont animées.
// =====================================================================

type Point = { jour: string; nombre: number; montant: number };

/**
 * Courbe des rendez-vous sur 30 jours.
 *
 * AUCUNE animation d'entree : la courbe est peinte telle quelle. Voir la
 * note en gras dans le corps du composant — sur un tableau de bord, une
 * animation qui ne se joue pas coute la donnee, pas un effet.
 */
export function CourbeReservations({ serie }: { serie: readonly Point[] }) {
  const id = useId();

  if (serie.length === 0) {
    return <ZoneVide message="Pas encore de données à afficher." />;
  }

  const L = 720;
  const H = 220;
  const marge = { haut: 16, bas: 28, gauche: 8, droite: 8 };

  const max = Math.max(...serie.map((p) => p.nombre), 1);
  const largeurUtile = L - marge.gauche - marge.droite;
  const hauteurUtile = H - marge.haut - marge.bas;

  const points = serie.map((p, i) => ({
    x: marge.gauche + (i / Math.max(serie.length - 1, 1)) * largeurUtile,
    y: marge.haut + hauteurUtile - (p.nombre / max) * hauteurUtile,
    donnee: p,
  }));

  const trace = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const aire = `${trace} L ${points[points.length - 1].x.toFixed(1)} ${marge.haut + hauteurUtile} L ${points[0].x.toFixed(1)} ${marge.haut + hauteurUtile} Z`;

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="h-auto w-full text-champagne"
        role="img"
        aria-label={`Rendez-vous des 30 derniers jours. Maximum : ${max} le même jour.`}
      >
        <defs>
          <linearGradient id={`aire-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de repère — quatre suffisent. Au-delà, la grille prend
            le pas sur la donnée. */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={marge.gauche}
            x2={L - marge.droite}
            y1={marge.haut + hauteurUtile * f}
            y2={marge.haut + hauteurUtile * f}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        ))}

        {/*
          ⚠️  LA COURBE ET SON AIRE SONT PEINTES TELLES QUELLES.
              NE PAS LEUR REMETTRE D'ANIMATION D'ENTREE.

              Elles partaient de `opacity: 0` et `pathLength: 0` sous Framer.
              Framer avance depuis `requestAnimationFrame` : quand rAF ne
              tourne pas, le graphique reste VIDE.

              Sur une vitrine, une animation qui ne se joue pas coute un
              effet. Sur un tableau de bord, elle coute la DONNEE — et une
              donnee absente se lit comme un zero. C'est pire qu'un defaut
              d'affichage : c'est une information fausse.

              Le mouvement, ici, ne sert aucun des quatre roles definis dans
              `motion.ts`. On l'a simplement retire.
        */}
        <path d={aire} fill={`url(#aire-${id})`} />

        <path
          d={trace}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Un point sur les jours qui ont eu au moins un rendez-vous.
            Marquer les zéros noierait le signal. */}
        {points.map((p) =>
          p.donnee.nombre > 0 ? (
            <circle
              key={p.donnee.jour}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="var(--color-card)"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <title>
                {dateCourte(p.donnee.jour)} — {p.donnee.nombre} rendez-vous
              </title>
            </circle>
          ) : null,
        )}

        {/* Dates aux extrémités seulement : trente étiquettes se
            chevaucheraient et deviendraient illisibles. */}
        <text x={marge.gauche} y={H - 8} fill="var(--color-faint)" fontSize="11">
          {dateCourte(serie[0].jour)}
        </text>
        <text
          x={L - marge.droite}
          y={H - 8}
          textAnchor="end"
          fill="var(--color-faint)"
          fontSize="11"
        >
          {dateCourte(serie[serie.length - 1].jour)}
        </text>
      </svg>

      <figcaption className="text-xs text-faint">
        Rendez-vous par jour, sur les 30 derniers jours.
      </figcaption>
    </figure>
  );
}

/** Barres horizontales — classement des soins. */
export function BarresSoins({
  donnees,
}: {
  donnees: readonly { nom: string; nombre: number }[];
}) {
  if (donnees.length === 0) {
    return <ZoneVide message="Aucun soin réservé pour le moment." />;
  }

  const max = Math.max(...donnees.map((d) => d.nombre), 1);

  return (
    <ul className="flex flex-col gap-3.5">
      {donnees.map((d) => (
        <li key={d.nom} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-sm text-ink">{d.nom}</span>
            <span className="shrink-0 text-sm text-muted tabular">{d.nombre}</span>
          </div>

          {/* La longueur de la barre est posee en style inline et
              TRANSITIONNEE, pas animee depuis zero : au premier rendu elle
              est deja juste, et elle glisse seulement quand la donnee
              change. Une barre bloquee a zero se lirait comme un zero. */}
          <div className="h-2 overflow-hidden rounded-full bg-canvas2">
            <div
              className="h-full origin-left rounded-full bg-champagne transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{ transform: `scaleX(${d.nombre / max})` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Anneau de répartition institut / domicile.
 *
 * Deux segments seulement : au-delà, un anneau devient impossible à lire
 * et une liste de barres fait mieux le travail.
 */
export function AnneauLieu({
  institut,
  domicile,
}: {
  institut: number;
  domicile: number;
}) {
  const total = institut + domicile;

  if (total === 0) {
    return <ZoneVide message="Aucune donnée." />;
  }

  const rayon = 54;
  const circonference = 2 * Math.PI * rayon;
  const partDomicile = domicile / total;

  return (
    <div className="flex items-center gap-6">
      <svg
        viewBox="0 0 140 140"
        className="h-32 w-32 shrink-0 -rotate-90"
        role="img"
        aria-label={`${Math.round(partDomicile * 100)} % des rendez-vous à domicile, ${Math.round((1 - partDomicile) * 100)} % en institut.`}
      >
        <circle
          cx="70"
          cy="70"
          r={rayon}
          fill="none"
          stroke="var(--color-canvas2)"
          strokeWidth="16"
        />
        {/* Meme principe que les barres : la part est posee directement et
            transitionnee. Un anneau bloque a `circonference` afficherait
            0 % a domicile — une valeur fausse, pas une absence d'effet. */}
        <circle
          cx="70"
          cy="70"
          r={rayon}
          fill="none"
          stroke="var(--color-champagne)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - partDomicile)}
          className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        />
      </svg>

      <dl className="flex flex-col gap-3">
        <Legende
          couleur="bg-champagne"
          label="À domicile"
          valeur={domicile}
          part={partDomicile}
        />
        <Legende
          couleur="bg-canvas2 ring-1 ring-inset ring-line"
          label="En institut"
          valeur={institut}
          part={1 - partDomicile}
        />
      </dl>
    </div>
  );
}

function Legende({
  couleur,
  label,
  valeur,
  part,
}: {
  couleur: string;
  label: string;
  valeur: number;
  part: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className={cn('h-3 w-3 shrink-0 rounded-full', couleur)} />
      <div className="flex flex-col">
        <dt className="text-sm text-ink">{label}</dt>
        <dd className="text-xs text-muted tabular">
          {valeur} · {Math.round(part * 100)} %
        </dd>
      </div>
    </div>
  );
}

// =====================================================================
//  `Tuile` et `TuileMontant` ONT ÉTÉ RETIRÉES.
//
//  Elles portaient les chiffres clés du tableau de bord : un libellé en
//  capitales, un nombre, une note. Deux raisons de les remplacer par
//  `TuilesBord.tsx` :
//
//   · le nombre était en `font-display`. Cormorant Garamond dessine des
//     chiffres elzéviriens — « 124 » s'y lit « I 24 ». Sur un titre c'est
//     élégant, sur un chiffre qu'on consulte d'un coup d'œil c'est une
//     faute de lecture ;
//   · un chiffre seul ne dit rien. « 3 » ne devient utile qu'avec
//     « prochain à 14 h, avec Salma ». La nouvelle tuile réserve une
//     place à ce contexte, au-dessus du nombre.
//
//  Ne pas les réintroduire : ce fichier ne garde que les graphiques.
// =====================================================================

function ZoneVide({ message }: { message: string }) {
  return (
    <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-line px-4 text-center text-sm text-faint">
      {message}
    </div>
  );
}
