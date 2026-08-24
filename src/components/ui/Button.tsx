import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Bouton.
//
//  Un seul composant pour les boutons ET les liens qui en ont l'air :
//  passer `href` produit un `<Link>`, sinon un `<button>`. Sans ça, on
//  finit avec deux jeux de styles qui divergent.
//
//  ⚠️  COMPOSANT SERVEUR — ne pas y remettre Framer Motion.
//
//      Il portait `whileHover` / `whileTap`, ce qui le rendait client. Or
//      il est présent sur *toutes* les pages, souvent dix fois : il tirait
//      donc la librairie d'animation dans chaque paquet, et posait des
//      écouteurs de pointeur sur chaque instance — pour un déplacement de
//      deux pixels que le CSS fait gratuitement, sur le compositeur.
//
//  Le mouvement suit le rôle « RÉPONSE » : 140 ms, jamais plus. Au survol
//  le bouton se soulève ; au clic il revient à plat. C'est court exprès —
//  un bouton qui met 300 ms à réagir paraît cassé.
//
//  Accessibilité : l'état `chargement` pose `aria-busy` et désactive le
//  bouton, ce qui évite le double envoi d'un formulaire.
//
//  ⚠️  NE PAS passer `hidden` / `sm:block` via `className` pour masquer un
//      bouton selon la taille d'écran. La classe de base contient déjà
//      `inline-flex`, et deux utilitaires `display` dans la même couche se
//      départagent par l'ordre de la feuille de style, pas par l'ordre des
//      classes — le résultat n'est donc pas fiable. Il faut envelopper le
//      bouton :  <span className="hidden sm:block"><Button …/></span>
// =====================================================================

type Variante = 'principal' | 'secondaire' | 'fantome' | 'clair' | 'danger';
type Taille = 'sm' | 'md' | 'lg';

type Commun = {
  variante?: Variante;
  taille?: Taille;
  children: ReactNode;
  className?: string;
  /** Flèche qui glisse au survol. */
  fleche?: boolean;
  chargement?: boolean;
  pleineLargeur?: boolean;
};

type PropsBouton = Commun &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: undefined;
  };

type PropsLien = Commun & {
  href: string;
  /** Ouvre dans un nouvel onglet — ajoute automatiquement rel="noreferrer". */
  externe?: boolean;
  onClick?: () => void;
};

type Props = PropsBouton | PropsLien;

const VARIANTES: Record<Variante, string> = {
  // Aplat espresso, texte crème. L'action principale de la page.
  principal: 'bg-ink text-oncream hover:bg-inksoft shadow-soft hover:shadow-lift',
  // Contour — l'action secondaire, sur fond crème.
  secondaire:
    'bg-transparent text-ink ring-1 ring-inset ring-line hover:ring-champagne hover:bg-canvas2',
  // Sans fond ni contour — les actions tertiaires.
  fantome: 'bg-transparent text-ink hover:bg-canvas2',
  // Pour les fonds sombres et les photos.
  clair: 'bg-card text-ink hover:bg-canvas shadow-soft hover:shadow-lift',
  danger: 'bg-danger text-white hover:brightness-110',
};

const TAILLES: Record<Taille, string> = {
  sm: 'h-9 px-4 text-xs tracking-[0.14em]',
  md: 'h-11 px-6 text-[0.8125rem] tracking-[0.16em]',
  // `h-13` n'existe pas dans l'echelle Tailwind : la classe etait generee
  // vide et la taille `lg` retombait silencieusement sur h-12. h-14 est
  // valide et donne la difference visuelle attendue sur grand ecran.
  lg: 'h-12 px-7 text-[0.8125rem] tracking-[0.16em] sm:h-14 sm:px-8 sm:text-sm sm:tracking-[0.18em]',
};

const BASE =
  'group relative inline-flex items-center justify-center gap-2.5 rounded-full font-sans font-normal uppercase ' +
  'transition-[background-color,box-shadow,color,opacity,transform] duration-[140ms] ease-out ' +
  'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ' +
  'motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ' +
  'disabled:pointer-events-none disabled:opacity-45 select-none';

/** Contenu partagé entre le lien et le bouton. */
function Contenu({
  children,
  fleche,
  chargement,
}: {
  children: ReactNode;
  fleche?: boolean;
  chargement?: boolean;
}) {
  return (
    <>
      {chargement && <Icon nom="chargement" taille={16} className="animate-spin" />}
      <span className={cn(chargement && 'opacity-70')}>{children}</span>
      {fleche && !chargement && (
        // `translate-x` au survol du groupe : la flèche avance de 3 px.
        // C'est le détail qui fait qu'un bouton paraît vivant sans rien
        // animer en permanence.
        <Icon
          nom="fleche-droite"
          taille={16}
          className="transition-transform duration-[140ms] ease-out group-hover:translate-x-[3px]"
        />
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(props, ref) {
  const {
    variante = 'principal',
    taille = 'md',
    children,
    className,
    fleche,
    chargement,
    pleineLargeur,
  } = props;

  const classes = cn(BASE, VARIANTES[variante], TAILLES[taille], pleineLargeur && 'w-full', className);

  if ('href' in props && props.href !== undefined) {
    const { href, externe, onClick } = props;

    if (externe) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} onClick={onClick}>
          <Contenu fleche={fleche} chargement={chargement}>
            {children}
          </Contenu>
        </a>
      );
    }

    return (
      <Link href={href} className={classes} onClick={onClick}>
        <Contenu fleche={fleche} chargement={chargement}>
          {children}
        </Contenu>
      </Link>
    );
  }

  const {
    variante: _v,
    taille: _t,
    fleche: _f,
    chargement: _c,
    pleineLargeur: _p,
    className: _cl,
    children: _ch,
    ...reste
  } = props as PropsBouton;
  void _v; void _t; void _f; void _c; void _p; void _cl; void _ch;

  return (
    <button
      ref={ref}
      className={classes}
      disabled={chargement || reste.disabled}
      aria-busy={chargement || undefined}
      {...reste}
    >
      <Contenu fleche={fleche} chargement={chargement}>
        {children}
      </Contenu>
    </button>
  );
});

/**
 * Bouton circulaire — flèches de carrousel, fermeture de panneau.
 * Toujours accompagné d'un `aria-label` : il n'a pas de texte visible.
 */
export function BoutonRond({
  icone,
  label,
  onClick,
  className,
  ton = 'clair',
  disabled,
}: {
  icone: Parameters<typeof Icon>[0]['nom'];
  label: string;
  onClick?: () => void;
  className?: string;
  ton?: 'clair' | 'sombre';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 transition-[background-color,box-shadow,transform] duration-[140ms] ease-out',
        'hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
        ton === 'clair'
          ? 'bg-card text-ink ring-line hover:ring-champagne'
          : 'bg-transparent text-onshell ring-onshellmuted/40 hover:bg-white/10 hover:ring-onshell',
        'disabled:pointer-events-none disabled:opacity-35',
        className,
      )}
    >
      <Icon nom={icone} taille={18} />
    </button>
  );
}
