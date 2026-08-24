// =====================================================================
//  Jeu d'icônes.
//
//  Dessinées à la main, pas de librairie : une icône SVG de 20 lignes ne
//  justifie pas 300 Ko de dépendance, et le trait reste cohérent avec la
//  typographie fine du site.
//
//  Toutes partagent le même gabarit : viewBox 24, trait 1.5, extrémités
//  arrondies, `currentColor`. Elles héritent donc de la couleur du texte
//  et se colorent par une simple classe Tailwind.
//
//  Accessibilité : `aria-hidden` par défaut. Une icône est décorative
//  sauf si elle porte seule le sens — dans ce cas, passer un `titre`,
//  ce qui bascule l'élément en `role="img"` avec un nom accessible.
// =====================================================================

export type NomIcone =
  | 'menu' | 'fermer' | 'recherche' | 'fleche-droite' | 'fleche-gauche'
  | 'chevron-bas' | 'chevron-droite' | 'etoile' | 'telephone' | 'email'
  | 'position' | 'horloge' | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'
  | 'check' | 'utilisateur' | 'calendrier' | 'maison' | 'feuille' | 'diplome'
  | 'etincelle' | 'plus' | 'moins' | 'coeur' | 'poubelle' | 'crayon'
  | 'sortie' | 'tableau' | 'info' | 'alerte' | 'chargement' | 'google'
  | 'oeil' | 'oeil-barre' | 'lotus' | 'goutte' | 'imprimer';

type Props = {
  nom: NomIcone;
  taille?: number;
  className?: string;
  /** Rend l'icône annoncée par les lecteurs d'écran. */
  titre?: string;
  trait?: number;
};

const CHEMINS: Record<NomIcone, React.ReactNode> = {
  menu: <><path d="M3.5 7h17" /><path d="M3.5 12h17" /><path d="M3.5 17h17" /></>,
  fermer: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  recherche: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  'fleche-droite': <><path d="M4 12h15.5" /><path d="M13.5 6l6 6-6 6" /></>,
  'fleche-gauche': <><path d="M20 12H4.5" /><path d="M10.5 6l-6 6 6 6" /></>,
  'chevron-bas': <path d="M6 9.5l6 6 6-6" />,
  'chevron-droite': <path d="M9.5 6l6 6-6 6" />,
  etoile: (
    <path d="M12 3.6l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.99l-5.25 2.76 1-5.85L3.5 9.75l5.9-.85z" />
  ),
  telephone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
  ),
  email: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.6 7l8.4 6 8.4-6" /></>,
  position: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  horloge: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.2V12l3.2 2" /></>,
  whatsapp: (
    <><path d="M3.8 20.2l1.2-4A8.2 8.2 0 1 1 8 19.1l-4.2 1.1z" />
    <path d="M8.8 8.6c.3-.7.6-.7.9-.7h.7c.2 0 .5 0 .7.6l.8 2c.1.3 0 .5-.1.7l-.5.6c-.2.2-.3.4-.1.7a7 7 0 0 0 3.2 2.8c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.3.5.5v.7c0 .6-.5 1.2-1.1 1.3-.5.1-1.2.2-3.5-.8a11 11 0 0 1-5-4.8c-.7-1.4-.6-2.6-.5-3z" /></>
  ),
  instagram: (
    <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>
  ),
  facebook: <path d="M14.5 8.5h2.2V5.6h-2.6c-2.2 0-3.6 1.4-3.6 3.6v1.9H8.2v3h2.3v7.3h3.2v-7.3h2.4l.5-3h-2.9V9.5c0-.6.3-1 .8-1z" />,
  tiktok: (
    <><path d="M15 3.5v9.9a3.9 3.9 0 1 1-3.3-3.85" /><path d="M15 3.5a4.6 4.6 0 0 0 4.4 4" /></>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  utilisateur: <><circle cx="12" cy="8.4" r="3.9" /><path d="M4.5 20.2a7.7 7.7 0 0 1 15 0" /></>,
  calendrier: (
    <><rect x="3.5" y="5" width="17" height="15.5" rx="2.2" /><path d="M3.5 9.6h17" /><path d="M8.2 3.2v3.6" /><path d="M15.8 3.2v3.6" /></>
  ),
  maison: <><path d="M4 10.4L12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z" /><path d="M9.6 20.6v-6.2h4.8v6.2" /></>,
  feuille: <><path d="M20 4c0 8.5-4.6 13-11.5 13H5" /><path d="M5 20c0-6 3.5-10 10-11.5" /></>,
  diplome: (
    <><path d="M3.5 8.2L12 4l8.5 4.2L12 12.5z" /><path d="M7 10.4v4.4c0 1.6 2.2 2.9 5 2.9s5-1.3 5-2.9v-4.4" /><path d="M20.5 8.2v5" /></>
  ),
  etincelle: (
    <><path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7L12 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z" /><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>
  ),
  plus: <><path d="M12 5.5v13" /><path d="M5.5 12h13" /></>,
  moins: <path d="M5.5 12h13" />,
  coeur: <path d="M12 20.3l-1.3-1.2C6.1 15 3.2 12.4 3.2 9.2A4.7 4.7 0 0 1 7.9 4.5c1.6 0 3.1.75 4.1 1.95A5.4 5.4 0 0 1 16.1 4.5a4.7 4.7 0 0 1 4.7 4.7c0 3.2-2.9 5.8-7.5 9.9z" />,
  poubelle: (
    <><path d="M4.5 6.8h15" /><path d="M9.5 6.8V4.6h5v2.2" /><path d="M6.4 6.8l.9 12.1a1.7 1.7 0 0 0 1.7 1.6h6a1.7 1.7 0 0 0 1.7-1.6l.9-12.1" /></>
  ),
  crayon: <><path d="M15.6 4.9l3.5 3.5" /><path d="M4.5 19.5l.9-3.9L16.2 4.8a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3L8.4 18.6z" /></>,
  sortie: <><path d="M14.5 8V5.7a1.7 1.7 0 0 0-1.7-1.7H5.7A1.7 1.7 0 0 0 4 5.7v12.6A1.7 1.7 0 0 0 5.7 20h7.1a1.7 1.7 0 0 0 1.7-1.7V16" /><path d="M9.5 12h10.8" /><path d="M17.4 8.8l3.2 3.2-3.2 3.2" /></>,
  tableau: <><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" /><rect x="13" y="13" width="7.5" height="7.5" rx="1.6" /></>,
  info: <><circle cx="12" cy="12" r="8.6" /><path d="M12 11v5.2" /><circle cx="12" cy="8.1" r="1" fill="currentColor" stroke="none" /></>,
  alerte: <><path d="M12 3.8L21 19.5H3z" /><path d="M12 9.8v4.4" /><circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none" /></>,
  chargement: <><path d="M12 3.5v3.6" opacity=".9" /><path d="M12 16.9v3.6" opacity=".3" /><path d="M20.5 12h-3.6" opacity=".5" /><path d="M7.1 12H3.5" opacity=".7" /><path d="M18 6l-2.5 2.5" opacity=".8" /><path d="M8.5 15.5L6 18" opacity=".4" /><path d="M18 18l-2.5-2.5" opacity=".4" /><path d="M8.5 8.5L6 6" opacity=".6" /></>,
  google: (
    <><path d="M20.6 12.2c0-.6-.05-1.2-.15-1.75H12v3.35h4.85a4.15 4.15 0 0 1-1.8 2.7v2.25h2.9c1.7-1.55 2.65-3.85 2.65-6.55z" fill="currentColor" stroke="none" opacity=".9" />
    <path d="M12 21c2.4 0 4.45-.8 5.95-2.15l-2.9-2.25c-.8.55-1.85.85-3.05.85-2.35 0-4.35-1.6-5.05-3.7H3.95v2.3A9 9 0 0 0 12 21z" fill="currentColor" stroke="none" opacity=".7" />
    <path d="M6.95 13.75a5.4 5.4 0 0 1 0-3.45v-2.3H3.95a9 9 0 0 0 0 8.05z" fill="currentColor" stroke="none" opacity=".5" />
    <path d="M12 6.6c1.3 0 2.5.45 3.4 1.35l2.55-2.55A9 9 0 0 0 3.95 8l3 2.3c.7-2.1 2.7-3.7 5.05-3.7z" fill="currentColor" stroke="none" /></>
  ),
  oeil: <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  'oeil-barre': <><path d="M9.6 6.2A9.4 9.4 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3 3.8" /><path d="M6.4 7.9A16.6 16.6 0 0 0 2.5 12S6 18.2 12 18.2a9.6 9.6 0 0 0 3.6-.7" /><path d="M4 4l16 16" /></>,
  lotus: (
    <><path d="M12 5c1.9 1.6 2.9 3.6 2.9 5.9 0 2.4-1 4.4-2.9 6-1.9-1.6-2.9-3.6-2.9-6C9.1 8.6 10.1 6.6 12 5z" />
    <path d="M12 16.9c-2.6 1.5-5.3 1.3-8-.6 1-2.6 2.9-4 5.6-4.2" />
    <path d="M12 16.9c2.6 1.5 5.3 1.3 8-.6-1-2.6-2.9-4-5.6-4.2" /></>
  ),
  goutte: <path d="M12 3.5s5.6 6 5.6 9.8a5.6 5.6 0 1 1-11.2 0C6.4 9.5 12 3.5 12 3.5z" />,
  imprimer: <><path d="M7 9V4.5h10V9" /><rect x="3.8" y="9" width="16.4" height="7.5" rx="1.8" /><path d="M7 14h10v5.5H7z" /></>,
};

export function Icon({ nom, taille = 20, className, titre, trait = 1.5 }: Props) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trait}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={titre ? undefined : true}
      role={titre ? 'img' : undefined}
      focusable="false"
    >
      {titre ? <title>{titre}</title> : null}
      {CHEMINS[nom]}
    </svg>
  );
}
