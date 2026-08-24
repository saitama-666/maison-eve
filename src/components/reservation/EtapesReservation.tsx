'use client';


import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Indicateur d'étapes du tunnel de réservation.
//
//  Il répond à « où j'en suis » et « combien il en reste » — les deux
//  questions qui font abandonner un formulaire long quand on n'y répond
//  pas.
//
//  La barre de progression est un `scaleX` sur un élément à origine
//  gauche : elle s'anime sur le GPU. Animer `width` recalculerait la mise
//  en page à chaque image.
//
//  Une étape déjà franchie est CLIQUABLE — on revient corriger sans
//  refaire tout le parcours. Une étape à venir ne l'est pas : on ne saute
//  pas le choix du soin pour aller à la date.
// =====================================================================

export type Etape = {
  cle: string;
  label: string;
  courte: string;
};

export function EtapesReservation({
  etapes,
  actuelle,
  atteinte,
  aller,
}: {
  etapes: readonly Etape[];
  actuelle: number;
  /** Index de l'étape la plus avancée jamais atteinte. */
  atteinte: number;
  aller: (i: number) => void;
}) {
  const progression = etapes.length > 1 ? actuelle / (etapes.length - 1) : 1;

  return (
    <nav aria-label="Étapes de la réservation" className="flex flex-col gap-4">
      {/* --- Rail + pastilles --- */}
      <ol className="relative flex items-center justify-between">
        {/* Rail de fond */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[15px] h-px bg-line"
        />
        {/* Rail rempli. `scaleX` est posé en style inline et transitionné
            par CSS : la barre est toujours à la bonne longueur, animée ou
            non. */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[15px] h-px origin-left bg-champagne transition-transform duration-[440ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${progression})` }}
        />

        {etapes.map((e, i) => {
          const franchie = i < actuelle;
          const active = i === actuelle;
          const accessible = i <= atteinte;

          return (
            <li key={e.cle} className="relative z-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => accessible && aller(i)}
                disabled={!accessible}
                aria-current={active ? 'step' : undefined}
                aria-label={`Étape ${i + 1} : ${e.label}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors duration-[140ms] tabular',
                  franchie && 'bg-champagne text-surchampagne',
                  active && 'bg-ink text-oncream',
                  !franchie && !active && 'bg-canvas2 text-faint ring-1 ring-inset ring-line',
                  accessible && !active ? 'cursor-pointer hover:ring-champagne' : '',
                  !accessible && 'cursor-not-allowed',
                )}
              >
                {franchie ? (
                  <span className="surgir-coche">
                    <Icon nom="check" taille={13} trait={2.4} />
                  </span>
                ) : (
                  i + 1
                )}
              </button>

              <span
                className={cn(
                  'hidden text-[0.6875rem] uppercase tracking-[0.14em] sm:block',
                  active ? 'text-ink' : 'text-faint',
                )}
              >
                {e.courte}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Libellé complet sur mobile, où les libellés courts sont masqués. */}
      <p className="text-center text-sm text-muted sm:hidden">
        Étape {actuelle + 1} sur {etapes.length} — {etapes[actuelle]?.label}
      </p>
    </nav>
  );
}
