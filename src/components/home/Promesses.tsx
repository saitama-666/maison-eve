import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TitreSection } from '@/components/ui/Bits';
import { Icon, type NomIcone } from '@/components/ui/Icon';
import { promesses } from '@/data/site';

// =====================================================================
//  « Pourquoi nous choisir » — les trois promesses.
//
//  Reprend la section à trois colonnes de la maquette. Chaque colonne
//  arrive en cascade, avec 60 ms d'écart : assez pour qu'on perçoive
//  l'ordre, assez peu pour que l'ensemble reste un seul geste.
//
//  L'icône grossit légèrement au survol de SA colonne (`group`), pas au
//  survol d'elle-même : la zone sensible est ainsi bien plus grande, ce
//  qui rend l'effet fiable à la souris comme au doigt.
// =====================================================================

const ICONES: Record<string, NomIcone> = {
  diplome: 'diplome',
  maison: 'maison',
  feuille: 'feuille',
};

export function Promesses() {
  return (
    <section className="bg-canvas2 py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <TitreSection
          surtitre="Pourquoi nous"
          titre={
            <>
              Trois raisons, <span className="italic text-champagne">pas dix</span>
            </>
          }
          texte="Ce qui change vraiment votre séance — le reste, c’est du décor."
          className="mx-auto max-w-2xl"
        />

        <RevealGroup intervalle={0.08} attente={0.1} className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-10 lg:gap-14">
          {promesses.map((p) => (
            <RevealItem key={p.titre}>
              <article className="group flex flex-col items-center gap-4 text-center">
                {/* Survol en CSS : le ressort Framer coûtait un composant
                    client pour une rotation de quatre degrés. */}
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-card text-champagne shadow-soft transition-transform duration-200 ease-out group-hover:-rotate-4 group-hover:scale-110 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0">
                  {/* Anneau qui pulse — discret, il signale l'élément
                      interactif sans clignoter. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-1 ring-champagne/25 group-hover:animate-pulse-ring"
                  />
                  <Icon nom={ICONES[p.icone] ?? 'lotus'} taille={26} />
                </span>

                <h3 className="font-display text-2xl text-ink">{p.titre}</h3>

                <p className="max-w-xs text-sm leading-relaxed text-muted">{p.texte}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
