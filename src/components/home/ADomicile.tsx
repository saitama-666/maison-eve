import Image from 'next/image';

import { Reveal, RevealGroup, RevealItem, RevealVisuel } from '@/components/motion/Reveal';
import { BandeauImage } from '@/components/ui/BandeauImage';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TitreSection } from '@/components/ui/Bits';
import { contact } from '@/data/site';

// =====================================================================
//  « Le spa vient à vous » — la promesse du soin à domicile.
//
//  C'est la section la plus importante du site après les soins : c'est ce
//  qui distingue la maison d'un institut ordinaire. Elle répond aux trois
//  objections qui reviennent à chaque première réservation :
//  « qu'est-ce que je dois préparer ? », « ça prend quelle place ? »,
//  « vous venez jusqu'où ? »
// =====================================================================

const ETAPES = [
  {
    numero: '01',
    titre: 'Vous réservez',
    texte: 'En ligne ou par téléphone. On confirme le créneau dans les heures qui suivent.',
    icone: 'calendrier' as const,
  },
  {
    numero: '02',
    titre: 'On s’installe',
    texte: 'Table, serviettes chaudes, huiles, musique. Il vous faut deux mètres sur deux, c’est tout.',
    icone: 'maison' as const,
  },
  {
    numero: '03',
    titre: 'Vous vous détendez',
    texte: 'Le soin dure le temps annoncé. Et à la fin, on remballe tout — vous ne rangez rien.',
    icone: 'lotus' as const,
  },
];

export function ADomicile() {
  return (
    <>
      {/* --- Bandeau d'accroche --- */}
      <BandeauImage src="/bandeaux/domicile.svg" hauteur="moyen" align="gauche">
        <Reveal className="max-w-xl">
          <span className="surtitre text-champagnesoft">Soins à domicile</span>
          <h2 className="mt-5 font-display text-[2.25rem] leading-[1.1] text-onshell sm:text-[3rem]">
            Le spa vient <span className="italic text-champagnesoft">jusqu’à vous</span>
          </h2>
          <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-onshell">
            {contact.homeServiceArea}. On apporte tout, on repart avec tout.
          </p>
          <div className="mt-8">
            <Button href="/reservation?lieu=domicile" variante="clair" fleche>
              Réserver à domicile
            </Button>
          </div>
        </Reveal>
      </BandeauImage>

      {/* --- Les trois étapes --- */}
      <section className="bg-canvas py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
            {/* Visuel */}
            <RevealVisuel className="relative order-2 aspect-[5/4] rounded-2xl lg:order-1">
              <Image
                src="/bandeaux/equipe.svg"
                alt="Une praticienne installe la table de massage"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </RevealVisuel>

            {/* Étapes */}
            <div className="order-1 flex flex-col gap-8 lg:order-2">
              <TitreSection
                surtitre="Comment ça se passe"
                titre={
                  <>
                    Trois étapes, <span className="italic text-champagne">rien à prévoir</span>
                  </>
                }
                align="gauche"
              />

              <RevealGroup intervalle={0.09} className="flex flex-col">
                {ETAPES.map((e) => (
                  <RevealItem key={e.numero}>
                    <div className="group flex gap-5 border-b border-linesoft py-6 last:border-0">
                      {/* Le numéro s'efface au survol pendant que l'icône
                          apparaît à sa place — un seul emplacement, deux
                          états. Plus lisible que d'afficher les deux. */}
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                        <span className="absolute font-display text-3xl text-champagne/80 transition-[opacity,transform] duration-200 ease-out group-hover:scale-75 group-hover:opacity-0">
                          {e.numero}
                        </span>
                        <span className="absolute scale-75 text-champagne opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100">
                          <Icon nom={e.icone} taille={26} />
                        </span>
                      </span>

                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-display text-xl text-ink">{e.titre}</h3>
                        <p className="text-sm leading-relaxed text-muted">{e.texte}</p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
