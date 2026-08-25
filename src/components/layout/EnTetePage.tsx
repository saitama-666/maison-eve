import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  En-tête de page intérieure.
//
//  Le fil d'Ariane est un vrai `<nav aria-label="Fil d'Ariane">` avec une
//  liste ordonnée : les lecteurs d'écran annoncent alors la profondeur.
//
//  ⚠️  DEUX DISPOSITIONS, ET « côté » EST LA VALEUR PAR DÉFAUT.
//
//      « plein » pose le texte SUR la photo, derrière un voile sombre.
//      C'était la seule disposition. Elle exige une photo large : nos
//      visuels sont en portrait, et un portrait recadré dans un bandeau
//      très large perd environ 68 % de sa hauteur. L'arche, le plafond,
//      la composition — tout disparaissait, et le voile devait encore
//      assombrir ce qu'il restait pour que le titre reste lisible.
//
//      « côté » met l'image DANS SA PROPRE COLONNE et le texte sur un
//      fond uni à côté. Deux gains, pas un :
//        · l'image est montrée presque entière ;
//        · le texte n'est plus jamais sur une photo, donc le contraste
//          ne dépend plus de ce que la photo contient. C'est la seule
//          façon de le rendre structurellement sûr.
//
//      Le fond reste SOMBRE (`bg-shelldeep`) : les couleurs de texte ne
//      changent pas d'une disposition à l'autre, et nos images claires
//      ressortent par opposition.
// =====================================================================

export function EnTetePage({
  surtitre,
  titre,
  texte,
  image = '/bandeaux/relaxation.svg',
  filAriane,
  action,
  hauteur = 'moyen',
  disposition = 'cote',
  alt = '',
}: {
  surtitre?: string;
  titre: ReactNode;
  texte?: string;
  image?: string;
  filAriane?: readonly { label: string; href?: string }[];
  action?: ReactNode;
  hauteur?: 'court' | 'moyen';
  disposition?: 'cote' | 'plein';
  alt?: string;
}) {
  const contenu = (
    <>
      {filAriane && filAriane.length > 0 && (
        <nav aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-onshell">
            <li>
              <Link href="/" className="transition-colors duration-[140ms] hover:text-champagnesoft">
                Accueil
              </Link>
            </li>
            {filAriane.map((f) => (
              <li key={f.label} className="flex items-center gap-1.5">
                <Icon nom="chevron-droite" taille={11} className="opacity-45" />
                {f.href ? (
                  <Link
                    href={f.href}
                    className="transition-colors duration-[140ms] hover:text-champagnesoft"
                  >
                    {f.label}
                  </Link>
                ) : (
                  <span className="text-onshell" aria-current="page">
                    {f.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {surtitre && <span className="surtitre mt-5 block text-champagnesoft">{surtitre}</span>}

      <h1
        className={cn(
          'mt-4 font-display leading-[1.05] text-onshell',
          disposition === 'plein'
            ? 'max-w-3xl text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem]'
            : 'text-[2.25rem] sm:text-[2.75rem] lg:text-[3.25rem]',
        )}
      >
        {titre}
      </h1>

      {texte && (
        <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-onshell">{texte}</p>
      )}

      {action && <div className="mt-8">{action}</div>}
    </>
  );

  // ------------------------------------------------------------------
  //  Disposition « côté » — l'image dans sa colonne, le texte à côté.
  // ------------------------------------------------------------------
  if (disposition === 'cote') {
    return (
      <section className="relative bg-shelldeep">
        <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[1fr_minmax(0,36%)]">
          {/*
            Le texte passe EN PREMIER dans le DOM : au clavier comme au
            lecteur d'écran, on arrive sur le fil d'Ariane et le titre,
            pas sur une image décorative. `lg:order-*` ne change que le
            rendu visuel.
          */}
          <div
            className={cn(
              'arrivee flex flex-col justify-center px-5 sm:px-8 lg:pr-14',
              hauteur === 'court'
                ? 'pb-12 pt-28 lg:min-h-[440px] lg:py-16'
                : 'pb-14 pt-32 lg:min-h-[580px] lg:py-20',
            )}
          >
            {contenu}
          </div>

          {/*
            L'image garde un rapport proche du portrait : en pleine
            largeur sur mobile, en colonne haute sur grand écran. Le
            recadrage résiduel ne mord que sur les bords, jamais sur le
            sujet.
          */}
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-full">
            <Image
              src={image}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 36vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------------
  //  Disposition « plein » — texte sur la photo, derrière un voile.
  // ------------------------------------------------------------------
  return (
    <section
      className={cn(
        'relative flex items-end overflow-hidden',
        hauteur === 'court' ? 'min-h-[340px] pb-12 pt-32' : 'min-h-[460px] pb-16 pt-36',
      )}
    >
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
      <div className="absolute inset-0 z-0">
        <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 voile" />
      </div>

      <div className="arrivee relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        {contenu}
      </div>
    </section>
  );
}
