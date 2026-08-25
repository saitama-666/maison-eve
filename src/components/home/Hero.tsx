import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { contact } from '@/data/site';

// =====================================================================
//  Bandeau d'accueil.
//
//  ⚠️  RÉÉCRIT — c'est un composant SERVEUR. Aucun JavaScript n'est
//      envoyé pour lui. Ne pas y remettre `useScroll`.
//
//  Version précédente : `motion.div` + `useScroll` + trois `useTransform`
//  pour la parallaxe et le fondu. Coût réel : un abonnement au défilement
//  et trois valeurs recalculées à chaque image, sur le fil principal, pour
//  le premier écran du site — celui qui doit justement s'afficher le plus
//  vite. Et le contenu attendait Framer pour devenir visible.
//
//  La parallaxe est maintenant en CSS (`.parallaxe-fond`, pilotée par
//  `animation-timeline: scroll()`), donc jouée par le compositeur. Là où
//  le navigateur ne sait pas faire, l'image est simplement fixe : on perd
//  un effet, jamais du contenu.
//
//  ⚠️  DEUX COLONNES, PLUS DE TEXTE SUR LA PHOTO.
//
//      Le titre était posé SUR la photo, derrière un voile sombre. Ça
//      obligeait à assombrir l'image pour que le texte reste lisible, et
//      le contraste dépendait de ce que la photo contenait — un pari
//      qu'on a déjà perdu une fois.
//
//      Nos visuels sont en portrait. Dans un bandeau plein écran, un
//      portrait perd l'essentiel de sa hauteur au recadrage. Ici, la
//      colonne image fait environ 46 % de la largeur pour toute la
//      hauteur de l'écran : le rapport se rapproche du portrait, et
//      l'image est montrée presque entière.
//
//      Le texte est sur `bg-shelldeep`, un fond UNI. Le contraste devient
//      une propriété du code, plus une propriété de la photo.
//
//  Deux choses inchangées, et importantes :
//   · L'arrivée du texte est en CSS pur (`.arrivee`). Le titre ne doit
//     pas attendre qu'une librairie boote.
//   · La photo est `priority` : c'est le plus grand élément visible sans
//     défiler, donc la mesure de performance en dépend directement.
// =====================================================================

export function Hero() {
  return (
    <section className="relative bg-shelldeep">
      <div className="mx-auto grid min-h-[100svh] max-w-[1400px] lg:grid-cols-[1fr_minmax(0,46%)]">
      {/* --- Contenu ---
          Premier dans le DOM : au clavier comme au lecteur d'écran, on
          rencontre le titre avant une image décorative. */}
      <div className="arrivee flex flex-col justify-center px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:pr-14">
        <span className="surtitre text-champagnesoft">
          Institut &amp; soins à domicile — {contact.city}
        </span>

        {/*
          C'est le <h1> de la page d'accueil : il porte le nom de la marque,
          ce qui est le bon choix pour un établissement local. Il doit rester
          ENFANT DIRECT de `.arrivee` — la cascade se fait par `:nth-child`,
          un conteneur intermédiaire la casserait.
        */}
        <h1 className="mt-5 sm:mt-6">
          <Logo ton="sombre" taille="xl" />
        </h1>

        <p className="mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-onshell sm:mt-7 sm:text-base">
          Massages, soins du visage et rituels du hammam. Des praticiennes diplômées,
          des produits naturels, et le choix de venir chez nous ou de nous recevoir chez vous.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row">
          <Button href="/reservation" variante="clair" taille="lg" fleche className="w-full sm:w-auto">
            Réserver un soin
          </Button>
          <Button
            href="/soins"
            taille="lg"
            variante="fantome"
            className="w-full text-onshell ring-1 ring-inset ring-onshellmuted/35 hover:bg-white/10 sm:w-auto"
          >
            Voir les soins
          </Button>
        </div>
      </div>

      {/* --- Photo, dans sa propre colonne ---
          `priority` : c'est le plus grand élément visible sans défiler.
          Sur mobile la colonne passe dessous, en portrait franc. */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-full">
        <Image
          src="/bandeaux/accueil.svg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 46vw"
          className="object-cover"
        />
      </div>
      </div>
    </section>
  );
}
