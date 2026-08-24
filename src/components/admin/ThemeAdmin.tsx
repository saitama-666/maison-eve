'use client';

import { flushSync } from 'react-dom';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// =====================================================================
//  Bascule clair / sombre du back-office.
//
//  La VITRINE reste toujours claire : le crème et le champagne SONT
//  l'identité de la marque. Un back-office, lui, se consulte parfois des
//  heures d'affilée, souvent le soir — d'où le mode sombre, ici seulement.
//
//  ⚠️  TROIS PIÈGES DÉJÀ RENCONTRÉS SUR L'AUTRE PROJET, à ne pas
//      réintroduire :
//
//  1. LE FOURNISSEUR SE MONTE DANS `admin/layout.tsx`, JAMAIS DANS
//     `CadreAdmin`. `CadreAdmin` renvoie un écran de chargement tant que
//     les droits ne sont pas vérifiés ; s'il portait le fournisseur,
//     chaque rotation de jeton le démonterait, effacerait `data-theme`
//     et renverrait la page en clair au milieu du travail.
//
//  2. `localStorage` FAIT FOI, pas l'attribut `data-theme`. L'attribut
//     peut être effacé par un démontage ; la clé, non.
//
//  3. NE JAMAIS ANIMER LA BASCULE PAR UNE TRANSITION CSS SUR `*`. Mesuré
//     sur l'autre projet : 341–449 ms de recalcul bloquant contre
//     59–111 ms sans, parce que l'immense majorité des éléments d'une
//     page n'a aucune couleur à changer. On utilise l'API View
//     Transitions, qui fond deux textures sur le GPU : le coût ne dépend
//     plus de la taille de la page.
// =====================================================================

type Theme = 'clair' | 'sombre';

type Contexte = {
  theme: Theme;
  basculer: () => void;
};

const ThemeContext = createContext<Contexte | null>(null);

const CLE = 'maison-eve-admin-theme';

export function ThemeAdmin({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('clair');

  // Lecture de la préférence au montage. On ne la lit PAS pendant le
  // rendu : `localStorage` n'existe pas sur le serveur, et lire une
  // valeur différente entre serveur et navigateur casse l'hydratation.
  useEffect(() => {
    try {
      const stocke = window.localStorage.getItem(CLE);
      const initial: Theme =
        stocke === 'sombre' || stocke === 'clair'
          ? stocke
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'sombre'
            : 'clair';

      setTheme(initial);
      document.documentElement.setAttribute('data-admin-theme', initial);
    } catch {
      // Navigation privée stricte : `localStorage` peut lever. On reste
      // en clair, ce qui est toujours lisible.
    }

    return () => {
      // On retire l'attribut en quittant l'administration : sinon un
      // retour vers la boutique garderait le thème sombre.
      document.documentElement.removeAttribute('data-admin-theme');
    };
  }, []);

  const basculer = useCallback(() => {
    const suivant: Theme = theme === 'clair' ? 'sombre' : 'clair';

    const appliquer = () => {
      // `flushSync` force React à appliquer le changement AVANT que
      // l'API View Transitions ne prenne son instantané. Sans lui, le
      // rendu arrive après la capture et rien ne se fond.
      flushSync(() => {
        setTheme(suivant);
        document.documentElement.setAttribute('data-admin-theme', suivant);
      });
    };

    try {
      window.localStorage.setItem(CLE, suivant);
    } catch {
      // Sans persistance, la bascule marche quand même pour la session.
    }

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };

    // Repli instantané si l'API manque (Firefox, Safari anciens) ou si la
    // personne demande moins de mouvement.
    if (
      typeof doc.startViewTransition !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      appliquer();
      return;
    }

    doc.startViewTransition(appliquer);
  }, [theme]);

  const valeur = useMemo(() => ({ theme, basculer }), [theme, basculer]);

  return <ThemeContext.Provider value={valeur}>{children}</ThemeContext.Provider>;
}

export function useThemeAdmin(): Contexte {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeAdmin doit être utilisé à l’intérieur de <ThemeAdmin>.');
  }
  return ctx;
}
