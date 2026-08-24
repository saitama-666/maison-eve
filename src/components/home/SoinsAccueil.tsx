import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { CarteSoin } from '@/components/soins/CarteSoin';
import { Button } from '@/components/ui/Button';
import { TitreSection } from '@/components/ui/Bits';
import type { Service } from '@/data/services';

// =====================================================================
//  Les soins mis en avant, sur la page d'accueil.
//
//  Six cartes maximum, comme sur la maquette. Au-delà, la page d'accueil
//  devient un catalogue et perd son rôle : donner envie, puis renvoyer
//  vers la page dédiée.
//
//  On affiche d'abord les soins marqués `populaire`, puis on complète
//  avec les autres pour toujours remplir la grille — un trou dans une
//  grille de trois colonnes se voit immédiatement.
// =====================================================================

export function SoinsAccueil({ services }: { services: readonly Service[] }) {
  const populaires = services.filter((s) => s.populaire);
  const complement = services.filter((s) => !s.populaire);
  const affiches = [...populaires, ...complement].slice(0, 6);

  if (affiches.length === 0) return null;

  return (
    <section className="bg-canvas py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <TitreSection
            surtitre="Nos soins"
            titre={
              <>
                Massage, hammam <span className="italic text-champagne">&amp; visage</span>
              </>
            }
            texte="Chaque soin dure le temps annoncé — pas dix minutes de moins."
            align="gauche"
          />

          <Button href="/soins" variante="secondaire" fleche className="shrink-0">
            Tous les soins
          </Button>
        </div>

        <RevealGroup
          intervalle={0.07}
          attente={0.08}
          className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {affiches.map((s, i) => (
            <RevealItem key={s.id} className="h-full">
              <CarteSoin service={s} priorite={i < 3} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
