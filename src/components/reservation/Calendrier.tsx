'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { creneauxDuJour, joursReservables, libelleMois } from '@/lib/creneaux';
import { cleJour, cn } from '@/lib/utils';

// =====================================================================
//  Sélection de la date et de l'horaire.
//
//  Deux colonnes : les jours à gauche, les créneaux du jour choisi à
//  droite. Les créneaux se rechargent en cascade à chaque changement de
//  jour — le mouvement dit « cette liste vient de changer », ce qu'un
//  remplacement instantané ne dirait pas.
//
//  ⚠️  Ce composant est du CONFORT, pas de la sécurité. Le serveur
//      revalide entièrement le couple (date, créneau) dans
//      `POST /api/reservations` via `creneauValide()`. Masquer un bouton
//      n'empêche personne d'envoyer la requête à la main.
//
//  `occupes` viendra des réservations déjà prises. Tant que la liste
//  n'est pas branchée, tous les créneaux d'un jour ouvert sont proposés —
//  et c'est l'institut qui confirme, ce que le statut « en attente »
//  reflète honnêtement.
// =====================================================================

export function Calendrier({
  dureeMinutes,
  date,
  creneau,
  onDate,
  onCreneau,
  occupes = {},
}: {
  dureeMinutes: number;
  /** « 2026-07-14 » ou chaîne vide. */
  date: string;
  creneau: string;
  onDate: (d: string) => void;
  onCreneau: (c: string) => void;
  /** Créneaux déjà pris, par jour : `{ '2026-07-14': ['10:00'] }`. */
  occupes?: Record<string, readonly string[]>;
}) {
  const jours = useMemo(() => joursReservables().filter((j) => j.ouvert), []);
  const [debut, setDebut] = useState(0);

  // Sept jours visibles à la fois : une semaine tient dans la largeur, et
  // on ne noie pas le choix sous soixante boutons.
  const PAR_PAGE = 7;
  const visibles = jours.slice(debut, debut + PAR_PAGE);

  const dateChoisie = date ? jours.find((j) => j.cle === date)?.date : undefined;

  const creneaux = useMemo(() => {
    if (!dateChoisie) return [];
    return creneauxDuJour(dateChoisie, dureeMinutes, occupes[date] ?? []);
  }, [dateChoisie, dureeMinutes, occupes, date]);

  const disponibles = creneaux.filter((c) => c.disponible);

  return (
    <div className="flex flex-col gap-8">
      {/* ============ Jours ============ */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
            Choisir un jour
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDebut((d) => Math.max(0, d - PAR_PAGE))}
              disabled={debut === 0}
              aria-label="Jours précédents"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon nom="fleche-gauche" taille={15} />
            </button>
            <button
              type="button"
              onClick={() => setDebut((d) => Math.min(jours.length - PAR_PAGE, d + PAR_PAGE))}
              disabled={debut + PAR_PAGE >= jours.length}
              aria-label="Jours suivants"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon nom="fleche-droite" taille={15} />
            </button>
          </div>
        </div>

        {visibles.length > 0 && (
          <p className="text-sm capitalize text-faint">{libelleMois(visibles[0].date)}</p>
        )}

        <div
          role="radiogroup"
          aria-label="Jour du rendez-vous"
          className="grid grid-cols-4 gap-2 sm:grid-cols-7"
        >
          {visibles.map((j) => {
            const actif = j.cle === date;
            const aujourdhui = j.cle === cleJour(new Date());

            return (
              <button
                key={j.cle}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => {
                  onDate(j.cle);
                  // Le créneau est remis à zéro : il appartenait au jour
                  // précédent et n'existe peut-être pas celui-ci.
                  onCreneau('');
                }}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-lg py-3 ring-1 ring-inset',
                  'transition-[transform,box-shadow,background-color,color] duration-[140ms] ease-out',
                  'hover:-translate-y-[3px] active:scale-95 motion-reduce:hover:translate-y-0',
                  actif
                    ? 'bg-ink text-oncream ring-ink'
                    : 'bg-card text-ink ring-line hover:ring-champagne',
                )}
              >
                <span
                  className={cn(
                    'text-[0.625rem] uppercase tracking-[0.1em]',
                    actif ? 'text-onshellmuted' : 'text-faint',
                  )}
                >
                  {j.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <span className="font-display text-2xl tabular">{j.date.getDate()}</span>
                {aujourdhui && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute bottom-1.5 h-1 w-1 rounded-full',
                      actif ? 'bg-champagnesoft' : 'bg-champagne',
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-faint">
          Fermé le dimanche en ligne — pour un dimanche, appelez-nous.
        </p>
      </div>

      {/* ============ Créneaux ============ */}
      <div className="flex flex-col gap-3">
        <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
          Choisir un horaire
        </span>

        {/*
          Les créneaux étaient révélés par une cascade Framer partant de
          `{ opacity: 0 }`. Sans boucle d'animation, la grille des horaires
          restait vide : le client voyait un jour sélectionné et aucune
          heure à cliquer, sans moyen de terminer sa réservation.

          La cascade est maintenant en CSS (`.surgir-cascade`) et ne joue
          que sur la position.
        */}
        {!date ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-faint">
            Choisissez d’abord un jour.
          </p>
        ) : disponibles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-faint">
            Plus de créneau ce jour-là pour un soin de cette durée. Essayez un autre jour.
          </p>
        ) : (
          <div
            key={date}
            className="surgir-cascade grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
          >
            {creneaux.map((c) => (
              <button
                key={c.heure}
                type="button"
                disabled={!c.disponible}
                onClick={() => onCreneau(c.heure)}
                aria-pressed={creneau === c.heure}
                className={cn(
                  'rounded-full py-2.5 text-sm ring-1 ring-inset tabular',
                  'transition-[transform,box-shadow,background-color,color] duration-[140ms] ease-out',
                  creneau === c.heure
                    ? 'bg-ink text-oncream ring-ink'
                    : c.disponible
                      ? 'bg-card text-ink ring-line hover:-translate-y-0.5 hover:ring-champagne active:scale-95 motion-reduce:hover:translate-y-0'
                      : 'cursor-not-allowed bg-canvas2 text-faint line-through ring-transparent opacity-55',
                )}
              >
                {c.heure}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
