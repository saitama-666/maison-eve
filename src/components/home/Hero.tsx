import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
//  Deux choses inchangées, et importantes :
//   · L'arrivée du texte est en CSS pur (`.arrivee`). Le titre ne doit
//     pas attendre qu'une librairie boote.
//   · La photo est `priority` : c'est le plus grand élément visible sans
//     défiler, donc la mesure de performance en dépend directement.
// =====================================================================

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* --- Photo --- */}
      {/*
        ⚠️  PAS DE `-z-10` ICI. Ne jamais le remettre.

        Ce conteneur portait `-z-10`. Aucun ancêtre entre lui et `<html>`
        ne crée de contexte d'empilement, donc le `-10` remontait jusqu'à
        la RACINE — où il était peint avant les blocs en flux, dont
        l'enveloppe `Chrome` et son fond crème OPAQUE (`bg-canvas`).

        Résultat : la photo et son voile sombre étaient dessinés, puis
        entièrement recouverts par le crème. Toutes les bandes photo du
        site étaient invisibles, et le texte clair prévu pour être posé
        dessus se retrouvait sur du crème — illisible.

        La règle : le fond reste en flux normal (`z-0`), et c'est le
        CONTENU qu'on remonte (`relative z-10`). Aucun empilement négatif,
        donc aucune dépendance à un contexte d'empilement d'ancêtre.
      */}
      <div className="parallaxe-fond absolute inset-0 z-0">
        <Image
          src="/bandeaux/accueil.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="voile absolute inset-0" />
      </div>

      {/* --- Contenu --- */}
      <div className="arrivee relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 pb-20 pt-28 text-center sm:px-8 sm:pb-24 sm:pt-32">
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

        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:mt-9 sm:w-auto sm:flex-row">
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

      {/* --- Invitation à défiler ---
          Purement décorative, donc `aria-hidden` : l'information qu'elle
          porte est déjà donnée par la page elle-même. Masquée sur les
          petits écrans, où elle chevauchait les boutons. */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
      >
        <span className="text-[0.625rem] uppercase tracking-[0.3em] text-onshell">
          Découvrir
        </span>
        <span className="animate-float text-champagnesoft">
          <Icon nom="chevron-bas" taille={18} />
        </span>
      </div>
    </section>
  );
}
