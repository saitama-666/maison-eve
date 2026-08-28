import { Reveal } from '@/components/motion/Reveal';
import { tarifsALaCarte } from '@/data/services';
import { prix } from '@/lib/utils';

// =====================================================================
//  Les prestations à la carte — coiffure, mains & pieds, cils, épilation.
//
//  Ces lignes ne sont PAS des soins réservables : ce sont des actes
//  facturés à l'unité, souvent ajoutés à un rendez-vous existant. Elles
//  vivent donc hors du catalogue `services` et hors du tunnel de
//  réservation — une simple grille de prix, lisible d'un coup d'œil.
//
//  C'est précisément l'argument du site face à leur grille Instagram :
//  là-bas, comparer deux lignes demande de faire défiler onze visuels.
//  Ici, tout tient sur un écran.
//
//  Tarifs : grille officielle Maison Eve du 12/01/2026. Voir l'en-tête de
//  `src/data/services.ts` pour la source et les réserves.
// =====================================================================

export function TarifsALaCarte() {
  return (
    <section id="tarifs-a-la-carte" className="bg-canvas2 py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="surtitre text-champagne">À la carte</span>

          <h2 className="mt-6 font-display text-[2rem] leading-[1.1] text-ink sm:text-[2.75rem]">
            Les <span className="italic text-champagne">petits soins</span>
          </h2>

          <p className="mt-5 text-[0.9375rem] leading-relaxed text-inksoft">
            Coiffure, ongles, cils, épilation. À prendre seuls ou à ajouter à votre
            rendez-vous — dites-le nous à l’accueil.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-12 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {tarifsALaCarte.map((section) => (
            <Reveal key={section.id}>
              <h3 className="font-display text-xl text-ink">{section.titre}</h3>

              <dl className="mt-5 border-t border-line">
                {section.lignes.map((ligne) => (
                  <div
                    key={ligne.nom}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <dt className="text-[0.9375rem] leading-snug text-inksoft">{ligne.nom}</dt>
                    <dd className="shrink-0 whitespace-nowrap text-[0.9375rem] font-medium text-ink">
                      {ligne.aPartirDe && (
                        <span className="mr-1 text-xs font-normal text-inksoft">dès</span>
                      )}
                      {prix(ligne.prix)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
