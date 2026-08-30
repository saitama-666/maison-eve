'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MenuMobile } from '@/components/layout/MenuMobile';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LogoLigne } from '@/components/ui/Logo';
import { navPrincipale } from '@/data/site';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

// =====================================================================
//  En-tête.
//
//  Deux états :
//   · EN HAUT d'une page à bandeau photo → transparent, texte clair.
//   · DÈS QU'ON DÉFILE, ou sur une page sans bandeau → fond crème, texte
//     sombre, ombre légère.
//
//  Le basculement lit `window.scrollY` dans un écouteur passif, et ne
//  remet à jour l'état QUE si le booléen change. La différence compte :
//  React ne rerend pas à chaque pixel défilé, seulement au franchissement
//  du seuil.
//
//  L'en-tête est `fixed`. Le décalage du contenu est géré par les pages
//  elles-mêmes (`pt-*`), et non par une marge posée ici : les pages à
//  bandeau photo veulent que l'image passe SOUS l'en-tête.
// =====================================================================

/**
 * Pages dont le haut est un bandeau photo sombre.
 *
 * ⚠️  CETTE LISTE DOIT REFLÉTER LA RÉALITÉ. Sur ces pages, l'en-tête se
 *     rend en version CLAIRE (logo et liens crème) parce qu'il est posé
 *     sur une photo assombrie. Si une page y figure sans avoir de
 *     bandeau, le logo crème se retrouve sur le fond crème : mesuré à
 *     1,03 de contraste, c'est-à-dire invisible.
 *
 *     C'était le cas de `/reservation`, qui n'a jamais eu de bandeau.
 *     Et `/faq` en était absente alors qu'elle en a un.
 *
 *     Pour vérifier après un changement :
 *       grep -rln "EnTetePage\|<Hero" src/app --include=page.tsx
 */
const PAGES_BANDEAU = ['/', '/a-propos', '/soins', '/galerie', '/contact', '/faq'];

export function Header() {
  const chemin = usePathname();
  const { user, chargement } = useAuth();

  const [defile, setDefile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Un article du journal ou une fiche de soin a son propre bandeau ;
  // les pages de compte et d'authentification, non.
  const surBandeau =
    PAGES_BANDEAU.includes(chemin) ||
    chemin.startsWith('/soins/') ||
    chemin.startsWith('/journal');

  // Détection du défilement.
  //
  // Passait par `useScroll` + `useMotionValueEvent` de Framer, ce qui
  // tirait toute la librairie dans l'en-tête — donc sur CHAQUE page du
  // site. Un écouteur passif fait exactement le même travail : il ne
  // pilote pas d'animation, il ne fait que basculer un booléen.
  //
  // `{ passive: true }` promet au navigateur qu'on n'appellera pas
  // `preventDefault`, ce qui lui permet de continuer à faire défiler la
  // page sans attendre notre code.
  useEffect(() => {
    function surDefilement() {
      const suivant = window.scrollY > 24;
      setDefile((actuel) => (actuel === suivant ? actuel : suivant));
    }
    surDefilement(); // état correct dès l'arrivée, y compris si la page
                     // est restaurée à mi-hauteur par le navigateur.
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, []);

  // Le menu mobile se referme à chaque navigation : sans ça, il reste
  // ouvert par-dessus la nouvelle page.
  useEffect(() => {
    setMenuOuvert(false);
  }, [chemin]);

  const clair = surBandeau && !defile;

  return (
    <>
      {/*
        ⚠️  L'EN-TÊTE NE S'ANIME PLUS À L'ENTRÉE. Ne pas remettre.

        Il portait `initial={{ y: -80, opacity: 0 }}`. Framer écrivait donc
        `style="opacity:0;transform:translateY(-80px)"` dans le HTML du
        serveur : jusqu'à ce que la librairie ait démarré, la navigation
        était **invisible et incliquable**. En développement, ou sur une
        connexion moyenne, ça dure assez longtemps pour qu'on croie le site
        cassé — c'est exactement ce qui a été remonté.

        La navigation est la dernière chose qui doit dépendre de
        JavaScript. Elle est maintenant peinte avec le premier octet.
      */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[100] transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out',
          defile
            ? 'bg-canvas/92 shadow-soft backdrop-blur-md'
            : surBandeau
              ? 'bg-transparent'
              : 'bg-canvas',
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
          {/* --- Marque --- */}
          <Link
            href="/"
            aria-label="MAISON ZAHRA — retour à l’accueil"
            className="shrink-0 transition-opacity duration-[140ms] hover:opacity-70"
          >
            <LogoLigne ton={clair ? 'sombre' : 'clair'} />
          </Link>

          {/* --- Navigation --- */}
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navPrincipale.map((lien) => {
                const actif =
                  lien.href === '/' ? chemin === '/' : chemin.startsWith(lien.href);

                return (
                  <li key={lien.href}>
                    <Link
                      href={lien.href}
                      aria-current={actif ? 'page' : undefined}
                      className={cn(
                        'relative block rounded-full px-4 py-2 text-[0.8125rem] tracking-[0.06em] transition-colors duration-[140ms]',
                        clair
                          ? actif
                            ? 'text-onshell'
                            // Sur photo, `onshellmuted` tombe sous le seuil :
                            // la nuance entre actif et inactif est portee par
                            // la pastille de fond, pas par la couleur.
                            : 'text-onshell hover:text-champagnesoft'
                          : actif
                            ? 'text-ink'
                            : 'text-muted hover:text-ink',
                      )}
                    >
                      {/* Le fond actif GLISSE d'un onglet à l'autre grâce au
                          Il glissait d'un lien à l'autre via un `layoutId`
                          Framer. Les liens ont des largeurs différentes, donc
                          pas d'équivalent CSS simple : la pastille se pose
                          directement. Le lien actif reste identifiable, ce
                          qui est ce que la pastille doit garantir. */}
                      {actif && (
                        <span
                          aria-hidden
                          className={cn(
                            'absolute inset-0 rounded-full',
                            clair ? 'bg-white/14' : 'bg-canvas2',
                          )}
                        />
                      )}
                      <span className="relative z-10">{lien.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* --- Actions --- */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Le lien compte n'apparaît qu'une fois la session connue :
                afficher « Se connecter » puis basculer sur « Mon compte »
                une seconde plus tard donne l'impression d'un bug. */}
            {!chargement && (
              <Link
                href={user ? '/compte' : '/connexion'}
                aria-label={user ? 'Mon compte' : 'Se connecter'}
                className={cn(
                  'hidden h-10 w-10 items-center justify-center rounded-full transition-colors duration-[140ms] sm:inline-flex',
                  clair
                    ? 'text-onshell hover:bg-white/12 hover:text-champagnesoft'
                    : 'text-muted hover:bg-canvas2 hover:text-ink',
                )}
              >
                <Icon nom="utilisateur" taille={19} />
              </Link>
            )}

            {/* L'enveloppe porte la visibilite responsive, pas le bouton :
                voir l'avertissement en tete de Button.tsx. */}
            <span className="hidden sm:block">
              <Button
                href="/reservation"
                taille="sm"
                variante={clair ? 'clair' : 'principal'}
              >
                Réserver
              </Button>
            </span>

            {/* --- Bouton menu (mobile) ---
                `aria-controls` n'est posé QUE quand le menu est ouvert :
                `MenuMobile` renvoie `null` tant qu'il est fermé, donc
                `#menu-mobile` n'existe pas et la relation pointerait dans
                le vide. `aria-expanded` dit déjà l'état. */}
            <button
              type="button"
              onClick={() => setMenuOuvert((v) => !v)}
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOuvert}
              {...(menuOuvert ? { 'aria-controls': 'menu-mobile' } : {})}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-[140ms] lg:hidden',
                clair
                  ? 'text-onshell hover:bg-white/12'
                  : 'text-ink hover:bg-canvas2',
              )}
            >
              {/* Deux traits qui se croisent — le même élément devient une
                  croix, donc le geste est continu. */}
              <span aria-hidden className="relative block h-4 w-5">
                <span
                  className={cn(
                    'absolute left-0 block h-px w-5 bg-current',
                    'transition-[top,transform] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    menuOuvert ? 'top-[7px] rotate-45' : 'top-[2px] rotate-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 block h-px w-5 bg-current',
                    'transition-[top,transform] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    menuOuvert ? 'top-[7px] -rotate-45' : 'top-[12px] rotate-0',
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Filet de séparation, visible seulement en état « défilé ».
            Toujours monté : seule son échelle horizontale change, ce qui
            lui permet de s'ouvrir ET de se refermer sans `AnimatePresence`.
            Décoratif et `aria-hidden` — s'il ne s'anime pas, il est
            simplement présent ou absent, sans conséquence. */}
        <div
          aria-hidden
          className={cn(
            'h-px origin-center bg-line transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
            defile ? 'scale-x-100' : 'scale-x-0',
          )}
        />
      </header>

      <MenuMobile ouvert={menuOuvert} fermer={() => setMenuOuvert(false)} />
    </>
  );
}
