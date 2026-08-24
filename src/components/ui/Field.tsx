'use client';

import { useId, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Champs de formulaire.
//
//  Trois règles tenues partout :
//
//   1. TOUJOURS un `<label>` réellement lié au champ (`htmlFor`/`id`).
//      Un placeholder n'est pas une étiquette : il disparaît dès qu'on
//      tape, et les lecteurs d'écran ne l'annoncent pas de façon fiable.
//
//   2. L'erreur est liée par `aria-describedby` et annoncée en
//      `role="alert"`. Une erreur qui n'existe qu'en rouge est invisible
//      pour une personne qui ne distingue pas les couleurs.
//
//   3. L'ERREUR N'A AUCUN ÉTAT MASQUÉ. Elle glisse de 4 px, et c'est tout.
//
//      Elle était animée par Framer, depuis `{ opacity: 0, height: 0 }`.
//      Framer avance ses animations depuis `requestAnimationFrame` : quand
//      rAF ne tourne pas — onglet en arrière-plan, appareil en économie
//      d'énergie, erreur levée ailleurs dans l'arbre animé — le message
//      reste à opacité et hauteur nulles.
//
//      Le formulaire refusait alors d'avancer SANS DIRE POURQUOI. Sur un
//      tunnel de réservation, c'est le pire écran possible : le client
//      clique, rien ne bouge, il part.
//
//      Un message d'erreur est la dernière chose du site qui a le droit
//      de ne pas s'afficher. Il est donc rendu tel quel, et l'animation
//      ne fait que le décaler de 4 px.
// =====================================================================

type Commun = {
  label: string;
  erreur?: string;
  aide?: string;
  /** Étiquette « facultatif » à droite du label. */
  facultatif?: boolean;
  className?: string;
};

const CHAMP_BASE =
  'w-full rounded-md bg-card px-4 text-[0.9375rem] text-ink placeholder:text-faint ' +
  'ring-1 ring-inset transition-[box-shadow,background-color] duration-[140ms] ease-out ' +
  'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

function tonChamp(erreur?: string) {
  return erreur
    ? 'ring-danger focus:ring-danger'
    : 'ring-line hover:ring-champagne/60 focus:ring-champagne';
}

/** Étiquette + zone d'erreur, partagées par tous les champs. */
function Enveloppe({
  id,
  label,
  erreur,
  aide,
  facultatif,
  className,
  children,
}: Commun & { id: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        {facultatif && (
          <span className="font-sans text-[0.625rem] tracking-[0.14em] text-faint">facultatif</span>
        )}
      </div>

      {children}

      {aide && !erreur && (
        <p id={`${id}-aide`} className="text-xs leading-snug text-faint">
          {aide}
        </p>
      )}

      {erreur && (
        <p
          id={`${id}-erreur`}
          role="alert"
          className="erreur-champ flex items-start gap-1.5 text-xs leading-snug text-danger"
        >
          <Icon nom="alerte" taille={13} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </p>
      )}
    </div>
  );
}

// --- Texte -------------------------------------------------------------

type PropsInput = Commun & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export function Champ({ label, erreur, aide, facultatif, className, ...reste }: PropsInput) {
  const auto = useId();
  const id = reste.id ?? auto;

  return (
    <Enveloppe id={id} label={label} erreur={erreur} aide={aide} facultatif={facultatif} className={className}>
      <input
        {...reste}
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        className={cn(CHAMP_BASE, tonChamp(erreur), 'h-12')}
      />
    </Enveloppe>
  );
}

// --- Mot de passe ------------------------------------------------------

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * Le bouton porte `tabIndex={-1}` : au clavier, on passe du champ au
 * bouton suivant sans être détourné par l'œil. Une personne qui navigue
 * au clavier veut valider son formulaire, pas relire son mot de passe.
 */
export function ChampMotDePasse({ label, erreur, aide, className, ...reste }: PropsInput) {
  const auto = useId();
  const id = reste.id ?? auto;
  const [visible, setVisible] = useState(false);

  return (
    <Enveloppe id={id} label={label} erreur={erreur} aide={aide} className={className}>
      <div className="relative">
        <input
          {...reste}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
          className={cn(CHAMP_BASE, tonChamp(erreur), 'h-12 pr-12')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:text-ink"
        >
          <Icon nom={visible ? 'oeil-barre' : 'oeil'} taille={18} />
        </button>
      </div>
    </Enveloppe>
  );
}

// --- Zone de texte -----------------------------------------------------

type PropsZone = Commun & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  /** Affiche « 120 / 400 » sous le champ. */
  compteur?: number;
};

export function ZoneTexte({
  label,
  erreur,
  aide,
  facultatif,
  className,
  compteur,
  ...reste
}: PropsZone) {
  const auto = useId();
  const id = reste.id ?? auto;
  const longueur = typeof reste.value === 'string' ? reste.value.length : 0;

  return (
    <Enveloppe id={id} label={label} erreur={erreur} aide={aide} facultatif={facultatif} className={className}>
      <textarea
        {...reste}
        id={id}
        rows={reste.rows ?? 5}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        className={cn(CHAMP_BASE, tonChamp(erreur), 'resize-y py-3 leading-relaxed')}
      />
      {compteur && (
        <p
          className={cn(
            'text-right text-[0.6875rem] tabular',
            longueur > compteur ? 'text-danger' : 'text-faint',
          )}
        >
          {longueur} / {compteur}
        </p>
      )}
    </Enveloppe>
  );
}

// --- Liste déroulante --------------------------------------------------

type PropsSelect = Commun &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    options: readonly { valeur: string; label: string }[];
  };

export function Liste({ label, erreur, aide, facultatif, className, options, ...reste }: PropsSelect) {
  const auto = useId();
  const id = reste.id ?? auto;

  return (
    <Enveloppe id={id} label={label} erreur={erreur} aide={aide} facultatif={facultatif} className={className}>
      <div className="relative">
        <select
          {...reste}
          id={id}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
          className={cn(CHAMP_BASE, tonChamp(erreur), 'h-12 cursor-pointer appearance-none pr-11')}
        >
          {options.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          nom="chevron-bas"
          taille={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </Enveloppe>
  );
}

// --- Case à cocher -----------------------------------------------------

export function Case({
  label,
  erreur,
  coche,
  onChange,
  className,
  id: idFourni,
}: {
  label: ReactNode;
  erreur?: string;
  coche: boolean;
  onChange: (v: boolean) => void;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const id = idFourni ?? auto;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-inksoft">
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={coche}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={erreur ? true : undefined}
            aria-describedby={erreur ? `${id}-erreur` : undefined}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              'h-5 w-5 rounded-[5px] ring-1 ring-inset transition-colors duration-[140ms]',
              coche ? 'bg-ink ring-ink' : 'bg-card ring-line peer-hover:ring-champagne',
              erreur && !coche && 'ring-danger',
            )}
          />
          {/* La coche est TOUJOURS montée : seule son échelle change.
              L'état réel reste porté par `checked` sur l'input, donc il est
              annoncé correctement même si l'animation ne joue pas. */}
          <span
            aria-hidden
            className={cn(
              'absolute text-oncream transition-transform duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
              coche ? 'scale-100' : 'scale-0',
            )}
          >
            <Icon nom="check" taille={13} trait={2.2} />
          </span>
        </span>
        <span>{label}</span>
      </label>

      {erreur && (
        <p id={`${id}-erreur`} role="alert" className="erreur-champ pl-8 text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}

// --- Choix segmenté ----------------------------------------------------

/**
 * Deux ou trois options exclusives, façon interrupteur.
 *
 * Le fond actif GLISSE d'une option à l'autre au lieu d'apparaître à sa
 * nouvelle place. C'est le rôle « CONTINUITÉ » — le mouvement dit d'où
 * vient l'état.
 *
 * Il reposait sur le `layoutId` de Framer, qui mesure les deux positions à
 * chaque image. Une seule pastille suffit : sa largeur et son décalage se
 * calculent en CSS à partir du nombre d'options et de l'index actif. Si la
 * transition ne joue pas, la pastille est déjà à la bonne place — l'option
 * active reste donc toujours identifiable.
 *
 * Implémenté en `radiogroup` pour rester utilisable au clavier.
 */
export function Segments<T extends string>({
  label,
  options,
  valeur,
  onChange,
  className,
  erreur,
}: {
  label: string;
  options: readonly { valeur: T; label: string; desactive?: boolean; note?: string }[];
  valeur: T;
  onChange: (v: T) => void;
  className?: string;
  erreur?: string;
}) {
  const indexActif = Math.max(
    0,
    options.findIndex((o) => o.valeur === valeur),
  );

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-muted">{label}</span>

      <div
        role="radiogroup"
        aria-label={label}
        className="relative flex gap-1.5 rounded-full bg-canvas2 p-1.5 ring-1 ring-inset ring-line"
      >
        <span
          aria-hidden
          className="pilule bg-ink"
          style={{ '--pilule-n': options.length, '--pilule-i': indexActif } as CSSProperties}
        />
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              role="radio"
              aria-checked={actif}
              disabled={o.desactive}
              onClick={() => onChange(o.valeur)}
              className={cn(
                'relative flex-1 rounded-full px-4 py-2.5 text-center text-[0.8125rem] transition-colors duration-[140ms]',
                actif ? 'text-oncream' : 'text-muted hover:text-ink',
                o.desactive && 'cursor-not-allowed opacity-40 hover:text-muted',
              )}
            >
              <span className="relative z-10 block">{o.label}</span>
              {o.note && (
                <span className={cn('relative z-10 block text-[0.625rem]', actif ? 'text-onshellmuted' : 'text-faint')}>
                  {o.note}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {erreur && (
        <p role="alert" className="erreur-champ text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
