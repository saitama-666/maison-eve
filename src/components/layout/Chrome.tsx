'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

// =====================================================================
//  Habillage du site : en-tête + pied de page.
//
//  Il s'efface sur trois familles de pages qui ont leur propre mise en
//  page plein écran :
//   · l'authentification (`/connexion`, `/inscription`…) — écran partagé
//     en deux, aucune navigation, pour ne pas distraire du formulaire ;
//   · le back-office (`/admin`) — barre latérale propre ;
//   · le tunnel de réservation, qui garde l'en-tête mais retire le pied de
//     page : une fois engagé, on ne propose pas dix sorties.
//
//  Ce composant est le SEUL endroit qui décide de ça. Sans lui, chaque
//  page devrait connaître l'existence de l'en-tête — et une page finirait
//  par l'oublier.
// =====================================================================

const SANS_HABILLAGE = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

export function Chrome({ children }: { children: ReactNode }) {
  const chemin = usePathname();

  const nu = SANS_HABILLAGE.includes(chemin) || chemin.startsWith('/admin');
  const sansPied = chemin.startsWith('/reservation');

  if (nu) {
    return <main id="contenu">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      {!sansPied && <Footer />}
    </div>
  );
}
