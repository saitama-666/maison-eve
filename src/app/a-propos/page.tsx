import type { Metadata } from 'next';
import Image from 'next/image';

import { AppelReservation } from '@/components/home/AppelReservation';
import { Promesses } from '@/components/home/Promesses';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { Reveal, RevealGroup, RevealItem, RevealVisuel } from '@/components/motion/Reveal';
import { BandeauImage } from '@/components/ui/BandeauImage';
import { Button } from '@/components/ui/Button';
import { Encart, Filet, TitreSection } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { histoire } from '@/data/galerie';
import { contact, site, lignesAdresse } from '@/data/site';

export const metadata: Metadata = {
  title: 'À propos — l’institut, l’équipe, les produits',
  description:
    `Qui est ${site.name}, comment on travaille, quels produits on utilise, et ce qui ` +
    'distingue nos quatre formules de hammam.',
  alternates: { canonical: '/a-propos' },
};

// =====================================================================
//  À propos.
//
//  ⚠️  Cette page contient plusieurs [placeholder] : l'histoire de la
//      maison, les dates, la composition de l'équipe. Ce sont des faits
//      que seul Hamza peut fournir. Ils sont marqués visiblement plutôt
//      qu'inventés — un « depuis 2015 » faux est une affirmation
//      commerciale mensongère, et se vérifie en trente secondes.
//      Liste complète dans PROGRESS.md §11.
// =====================================================================

const PRODUITS = [
  {
    nom: 'Huile d’argan',
    texte: 'Pressée à froid, cosmétique, non torréfiée. Pour les massages et l’après-soin.',
    icone: 'goutte' as const,
  },
  {
    nom: 'Savon noir',
    texte: 'À l’huile d’olive. La base du gommage au gant de kessa.',
    icone: 'lotus' as const,
  },
  {
    nom: 'Ghassoul',
    texte: 'L’argile du Moyen Atlas. Elle lave sans détergent et resserre les pores.',
    icone: 'feuille' as const,
  },
  {
    nom: 'Eau de rose',
    texte: 'De Kelâat M’Gouna. Elle apaise et referme le soin.',
    icone: 'etincelle' as const,
  },
];

// Une etape n'est « redigee » que si ni son annee ni son texte ne sont
// encore des gabarits entre crochets.
const etapesRedigees = histoire.filter(
  (e) => !/\[[^\]]*\]/.test(e.annee) && !/\[[^\]]*\]/.test(e.texte),
);

export default function PageAPropos() {
  return (
    <>
      <EnTetePage
        surtitre="La maison"
        titre={
          <>
            Un lieu à taille <span className="italic text-champagnesoft">humaine</span>
          </>
        }
        texte="Entre le spa d’hôtel et le hammam de quartier, il manquait quelque chose. C’est ce quelque chose qu’on essaie d’être."
        image="/bandeaux/institut.jpg"
        filAriane={[{ label: 'À propos' }]}
      />

      {/* ============ Le propos ============ */}
      <section className="bg-canvas py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <Reveal>
              <span className="surtitre">Pourquoi nous existons</span>
            </Reveal>

            <Reveal delai={0.06}>
              <h2 className="font-display text-[2.25rem] leading-[1.08] text-ink sm:text-[3rem]">
                On voulait un endroit où l’on <span className="italic text-champagne">connaît votre prénom</span>
              </h2>
            </Reveal>

            <Reveal delai={0.12}>
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                Dans un spa d’hôtel, on est un numéro de chambre. Dans un hammam de quartier, on
                est chez soi mais sans le confort. MAISON EVE essaie de tenir les deux : le
                soin de l’un, la simplicité de l’autre.
              </p>
            </Reveal>

            <Reveal delai={0.16}>
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                Concrètement : des séances qui durent le temps annoncé, des praticiennes qu’on
                retrouve d’un rendez-vous à l’autre, et des produits dont on peut dire d’où ils
                viennent.
              </p>
            </Reveal>

            <Reveal delai={0.2}>
              <Encart ton="info" titre="Cette page est en cours d’écriture">
                L’histoire détaillée de la maison, les dates et la présentation de l’équipe
                seront complétées prochainement. Nous préférons laisser la place vide plutôt
                que de la remplir avec des choses qui ne seraient pas vraies.
              </Encart>
            </Reveal>
          </div>

          <RevealVisuel className="relative aspect-[4/5] rounded-2xl">
            <Image
              src="/bandeaux/equipe.jpg"
              alt="L’équipe de MAISON EVE"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </RevealVisuel>
        </div>
      </section>

      {/* ============ Les étapes ============ */}
      {/* La frise ne s'affiche QUE si des etapes sont reellement redigees.
          Une frise pleine de « [annee] » et de « [a completer] » annonce au
          visiteur que le site n'est pas fini : c'est pire que pas de frise. */}
      {etapesRedigees.length > 0 && (
      <section className="bg-canvas2 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <TitreSection
            surtitre="Notre parcours"
            titre={
              <>
                Les <span className="italic text-champagne">étapes</span>
              </>
            }
            className="mx-auto max-w-2xl"
          />

          <RevealGroup intervalle={0.09} className="mx-auto mt-14 flex max-w-3xl flex-col">
            {etapesRedigees.map((e) => (
              <RevealItem key={e.titre}>
                <div className="flex gap-6 border-b border-line py-7 last:border-0">
                  <span className="w-24 shrink-0 font-display text-2xl text-champagne">
                    {e.annee}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-2xl text-ink">{e.titre}</h3>
                    <p className="text-sm leading-relaxed text-muted">{e.texte}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      )}

      <Promesses />

      {/* ============ Les produits ============ */}
      <section className="bg-canvas py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <TitreSection
            surtitre="Ce qu’on utilise"
            titre={
              <>
                Quatre produits, <span className="italic text-champagne">et c’est tout</span>
              </>
            }
            texte="Pas de gamme à rallonge. Ce qui marche, on le garde ; le reste, on s’en passe."
            className="mx-auto max-w-2xl"
          />

          <RevealGroup
            intervalle={0.07}
            className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PRODUITS.map((p) => (
              <RevealItem key={p.nom} className="h-full">
                <div className="carte flex h-full flex-col gap-3 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas2 text-champagne">
                    <Icon nom={p.icone} taille={21} />
                  </span>
                  <h3 className="font-display text-xl text-ink">{p.nom}</h3>
                  <p className="text-sm leading-relaxed text-muted">{p.texte}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mx-auto mt-14 max-w-2xl">
            <Filet />
          </div>

          <Reveal className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-5 text-center">
            <p className="font-display text-2xl leading-snug text-ink sm:text-[1.75rem]">
              Une allergie, une grossesse, un traitement en cours ? Dites-le à la réservation.
              On adapte le soin, ou on vous oriente vers un autre.
            </p>
            <Button href="/contact" variante="secondaire" fleche>
              Nous poser une question
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ============ Nous trouver ============ */}
      <BandeauImage src="/bandeaux/contact.jpg" hauteur="moyen" align="gauche">
        <Reveal className="max-w-xl">
          <span className="surtitre text-champagnesoft">Nous trouver</span>
          <h2 className="mt-5 font-display text-[2.25rem] leading-[1.1] text-onshell sm:text-[3rem]">
            Nous trouver à <span className="italic text-champagnesoft">{contact.city}</span>
          </h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-onshell">
            {lignesAdresse().join(', ')}. Ouvert tous les jours de 10h à 20h.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/contact" variante="clair" fleche>
              Nous contacter
            </Button>
            <Button
              href="/reservation"
              variante="fantome"
              className="text-onshell ring-1 ring-inset ring-onshellmuted/35 hover:bg-white/10"
            >
              Réserver
            </Button>
          </div>
        </Reveal>
      </BandeauImage>

      <AppelReservation />
    </>
  );
}
