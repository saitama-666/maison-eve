'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

import { CarteSoin } from '@/components/soins/CarteSoin';
import { EtatVide } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { useCatalogue } from '@/lib/catalogue-context';
import { EASE_OUT_EXPO, ressort } from '@/lib/motion';
import { cn } from '@/lib/utils';

// =====================================================================
//  Catalogue filtrable.
//
//  Le filtre est purement CLIENT : le catalogue complet est déjà là,
//  injecté par le serveur. Aucun aller-retour réseau, donc le filtrage
//  est instantané — c'est ce qui le rend agréable.
//
//  Deux détails de mouvement qui font tout :
//
//   · `layout` sur chaque carte : quand la grille se recompose, les
//     cartes qui restent GLISSENT à leur nouvelle place au lieu de
//     sauter. C'est le rôle « continuité ».
//
//   · La pastille active du filtre est un `layoutId` partagé : elle se
//     déplace d'un onglet à l'autre.
//
//  `mode="popLayout"` sur `AnimatePresence` : les cartes sortantes sont
//  retirées du flux immédiatement, donc les restantes commencent à se
//  replacer sans attendre la fin de l'animation de sortie.
// =====================================================================

type Filtre = 'tous' | string;

export function CatalogueSoins() {
  const { services, categories } = useCatalogue();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [lieu, setLieu] = useState<'tous' | 'domicile'>('tous');

  const actifs = useMemo(() => services.filter((s) => s.actif), [services]);

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
        {/* --- Filtres --- */}
        <div className="flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filtrer par type de soin"
            className="-mx-1 flex flex-wrap items-center gap-1 overflow-x-auto px-1"
          >
            <OngletFiltre actif={filtre === 'tous'} onClick={() => setFiltre('tous')}>
              Tous
              <span className="ml-1.5 text-[0.6875rem] opacity-60 tabular">{actifs.length}</span>
            </OngletFiltre>

            {categoriesUtiles.map((c) => {
              const nombre = actifs.filter((s) => s.categorie === c.id).length;
              return (
                <OngletFiltre key={c.id} actif={filtre === c.id} onClick={() => setFiltre(c.id)}>
                  {c.nom}
                  <span className="ml-1.5 text-[0.6875rem] opacity-60 tabular">{nombre}</span>
                </OngletFiltre>
              );
            })}
          </div>

          {/* Bascule « à domicile » — la question la plus fréquente, donc
              elle mérite un filtre à part plutôt qu'une catégorie de plus. */}
          <button
            type="button"
            onClick={() => setLieu((l) => (l === 'domicile' ? 'tous' : 'domicile'))}
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
              <motion.span
                layout
                transition={ressort}
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-card shadow-sm',
                  lieu === 'domicile' ? 'left-3.5' : 'left-0.5',
                )}
              />
            </span>
            Disponible à domicile
          </button>
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
                  setFiltre('tous');
                  setLieu('tous');
                }}
              >
                Tout afficher
              </Button>
            }
          />
        ) : (
          <motion.div layout className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {/*
                ⚠️  PAS D'ANIMATION D'ENTRÉE ICI. Ne pas remettre `initial`.

                Les cartes portaient `initial={{ opacity: 0 }}`. Framer
                l'écrivait donc dans le HTML du serveur : les douze cartes
                du catalogue arrivaient INVISIBLES et n'apparaissaient
                qu'une fois la librairie démarrée. Sur cette page, c'est
                tout le contenu utile.

                Il reste `layout` (les cartes glissent à leur nouvelle
                place quand on filtre) et `exit` (elles s'effacent en
                sortant) : ces deux-là ne se jouent qu'après une action de
                la visiteuse, donc jamais au premier affichage.
              */}
              {visibles.map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                  transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
                  className="h-full"
                >
                  <CarteSoin service={s} priorite={i < 3} niveau={2} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
      role="tab"
      aria-selected={actif}
      onClick={onClick}
      className={cn(
        'relative shrink-0 rounded-full px-4 py-2.5 text-[0.8125rem] transition-colors duration-[140ms]',
        actif ? 'text-oncream' : 'text-muted hover:text-ink',
      )}
    >
      {actif && (
        <motion.span
          layoutId="filtre-soins"
          aria-hidden
          className="absolute inset-0 rounded-full bg-ink"
          transition={ressort}
        />
      )}
      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </button>
  );
}
