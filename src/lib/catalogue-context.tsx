'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { Categorie, Service } from '@/data/services';
import type { Article } from '@/data/journal';

// =====================================================================
//  Catalogue injecté par le serveur.
//
//  Le serveur lit Firestore une fois (`src/lib/catalogue.ts`) et pose le
//  résultat ici. Les composants clients le consomment SANS refaire de
//  requête : pas de deuxième aller-retour, pas de clignotement, pas de
//  lecture Firestore facturée par visiteur.
// =====================================================================

type Contenu = {
  services: readonly Service[];
  categories: readonly Categorie[];
  articles: readonly Article[];
};

const CatalogueContext = createContext<Contenu | null>(null);

export function CatalogueProvider({
  services,
  categories,
  articles,
  children,
}: Contenu & { children: ReactNode }) {
  const valeur = useMemo(
    () => ({ services, categories, articles }),
    [services, categories, articles],
  );
  return <CatalogueContext.Provider value={valeur}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): Contenu {
  const ctx = useContext(CatalogueContext);
  if (!ctx) {
    throw new Error('useCatalogue doit être utilisé à l’intérieur de <CatalogueProvider>.');
  }
  return ctx;
}

/** Soins actifs, triés. */
export function useServices(): readonly Service[] {
  const { services } = useCatalogue();
  return useMemo(() => services.filter((s) => s.actif), [services]);
}

export function useService(slug: string): Service | undefined {
  const services = useServices();
  return useMemo(() => services.find((s) => s.slug === slug), [services, slug]);
}
