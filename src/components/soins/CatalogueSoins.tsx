'use client';

import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

import { CarteSoin } from '@/components/soins/CarteSoin';
import { EtatVide } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { useCatalogue } from '@/lib/catalogue-context';
import { cn } from '@/lib/utils';

// =====================================================================
//  Catalogue filtrable.
//
//  Le filtre est purement CLIENT : le catalogue complet est déjà là,
//  injecté par le serveur. Aucun aller-retour réseau, donc le filtrage
//  est instantané — c'est ce qui le rend agréable.
//
//  ⚠️  PLUS DE FRAMER MOTION ICI. Ne pas le réintroduire.
//
//      C'était le dernier fichier de la vitrine à l'importer, pour trois
//      ornements : la pastille du filtre, le bouton bascule, et le
//      glissement des cartes. Coût mesuré : **46 kB de JavaScript sur
//      /soins, contre 3 kB sur toutes les autres pages vitrine** — sur la
//      page qui vend, et pour une clientèle majoritairement sur mobile.
//
//      Les trois ornements sont maintenant en CSS ou en API native :
//        · la pastille → l'onglet actif porte simplement son fond ;
//        · la bascule  → une transition CSS sur `left` ;
//        · les cartes  → l'API View Transitions, quand le navigateur
//          l'a. Elle fait le même FLIP que Framer, en mieux, pour zéro
//          octet. Sans elle, le filtre s'applique instantanément.
//
//      C'est la règle habituelle du projet, appliquée au mouvement :
//      **l'animation est un ornement, jamais un prérequis**. Rien ici ne
//      part masqué, rien n'attend une librairie pour devenir visible.
// =====================================================================

type Filtre = 'tous' | string;

/**
 * Applique un changement de filtre, avec le glissement des cartes si le
 * navigateur sait le faire.
 *
 * `flushSync` est indispensable : `startViewTransition` photographie le
 * DOM AVANT et APRÈS le rappel. Sans rendu synchrone, React mettrait à
 * jour après la photo « après », et la transition n'animerait rien.
 */
function avecTransition(appliquer: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };

  const mouvementRefuse =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || mouvementRefuse) {
    appliquer();
    return;
  }

  doc.startViewTransition(() => flushSync(appliquer));
}

export function CatalogueSoins() {
  const { services, categories } = useCatalogue();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [lieu, setLieu] = useState<'tous' | 'domicile'>('tous');

  const actifs = useMemo(() => services.filter((s) => s.actif), [services]);

  // La bascule ne s'affiche que si au moins un soin est propose a domicile.
  // Maison Eve n'en propose aucun : le filtre ne renverrait que du vide.
  const domicileProposé = useMemo(() => actifs.some((s) => s.domicileDisponible), [actifs]);

  const visibles = useMemo(() => {
    let liste = actifs;
    if (filtre !== 'tous') liste = liste.filter((s) => s.categorie === filtre);
    if (lieu === 'domicile') liste = liste.filter((s) => s.domicileDisponible);
    return liste;
  }, [actifs, filtre, lieu]);

  // On ne propose pas une catégorie vide : un onglet qui mène à « aucun
  // résultat » est une impasse qu'on aurait pu éviter.
  const categoriesUtiles = useMemo(
    () => categories.filter((c) => actifs.some((s) => s.categorie === c.id)),
    [categories, actifs],
  );

  return (
    <section className="bg-canvas py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* --- Filtres ---
            Des `<button>` avec `aria-pressed`, PAS `role="tab"`.

            Un `role="tab"` promet un motif complet : navigation aux
            flèches, un seul arrêt de tabulation pour le groupe, et un
            `aria-controls` vers un `tabpanel`. Rien de tout ça n'existe
            ici. Annoncer « onglet » sans le comportement laisse la
            personne au lecteur d'écran chercher des touches qui ne font
            rien — c'est pire que de ne rien annoncer. Un bouton à deux
            états dit exactement ce qui se passe. */}
        <div
          role="group"
          aria-label="Filtrer par type de soin"
          className="flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="-mx-1 flex flex-wrap items-center gap-1 overflow-x-auto px-1">
            <OngletFiltre
              actif={filtre === 'tous'}
              onClick={() => avecTransition(() => setFiltre('tous'))}
            >
              Tous
              <span className="ml-1.5 text-[0.6875rem] opacity-60 tabular">{actifs.length}</span>
            </OngletFiltre>

            {categoriesUtiles.map((c) => {
              const nombre = actifs.filter((s) => s.categorie === c.id).length;
              return (
                <OngletFiltre
                  key={c.id}
                  actif={filtre === c.id}
                  onClick={() => avecTransition(() => setFiltre(c.id))}
                >
                  {c.nom}
                  <span className="ml-1.5 text-[0.6875rem] opacity-60 tabular">{nombre}</span>
                </OngletFiltre>
              );
            })}
          </div>

          {/* Bascule « à domicile » — la question la plus fréquente, donc
              elle mérite un filtre à part plutôt qu'une catégorie de plus.
              Masquée quand aucun soin n'est proposé à domicile. */}
          {domicileProposé && (
          <button
            type="button"
            onClick={() =>
              avecTransition(() => setLieu((l) => (l === 'domicile' ? 'tous' : 'domicile')))
            }
            aria-pressed={lieu === 'domicile'}
            className={cn(
              'inline-flex shrink-0 items-center gap-2.5 self-start rounded-full px-4 py-2.5 text-[0.8125rem] ring-1 ring-inset transition-colors duration-[140ms] lg:self-auto',
              lieu === 'domicile'
                ? 'bg-ink text-oncream ring-ink'
                : 'bg-card text-muted ring-line hover:text-ink hover:ring-champagne',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'relative h-4 w-7 rounded-full transition-colors duration-[140ms]',
                lieu === 'domicile' ? 'bg-champagne' : 'bg-line',
              )}
            >
              {/* Le curseur glisse par transition CSS. S'il ne glisse pas,
                  il est déjà au bon endroit : rien n'est perdu qu'un
                  mouvement. */}
              <span
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-card shadow-sm',
                  'transition-[left] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  lieu === 'domicile' ? 'left-3.5' : 'left-0.5',
                )}
              />
            </span>
            Disponible à domicile
          </button>
          )}
        </div>

        {/* --- Grille --- */}
        {visibles.length === 0 ? (
          <EtatVide
            className="mt-12"
            titre="Aucun soin ne correspond"
            texte="Essayez une autre catégorie, ou retirez le filtre « à domicile »."
            action={
              <Button
                variante="secondaire"
                onClick={() => {
                  avecTransition(() => {
                    setFiltre('tous');
                    setLieu('tous');
                  });
                }}
              >
                Tout afficher
              </Button>
            }
          />
        ) : (
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {visibles.map((s, i) => (
              <div
                key={s.id}
                className="h-full"
                /*
                  Un nom de transition UNIQUE par carte : c'est lui qui
                  permet au navigateur de reconnaître la même carte avant
                  et après le filtrage, et donc de la faire glisser.
                  Préfixé, parce qu'un identifiant CSS ne peut pas
                  commencer par un chiffre.
                */
                style={{ viewTransitionName: `soin-${s.id}` }}
              >
                <CarteSoin service={s} priorite={i < 3} niveau={2} />
              </div>
            ))}
          </div>
        )}

        {/* Compte des résultats, annoncé aux lecteurs d'écran : sans ça,
            filtrer ne produit aucun retour perceptible sans la vue. */}
        <p role="status" aria-live="polite" className="sr-only">
          {visibles.length} soin{visibles.length > 1 ? 's' : ''} affiché
          {visibles.length > 1 ? 's' : ''}.
        </p>
      </div>
    </section>
  );
}

function OngletFiltre({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2.5 text-[0.8125rem] transition-colors duration-[140ms]',
        actif ? 'bg-ink text-oncream' : 'text-muted hover:bg-canvas2 hover:text-ink',
      )}
    >
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
