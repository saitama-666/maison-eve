'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

// =====================================================================
//  Accordéon — utilisé pour la FAQ.
//
//  Écrit à la main plutôt qu'avec `<details>` : `<details>` n'anime pas
//  son ouverture de façon fiable entre navigateurs, et son marqueur est
//  difficile à styliser proprement.
//
//  L'accessibilité est donc à notre charge, et elle est faite :
//   · le bouton porte `aria-expanded` et `aria-controls`
//   · le panneau porte `role="region"` et `aria-labelledby`
//   · l'ordre du DOM suit l'ordre visuel, donc la tabulation est correcte
//
//  C'est le seul endroit du site, avec les erreurs de formulaire, où on
//  anime une HAUTEUR. C'est assumé : il faut que le décalage du contenu
//  situé en dessous soit perçu comme un mouvement, pas comme un saut.
//  Ailleurs, on s'en tient à `transform`.
//
//  ⚠️  LE PANNEAU RESTE MONTÉ, MASQUÉ PAR LA HAUTEUR — PAS PAR L'OPACITÉ.
//
//      Il était animé par Framer : `initial={{ height: 0, opacity: 0 }}`.
//      Framer avance depuis `requestAnimationFrame` ; quand rAF ne tourne
//      pas, le panneau reste à hauteur nulle ET à opacité nulle. La
//      réponse à la question n'apparaissait jamais.
//
//      La hauteur passe maintenant par `grid-template-rows: 0fr -> 1fr`
//      (classe `.tiroir`), la seule technique CSS qui interpole vers une
//      hauteur AUTO sans la mesurer en JavaScript. Là où elle n'est pas
//      gérée, le panneau s'ouvre d'un coup — sans transition, mais lisible.
//
//      `inert` sur le panneau fermé le retire de la tabulation et des
//      technologies d'assistance, ce que `grid-template-rows: 0fr` seul ne
//      fait pas — le texte serait invisible mais toujours focalisable.
//
//      On n'utilise PAS l'attribut `hidden` ici : il vaut `display: none`,
//      posé par la base Tailwind, et `.tiroir { display: grid }` vit dans
//      la couche `components`, qui passe après. Même spécificité, couche
//      plus tardive : `hidden` n'aurait rien caché du tout.
// =====================================================================

export type Entree = {
  q: string;
  r: string;
};

export function Accordeon({
  entrees,
  /** Index ouvert au chargement. `-1` = tout fermé. */
  ouvertParDefaut = 0,
  /** Autorise plusieurs panneaux ouverts en même temps. */
  multiple = false,
  className,
}: {
  entrees: readonly Entree[];
  ouvertParDefaut?: number;
  multiple?: boolean;
  className?: string;
}) {
  const [ouverts, setOuverts] = useState<number[]>(
    ouvertParDefaut >= 0 ? [ouvertParDefaut] : [],
  );
  const base = useId();

  function basculer(i: number) {
    setOuverts((actuels) => {
      const estOuvert = actuels.includes(i);
      if (multiple) {
        return estOuvert ? actuels.filter((x) => x !== i) : [...actuels, i];
      }
      return estOuvert ? [] : [i];
    });
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {entrees.map((e, i) => {
        const ouvert = ouverts.includes(i);
        const idBouton = `${base}-b-${i}`;
        const idPanneau = `${base}-p-${i}`;

        return (
          <div key={e.q} className="border-b border-line last:border-0">
            <h3>
              <button
                type="button"
                id={idBouton}
                aria-expanded={ouvert}
                aria-controls={idPanneau}
                onClick={() => basculer(i)}
                className="group flex w-full items-start justify-between gap-5 py-5 text-left transition-colors duration-[140ms] hover:text-champagne"
              >
                <span
                  className={cn(
                    'font-display text-lg leading-snug transition-colors duration-[140ms] sm:text-xl',
                    ouvert ? 'text-champagne' : 'text-ink group-hover:text-champagne',
                  )}
                >
                  {e.q}
                </span>

                {/* Croix qui pivote en moins. Deux traits, un seul tourne :
                    plus lisible qu'un chevron, et ça marche à toute taille. */}
                <span
                  aria-hidden
                  className="relative mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center"
                >
                  <span className="absolute h-px w-4 bg-current" />
                  <span
                    className={cn(
                      'absolute h-px w-4 bg-current transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                      ouvert ? 'rotate-180' : 'rotate-90',
                    )}
                  />
                </span>
              </button>
            </h3>

            <div
              id={idPanneau}
              role="region"
              aria-labelledby={idBouton}
              inert={!ouvert}
              data-ouvert={ouvert ? 'oui' : 'non'}
              className="tiroir"
            >
              <div>
                <p className="pb-6 pr-10 text-[0.9375rem] leading-relaxed text-muted">{e.r}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
