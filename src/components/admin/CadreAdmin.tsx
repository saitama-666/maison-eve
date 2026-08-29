'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useThemeAdmin } from '@/components/admin/ThemeAdmin';
import { EcranChargement } from '@/components/ui/Bits';
import { Icon, type NomIcone } from '@/components/ui/Icon';
import { LogoLigne } from '@/components/ui/Logo';
import { navAdmin } from '@/data/site';
import { useAuth } from '@/lib/auth-context';
import { cn, initiales } from '@/lib/utils';

// =====================================================================
//  Cadre du back-office : garde d'accès + navigation.
//
//  ⚠️  LA GARDE CI-DESSOUS N'EST PAS UNE PROTECTION.
//      Elle évite d'afficher une interface vide à quelqu'un qui n'a pas
//      les droits. Le rôle admin est vérifié TROIS fois, de façon
//      indépendante :
//        1. ici, pour l'affichage ;
//        2. dans chaque route `/api/admin`, via `requireAdmin()`, qui
//           revérifie le claim dans le jeton signé par Firebase ;
//        3. dans `firestore.rules`, qui refuse la lecture elle-même.
//      Forcer `isAdmin` dans la console du navigateur ne donne accès à
//      aucune donnée : les deux autres barrières tiennent.
//
//  On attend `chargementDroits` AVANT de rediriger. Sans cette attente,
//  tout administrateur serait éjecté à chaque rafraîchissement, le temps
//  que le jeton soit lu.
//
// =====================================================================
//  ⚠️  PLUS DE TIROIR LATÉRAL. NE PAS LE REMETTRE.
//
//      La version précédente cachait la navigation derrière un bouton
//      burger sous `lg`. Conséquence sur un téléphone — l'écran depuis
//      lequel on gère un institut entre deux clientes :
//
//        · DEUX GESTES pour changer de page : ouvrir le tiroir, puis
//          viser un lien. Sur cinq sections consultées en boucle, c'est
//          le double de gestes toute la journée.
//        · AUCUN REPÈRE : le tiroir fermé, rien ne dit où l'on est ni ce
//          qui existe à côté.
//        · 72 px d'en-tête consommés pour n'afficher qu'un burger.
//
//      Ici, deux formes pour une seule navigation :
//        · à partir de `lg`, des pastilles dans la barre du haut —
//          tout est visible, tout est à un clic ;
//        · en dessous, une BARRE D'ONGLETS EN BAS. Un seul geste, dans
//          la zone que le pouce atteint sans changer de prise, et la
//          section courante reste lisible en permanence.
//
//      La barre du bas est `fixed` : le contenu porte donc `pb-24` pour
//      ne pas finir dessous. Si on ajoute une sixième section, il faudra
//      revoir cette barre — cinq onglets est la limite lisible à 360 px.
// =====================================================================

const ICONES: Record<string, NomIcone> = {
  '/admin': 'tableau',
  '/admin/reservations': 'calendrier',
  '/admin/soins': 'lotus',
  '/admin/clients': 'utilisateur',
  '/admin/messages': 'email',
};

/**
 * Libelles courts, pour la barre du bas.
 *
 * Cinq onglets sur 375 px laissent ~70 px chacun. « Tableau de bord » et
 * « Rendez-vous » n'y tiennent pas : mesures, ils se coupaient en
 * « Rendez-vo… », ce qui ne veut plus rien dire. Chaque libelle ici doit
 * tenir ENTIER — un onglet tronque est pire qu'un onglet sans texte.
 */
const COURTS: Record<string, string> = {
  '/admin': 'Résumé',
  '/admin/reservations': 'Agenda',
  '/admin/soins': 'Soins',
  '/admin/clients': 'Clientes',
  '/admin/messages': 'Messages',
};

function estActif(chemin: string, href: string, exact: boolean) {
  return exact ? chemin === href : chemin.startsWith(href);
}

export function CadreAdmin({ children }: { children: ReactNode }) {
  const { user, profil, isAdmin, chargement, chargementDroits, deconnexion } = useAuth();
  const router = useRouter();
  const chemin = usePathname();

  useEffect(() => {
    if (chargement || chargementDroits) return;
    if (!user) {
      router.replace(`/connexion?suite=${encodeURIComponent(chemin)}`);
      return;
    }
    if (!isAdmin) router.replace('/');
  }, [chargement, chargementDroits, user, isAdmin, router, chemin]);

  if (chargement || chargementDroits) {
    return <EcranChargement message="Vérification des droits…" />;
  }
  if (!user || !isAdmin) {
    return <EcranChargement message="Redirection…" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* ============ Barre du haut ============ */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/92 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/admin"
            className="shrink-0 transition-opacity duration-[140ms] hover:opacity-70"
          >
            <LogoLigne />
          </Link>

          <NavPastilles chemin={chemin} />

          <div className="ml-auto shrink-0 lg:ml-0">
            <MenuProfil
              nom={profil?.firstName || 'Administration'}
              email={user.email ?? ''}
              initiales={initiales(profil?.firstName, profil?.lastName, 'A')}
              deconnexion={async () => {
                await deconnexion();
                router.push('/');
              }}
            />
          </div>
        </div>
      </header>

      {/* ============ Contenu ============ */}
      {/* `pb-24` sous `lg` : la barre d'onglets est `fixed`, elle recouvrirait
          la fin de la page sans cette réserve. */}
      <main key={chemin} className="surgir min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:pb-10">
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </main>

      <NavOnglets chemin={chemin} />
    </div>
  );
}

/**
 * Navigation en pastilles — a partir de `lg`.
 *
 * La pastille active porte l'aplat JAUNE de la maquette, avec du texte
 * sombre dessus. Le groupe entier vit dans un cadre discret, ce qui le
 * detache de la barre sans avoir a le colorer.
 */
export function NavPastilles({ chemin }: { chemin: string }) {
  return (
    <nav aria-label="Administration" className="hidden flex-1 justify-center lg:flex">
      <ul className="flex items-center gap-1 rounded-full border border-line bg-card p-1">
        {navAdmin.map((l) => {
          const actif = estActif(chemin, l.href, l.exact);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-[140ms]',
                  actif
                    ? 'bg-champagnepale font-medium text-ink'
                    : 'text-muted hover:bg-canvas2 hover:text-ink',
                )}
              >
                <Icon nom={ICONES[l.href] ?? 'tableau'} taille={16} />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Barre d'onglets du bas — en dessous de `lg`.
 *
 * `fixed` : le contenu doit donc reserver `pb-24`, sinon sa fin passe
 * dessous. `env(safe-area-inset-bottom)` tient compte de la barre
 * gestuelle des iPhone recents.
 */
export function NavOnglets({ chemin }: { chemin: string }) {
  return (
    <nav
      aria-label="Administration"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {navAdmin.map((l) => {
          const actif = estActif(chemin, l.href, l.exact);
          return (
            <li key={l.href} className="min-w-0 flex-1">
              <Link
                href={l.href}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'flex h-full min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-[140ms]',
                  actif ? 'text-champagne' : 'text-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-[140ms]',
                    actif && 'bg-champagnepale',
                  )}
                >
                  <Icon nom={ICONES[l.href] ?? 'tableau'} taille={18} />
                </span>
                <span className="w-full truncate text-center text-[0.6875rem] leading-none">
                  {COURTS[l.href] ?? l.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------
//  Menu du compte.
//
//  Il porte ce qui n'a pas sa place dans la navigation : l'identité, la
//  bascule de thème, le retour au site et la déconnexion. Sur mobile,
//  c'est le seul endroit où les trouver — la barre du bas est réservée
//  aux sections.
// ---------------------------------------------------------------------
function MenuProfil({
  nom,
  email,
  initiales: init,
  deconnexion,
}: {
  nom: string;
  email: string;
  initiales: string;
  deconnexion: () => void | Promise<void>;
}) {
  const { theme, basculer } = useThemeAdmin();
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  // Fermeture au clic dehors et à Échap. Sans ça, le menu reste ouvert
  // derrière la page suivante.
  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvert(false);
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    document.addEventListener('mousedown', auClic);
    document.addEventListener('keydown', auClavier);
    return () => {
      document.removeEventListener('mousedown', auClic);
      document.removeEventListener('keydown', auClavier);
    };
  }, [ouvert]);

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 ring-1 ring-inset ring-line transition-colors duration-[140ms] hover:bg-canvas2 sm:pr-3"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagnepale font-display text-sm text-champagne">
          {init}
        </span>
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[150px] truncate text-sm leading-tight text-ink">{nom}</span>
          <span className="max-w-[150px] truncate text-xs leading-tight text-faint">{email}</span>
        </span>
        <Icon nom="chevron-bas" taille={15} className="shrink-0 text-muted" />
      </button>

      {ouvert && (
        <div
          role="menu"
          className="carte absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[248px] overflow-hidden p-1.5 shadow-lift"
        >
          <div className="border-b border-linesoft px-3 pb-2.5 pt-2 sm:hidden">
            <p className="truncate text-sm text-ink">{nom}</p>
            <p className="truncate text-xs text-faint">{email}</p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={basculer}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
          >
            <Icon nom={theme === 'clair' ? 'goutte' : 'etincelle'} taille={17} />
            {theme === 'clair' ? 'Mode sombre' : 'Mode clair'}
          </button>

          <Link
            href="/"
            role="menuitem"
            onClick={() => setOuvert(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
          >
            <Icon nom="maison" taille={17} />
            Voir le site
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOuvert(false);
              void deconnexion();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-danger"
          >
            <Icon nom="sortie" taille={17} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

/** En-tête d'une page du back-office. */
export function TitreAdmin({
  titre,
  texte,
  action,
}: {
  titre: string;
  texte?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[1.75rem] leading-tight text-ink sm:text-[2rem]">
          {titre}
        </h1>
        {texte && <p className="text-sm text-muted">{texte}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
