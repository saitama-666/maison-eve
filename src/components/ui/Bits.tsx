import type { ReactNode } from 'react';

import { Icon, type NomIcone } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Petites pièces réutilisées partout.
//  Rien ici ne dépasse quelques dizaines de lignes ; dès qu'une pièce
//  gagne un état ou une logique, elle sort dans son propre fichier.
// =====================================================================

/**
 * En-tête de section : surtitre, titre, sous-titre.
 *
 * Reprend la composition de la maquette — le petit mot en capitales
 * espacées au-dessus du grand titre serif. Le titre accepte du JSX pour
 * pouvoir mettre un mot en italique.
 */
export function TitreSection({
  surtitre,
  titre,
  texte,
  align = 'centre',
  ton = 'clair',
  className,
}: {
  surtitre?: string;
  titre: ReactNode;
  texte?: string;
  align?: 'centre' | 'gauche';
  ton?: 'clair' | 'sombre';
  className?: string;
}) {
  const sombre = ton === 'sombre';

  return (
    <div
      className={cn(
        'reveler flex flex-col gap-4',
        align === 'centre' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {surtitre && (
        <span className={cn('surtitre', sombre && 'text-champagnesoft')}>{surtitre}</span>
      )}

      <h2
        className={cn(
          'font-display text-[2rem] leading-[1.1] sm:text-[2.75rem] lg:text-[3.25rem]',
          sombre ? 'text-onshell' : 'text-ink',
        )}
      >
        {titre}
      </h2>

      {texte && (
        <p
          className={cn(
            'max-w-xl text-[0.9375rem] leading-relaxed',
            sombre ? 'text-onshellmuted' : 'text-muted',
            align === 'centre' && 'mx-auto',
          )}
        >
          {texte}
        </p>
      )}
    </div>
  );
}

/** Pastille d'information — catégorie, durée, statut. */
export function Badge({
  children,
  icone,
  ton = 'neutre',
  className,
}: {
  children: ReactNode;
  icone?: NomIcone;
  ton?: 'neutre' | 'champagne' | 'sombre' | 'clair';
  className?: string;
}) {
  const TONS = {
    neutre: 'bg-canvas2 text-muted ring-line',
    champagne: 'bg-champagnepale/60 text-champagne ring-champagne/25',
    sombre: 'bg-ink text-oncream ring-transparent',
    /*
       ⚠️  Pastille posee SUR UNE PHOTO. Elle etait en `bg-white/12` avec du
           texte creme : sa lisibilite dependait entierement de la clarte de
           la photo a cet endroit precis. Mesure sur les visuels du site :
           entre 1,49 et 3,07 de contraste — illisible.

           On ne peut pas parier sur des photos qu'on ne controle pas, et
           encore moins sur celles que Hamza deposera plus tard. La pastille
           est donc un aplat quasi opaque avec du texte espresso : entre
           12,2 et 13,7 de contraste quelle que soit l'image dessous. */
    clair: 'bg-card/92 text-ink ring-ink/10 backdrop-blur-sm',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] ring-1 ring-inset',
        TONS[ton],
        className,
      )}
    >
      {icone && <Icon nom={icone} taille={12} />}
      {children}
    </span>
  );
}

/**
 * Note en étoiles.
 *
 * L'étoile pleine est un `<path>` rempli, la vide un contour. On n'utilise
 * PAS un dégradé de couleur sur du texte : à l'impression et en contraste
 * élevé, la moitié des étoiles disparaîtrait.
 *
 * La note est aussi écrite en toutes lettres pour les lecteurs d'écran :
 * cinq icônes ne disent rien à qui ne les voit pas.
 */
export function Etoiles({
  note,
  taille = 14,
  className,
}: {
  note: number;
  taille?: number;
  className?: string;
}) {
  const arrondi = Math.round(note);

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-champagne', className)}>
      <span className="sr-only">{note} étoiles sur 5</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={taille}
          height={taille}
          viewBox="0 0 24 24"
          fill={i <= arrondi ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
          aria-hidden
          className={i <= arrondi ? '' : 'opacity-35'}
        >
          <path d="M12 3.6l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.99l-5.25 2.76 1-5.85L3.5 9.75l5.9-.85z" />
        </svg>
      ))}
    </span>
  );
}

/** Filet de séparation qui se dessine à l'arrivée dans le champ de vision. */
export function Filet({ className }: { className?: string }) {
  // Le filet se dessine au défilement, en CSS (voir `.filet-anime` dans
  // globals.css). Aucun observateur, aucun état React.
  return <div className={cn('filet filet-anime', className)} aria-hidden />;
}

/** Roue d'attente. */
export function Rouet({ taille = 22, className }: { taille?: number; className?: string }) {
  return (
    <span className={cn('inline-flex text-champagne', className)} role="status" aria-label="Chargement">
      <Icon nom="chargement" taille={taille} className="animate-spin" />
    </span>
  );
}

/** Écran d'attente pleine hauteur. */
export function EcranChargement({ message = 'Un instant…' }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Rouet taille={26} />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

/**
 * État vide.
 *
 * Il ne dit pas seulement « rien ici » : il propose l'action qui remplira
 * l'écran. Un état vide sans porte de sortie est un cul-de-sac.
 */
export function EtatVide({
  icone = 'lotus',
  titre,
  texte,
  action,
  className,
}: {
  icone?: NomIcone;
  titre: string;
  texte?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas2 text-champagne">
        <Icon nom={icone} taille={26} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-2xl text-ink">{titre}</h3>
        {texte && <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">{texte}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Squelette de chargement.
 *
 * L'animation est un dégradé qui balaie — pas un clignotement d'opacité,
 * qui fatigue et qui peut gêner les personnes sensibles au scintillement.
 */
export function Squelette({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative block overflow-hidden rounded-md bg-canvas2', className)}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </span>
  );
}

/** Encart d'information ou d'avertissement. */
export function Encart({
  ton = 'info',
  titre,
  children,
  className,
}: {
  ton?: 'info' | 'attention' | 'succes';
  titre?: string;
  children: ReactNode;
  className?: string;
}) {
  const CONFIG = {
    info: { icone: 'info' as NomIcone, classe: 'bg-canvas2 text-inksoft ring-line' },
    attention: { icone: 'alerte' as NomIcone, classe: 'bg-warning/8 text-warning ring-warning/25' },
    succes: { icone: 'check' as NomIcone, classe: 'bg-success/8 text-success ring-success/25' },
  } as const;

  const { icone, classe } = CONFIG[ton];

  return (
    <div className={cn('flex gap-3 rounded-md px-4 py-3.5 text-sm ring-1 ring-inset', classe, className)}>
      <Icon nom={icone} taille={17} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1 leading-relaxed">
        {titre && <strong className="font-sans font-medium">{titre}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

/** Ligne « clé — valeur » des récapitulatifs. */
export function Ligne({
  cle,
  valeur,
  fort,
}: {
  cle: string;
  valeur: ReactNode;
  fort?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-2.5',
        fort ? 'border-t border-line pt-4' : 'border-b border-linesoft last:border-0',
      )}
    >
      <span className={cn('text-sm', fort ? 'font-sans text-ink' : 'text-muted')}>{cle}</span>
      <span
        className={cn(
          'text-right tabular',
          fort ? 'font-display text-2xl text-ink' : 'text-sm text-ink',
        )}
      >
        {valeur}
      </span>
    </div>
  );
}
