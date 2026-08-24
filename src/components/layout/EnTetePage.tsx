import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// =====================================================================
//  Bandeau de titre des pages intérieures.
//
//  C'est ici que vit l'ARRIVÉE de la page — une seule par page, en haut.
//  Elle est écrite en CSS (`.arrivee`, cascade par `:nth-child`) et non
//  en JavaScript : c'est le texte le plus important de la page, il ne
//  doit pas rester invisible en attendant qu'une librairie démarre.
//
//  D'où la contrainte : les enfants directs du bloc `.arrivee` sont
//  animés dans l'ordre du DOM. Ne pas y insérer de conteneur
//  intermédiaire, sinon toute la cascade se joue en une seule fois.
//
//  Le fil d'Ariane est un vrai `<nav aria-label="Fil d'Ariane">` avec une
//  liste ordonnée : les lecteurs d'écran annoncent alors la profondeur.
// =====================================================================

export function EnTetePage({
  surtitre,
  titre,
  texte,
  image = '/bandeaux/relaxation.svg',
  filAriane,
  action,
  hauteur = 'moyen',
}: {
  surtitre?: string;
  titre: ReactNode;
  texte?: string;
  image?: string;
  filAriane?: readonly { label: string; href?: string }[];
  action?: ReactNode;
  hauteur?: 'court' | 'moyen';
}) {
  return (
    <section
      className={cn(
        'relative flex items-end overflow-hidden',
        hauteur === 'court' ? 'min-h-[340px] pb-12 pt-32' : 'min-h-[460px] pb-16 pt-36',
      )}
    >
      {/* --- Visuel --- */}
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
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 voile" />
      </div>

      <div className="arrivee relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        {filAriane && filAriane.length > 0 && (
          <nav aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-onshell">
              <li>
                <Link href="/" className="transition-colors duration-[140ms] hover:text-onshell">
                  Accueil
                </Link>
              </li>
              {filAriane.map((f) => (
                <li key={f.label} className="flex items-center gap-1.5">
                  <Icon nom="chevron-droite" taille={11} className="opacity-45" />
                  {f.href ? (
                    <Link href={f.href} className="transition-colors duration-[140ms] hover:text-onshell">
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

        <h1 className="mt-4 max-w-3xl font-display text-[2.5rem] leading-[1.05] text-onshell sm:text-[3.25rem] lg:text-[4rem]">
          {titre}
        </h1>

        {texte && (
          <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-onshell">
            {texte}
          </p>
        )}

        {action && <div className="mt-8">{action}</div>}
      </div>
    </section>
  );
}
