'use client';

import type { ReactNode } from 'react';

import type { Article } from '@/data/journal';
import type { Categorie, Service } from '@/data/services';
import { AuthProvider } from '@/lib/auth-context';
import { CatalogueProvider } from '@/lib/catalogue-context';
import { ToastProvider } from '@/lib/toast';

// =====================================================================
//  Fournisseurs de contexte, en un seul endroit.
//
//  L'ORDRE COMPTE :
//   · `ToastProvider` en premier (le plus extérieur) : les deux autres
//     doivent pouvoir afficher un message, l'inverse n'est jamais vrai.
//   · `AuthProvider` ensuite : le catalogue ne dépend pas de la session,
//     mais des composants qui consomment le catalogue consultent souvent
//     la session dans le même rendu.
//   · `CatalogueProvider` en dernier : il ne fait que porter des données
//     déjà chargées par le serveur, il ne déclenche rien.
// =====================================================================

export function Providers({
  services,
  categories,
  articles,
  children,
}: {
  services: readonly Service[];
  categories: readonly Categorie[];
  articles: readonly Article[];
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CatalogueProvider services={services} categories={categories} articles={articles}>
          {children}
        </CatalogueProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
