import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';

// =====================================================================
//  Cadre des écrans d'authentification.
//
//  Deux colonnes : le formulaire à gauche, un visuel à droite. Le visuel
//  disparaît sous 1024 px — sur un téléphone, il volerait la moitié de
//  l'écran au formulaire, qui est la seule chose à faire ici.
//
//  Ces pages n'ont ni en-tête ni pied de page (voir `Chrome.tsx`) : on
//  retire tout ce qui pourrait détourner de l'action en cours. Il reste
//  une seule sortie, le lien « retour au site », en haut à gauche.
//
//  ⚠️  AUCUNE ENTRÉE PILOTÉE PAR JAVASCRIPT ICI.
//      Le cadre utilisait `motion.div initial={{ opacity: 0 }}` : le
//      formulaire de connexion arrivait donc INVISIBLE dans le HTML du
//      serveur, en attendant que Framer démarre. C'est le même défaut que
//      celui corrigé sur toute la vitrine — et sur un écran de connexion,
//      il est encore moins acceptable.
//
//      L'entrée passe par `.arrivee` (CSS pur), qui n'anime que la
//      position : si l'animation ne se joue pas, tout reste lisible.
// =====================================================================

export function CadreAuth({
  titre,
  sousTitre,
  children,
  pied,
  visuel = '/bandeaux/institut.svg',
}: {
  titre: string;
  sousTitre: string;
  children: ReactNode;
  pied?: ReactNode;
  visuel?: string;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* ============ Formulaire ============ */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors duration-[140ms] hover:text-ink"
        >
          <Icon nom="fleche-gauche" taille={15} />
          Retour au site
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="arrivee w-full max-w-sm">
            <div className="flex justify-center lg:hidden">
              <Logo taille="md" />
            </div>

            <div className="mt-8 flex flex-col gap-2 text-center lg:mt-0 lg:text-left">
              <h1 className="font-display text-[2.25rem] leading-tight text-ink">{titre}</h1>
              <p className="text-sm leading-relaxed text-muted">{sousTitre}</p>
            </div>

            <div className="mt-8">{children}</div>

            {pied && <div className="mt-7 text-center text-sm text-muted">{pied}</div>}
          </div>
        </div>
      </div>

      {/* ============ Visuel ============ */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0">
          <Image src={visuel} alt="" fill priority sizes="50vw" className="object-cover" />
        </div>

        <div className="absolute inset-0 voile" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="arrivee">
            <Logo ton="sombre" taille="lg" />

            <p className="mx-auto mt-8 max-w-xs text-[0.9375rem] leading-relaxed text-onshell">
              Retrouvez vos rendez-vous, vos adresses et vos soins favoris — d’une visite à
              l’autre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Bouton « continuer avec Google ».
 *
 * Séparé du reste par un filet portant le mot « ou » : sans séparation
 * visuelle nette, on clique sur Google en croyant valider le formulaire.
 */
export function BoutonGoogle({
  onClick,
  chargement,
  texte = 'Continuer avec Google',
}: {
  onClick: () => void;
  chargement?: boolean;
  texte?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-faint">ou</span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={chargement}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-card text-sm text-ink ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-[140ms] ease-out hover:-translate-y-0.5 hover:ring-champagne active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon nom={chargement ? 'chargement' : 'google'} taille={18} className={chargement ? 'animate-spin' : ''} />
        {texte}
      </button>
    </div>
  );
}
