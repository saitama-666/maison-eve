import { cn } from '@/lib/utils';

// =====================================================================
//  Logo.
//
//  Deux étages, comme sur la maquette : le nom en script au-dessus, la
//  spécialité en petites capitales très espacées en dessous, séparés par
//  un filet. La marque de lotus est optionnelle.
//
//  Le logo est du TEXTE, pas une image : il reste net à toutes les
//  tailles, il se colore par `currentColor`, il pèse zéro octet de plus,
//  et il est sélectionnable et lisible par les lecteurs d'écran.
// =====================================================================

type Props = {
  /** `sombre` = posé sur une photo ou sur le moka. `clair` = sur le crème. */
  ton?: 'clair' | 'sombre';
  taille?: 'sm' | 'md' | 'lg' | 'xl';
  marque?: boolean;
  className?: string;
};

// Le sous-titre descendait à 8 px (`text-[0.5rem]`) : illisible sur un
// téléphone, et sous le plancher de lisibilité de 12 px pour du texte en
// capitales espacées. Les paliers repartent de 10 px minimum, et
// l'interlettrage se resserre en dessous de `lg` pour tenir sur la ligne.
const TAILLES = {
  sm: { nom: 'text-2xl', sous: 'text-[0.625rem]', mark: 18, filet: 'w-4' },
  md: { nom: 'text-[1.75rem] sm:text-3xl', sous: 'text-[0.625rem]', mark: 20, filet: 'w-5' },
  lg: { nom: 'text-4xl sm:text-5xl', sous: 'text-[0.6875rem]', mark: 28, filet: 'w-8' },
  xl: { nom: 'text-[3.25rem] sm:text-6xl lg:text-7xl', sous: 'text-[0.6875rem] sm:text-xs', mark: 34, filet: 'w-10 sm:w-12' },
} as const;

export function Logo({ ton = 'clair', taille = 'md', marque = true, className }: Props) {
  const t = TAILLES[taille];
  const sombre = ton === 'sombre';

  return (
    <span
      className={cn(
        'inline-flex flex-col items-center leading-none',
        sombre ? 'text-onshell' : 'text-ink',
        className,
      )}
    >
      {marque && <LotusMark taille={t.mark} className={sombre ? 'text-champagnesoft' : 'text-champagne'} />}

      <span className={cn('script', t.nom, marque && 'mt-1')}>Maison Zahra</span>

      {/*
        Séparateur pour les lecteurs d'écran UNIQUEMENT.

        Les deux lignes du logo sont deux éléments distincts, sans espace
        entre eux dans le texte. Le nom accessible sortait donc collé :
        « Maison ZahraBeauty & Spa ». Sur l'accueil, c'est le <h1> de la
        page — la première chose annoncée.

        `sr-only` est en positionnement absolu : rien ne bouge à l'écran.
      */}
      <span className="sr-only"> — </span>

      <span className="mt-1 flex items-center gap-2">
        <span
          aria-hidden
          className={cn('h-px', t.filet, sombre ? 'bg-champagnesoft/60' : 'bg-champagne/50')}
        />
        <span
          className={cn(
            'font-sans uppercase tracking-[0.24em] whitespace-nowrap sm:tracking-[0.42em]',
            t.sous,
            sombre ? 'text-onshell' : 'text-muted',
          )}
        >
          Beauty&nbsp;&amp;&nbsp;Spa
        </span>
        <span
          aria-hidden
          className={cn('h-px', t.filet, sombre ? 'bg-champagnesoft/60' : 'bg-champagne/50')}
        />
      </span>
    </span>
  );
}

/** Petite fleur de lotus stylisée — la marque seule, sans le nom. */
export function LotusMark({ taille = 24, className }: { taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* pétale central */}
      <path d="M16 6c2.6 2.3 3.9 5 3.9 8.1 0 3.1-1.3 5.8-3.9 8.1-2.6-2.3-3.9-5-3.9-8.1C12.1 11 13.4 8.3 16 6z" />
      {/* pétales latéraux */}
      <path d="M16 22.2c-3.5 2.1-7.1 1.8-10.8-.9 1.4-3.5 4-5.4 7.6-5.7" />
      <path d="M16 22.2c3.5 2.1 7.1 1.8 10.8-.9-1.4-3.5-4-5.4-7.6-5.7" />
      {/* base */}
      <path d="M9.5 25.4h13" opacity="0.55" />
    </svg>
  );
}

/** Version sur une seule ligne — barre de compte, back-office, e-mails. */
export function LogoLigne({ ton = 'clair', className }: { ton?: 'clair' | 'sombre'; className?: string }) {
  const sombre = ton === 'sombre';
  return (
    <span className={cn('inline-flex items-baseline gap-2', sombre ? 'text-onshell' : 'text-ink', className)}>
      <span className="script text-2xl">Maison Zahra</span>
      <span
        className={cn(
          'font-sans text-[0.625rem] uppercase tracking-[0.2em] sm:tracking-[0.34em]',
          sombre ? 'text-onshell' : 'text-muted',
        )}
      >
        Beauty&nbsp;&amp;&nbsp;Spa
      </span>
    </span>
  );
}
