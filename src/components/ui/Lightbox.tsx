'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';

import { Icon } from '@/components/ui/Icon';
import type { Visuel } from '@/data/galerie';

// =====================================================================
//  Visionneuse plein écran.
//
//  Elle est modale, donc elle doit se comporter comme une modale. Cinq
//  points, chacun corrigeant un défaut classique de visionneuse maison :
//
//   1. ÉCHAP ferme, FLÈCHES naviguent. C'est le réflexe de tout le monde.
//   2. LE DÉFILEMENT DE LA PAGE EST BLOQUÉ. Sinon on scrolle la page
//      derrière et on ressort ailleurs.
//   3. LE FOCUS ENTRE dans la visionneuse à l'ouverture et REVIENT à la
//      vignette d'origine à la fermeture.
//   4. LE FOCUS EST PIÉGÉ : la tabulation tourne à l'intérieur au lieu de
//      partir dans la page cachée derrière.
//   5. LE FOND EST CLIQUABLE pour fermer, mais l'image ne l'est pas
//      (`stopPropagation`) — sinon on ferme en voulant regarder.
//
//  Elle n'est MONTÉE que lorsqu'elle est ouverte : fermée, elle ne pèse
//  rien dans le DOM et ne capte aucune tabulation.
// =====================================================================

export function Lightbox({
  visuels,
  index,
  fermer,
  aller,
}: {
  visuels: readonly Visuel[];
  /** `null` = fermée. */
  index: number | null;
  fermer: () => void;
  aller: (i: number) => void;
}) {
  const ouvert = index !== null;
  const panneau = useRef<HTMLDivElement>(null);
  const declencheur = useRef<Element | null>(null);

  const suivant = useCallback(() => {
    if (index === null) return;
    aller((index + 1) % visuels.length);
  }, [index, aller, visuels.length]);

  const precedent = useCallback(() => {
    if (index === null) return;
    aller((index - 1 + visuels.length) % visuels.length);
  }, [index, aller, visuels.length]);

  useEffect(() => {
    if (!ouvert) return;

    declencheur.current = document.activeElement;

    function surTouche(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        fermer();
        return;
      }
      if (e.key === 'ArrowRight') {
        suivant();
        return;
      }
      if (e.key === 'ArrowLeft') {
        precedent();
        return;
      }

      // --- Piège à focus ---
      if (e.key !== 'Tab') return;
      const racine = panneau.current;
      if (!racine) return;

      const focusables = racine.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    }

    const debordement = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', surTouche);

    // Le focus entre dans la visionneuse.
    panneau.current?.focus();

    return () => {
      document.body.style.overflow = debordement;
      document.removeEventListener('keydown', surTouche);
      if (declencheur.current instanceof HTMLElement) declencheur.current.focus();
    };
  }, [ouvert, fermer, suivant, precedent]);

  const visuel = index !== null ? visuels[index] : null;

  if (!ouvert || !visuel) return null;

  return (
    /*
      Le VOILE est le seul élément du site où un fondu depuis `opacity: 0`
      reste admis : ce n'est pas du contenu. S'il ne se joue pas, on voit
      la page derrière — dégradé, jamais illisible.

      Le fondu du voile porte sur un pseudo-élément (`.voile-modal::before`)
      et non sur ce conteneur : l'image est un enfant, et un conteneur resté
      à `opacity: 0` l'emporterait avec lui.

      L'IMAGE, elle, ne fait que se remettre à l'échelle. Elle partait de
      `opacity: 0` sous Framer : quand la boucle d'animation ne tournait
      pas, on ouvrait la visionneuse sur un écran noir vide, sans image et
      sans moyen évident de comprendre pourquoi.

      Il n'y a plus d'animation de SORTIE : la visionneuse se démonte
      immédiatement. Une sortie animée demanderait de retarder le
      démontage, donc de garder un panneau plein écran par-dessus la page
      en pariant sur la fin d'une animation. Fermer doit toujours fermer.
    */
    <div
      onClick={fermer}
      className="voile-modal fixed inset-0 z-[400] flex items-center justify-center bg-ink/93 p-4 backdrop-blur-sm sm:p-8"
    >
      {/* Le fond assombri est peint par `.voile-modal::before`, qui hérite
          de `background` — d'où `bg-ink/93` posé ici, sur le conteneur. */}
          <div
            ref={panneau}
            role="dialog"
            aria-modal="true"
            aria-label={visuel.legende}
            tabIndex={-1}
            className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center outline-none"
          >
            {/* --- Fermer --- */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fermer();
              }}
              aria-label="Fermer la visionneuse"
              className="absolute right-0 top-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-onshell ring-1 ring-white/25 transition-colors duration-[140ms] hover:bg-white/12"
            >
              <Icon nom="fermer" taille={19} />
            </button>

            {/* --- Image --- */}
            {/* Remontée à chaque visuel (`key`) : `.modal-contenu` rejoue. */}
            <div
              key={visuel.src}
              onClick={(e) => e.stopPropagation()}
              className="modal-contenu relative max-h-[78vh] w-full flex-1"
            >
              <Image
                src={visuel.src}
                alt={visuel.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
              />
            </div>

            {/* --- Légende + navigation --- */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-5 flex w-full items-center justify-between gap-4"
            >
              <button
                type="button"
                onClick={precedent}
                aria-label="Visuel précédent"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-onshell ring-1 ring-white/25 transition-colors duration-[140ms] hover:bg-white/12"
              >
                <Icon nom="fleche-gauche" taille={18} />
              </button>

              <p className="min-w-0 text-center text-sm text-onshellmuted">
                <span className="block truncate text-onshell">{visuel.legende}</span>
                <span className="tabular">
                  {(index ?? 0) + 1} / {visuels.length}
                </span>
              </p>

              <button
                type="button"
                onClick={suivant}
                aria-label="Visuel suivant"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-onshell ring-1 ring-white/25 transition-colors duration-[140ms] hover:bg-white/12"
              >
                <Icon nom="fleche-droite" taille={18} />
              </button>
            </div>
          </div>
    </div>
  );
}
