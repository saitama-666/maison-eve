'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useThemeAdmin } from '@/components/admin/ThemeAdmin';
import { EcranChargement } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon, type NomIcone } from '@/components/ui/Icon';
import { LogoLigne } from '@/components/ui/Logo';
import { navAdmin } from '@/data/site';
import { useAuth } from '@/lib/auth-context';
import { cn, initiales } from '@/lib/utils';

// =====================================================================
//  Cadre du back-office : garde d'accès + barre latérale.
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
// =====================================================================

const ICONES: Record<string, NomIcone> = {
  '/admin': 'tableau',
  '/admin/reservations': 'calendrier',
  '/admin/soins': 'lotus',
  '/admin/clients': 'utilisateur',
  '/admin/messages': 'email',
};

export function CadreAdmin({ children }: { children: ReactNode }) {
  const { user, profil, isAdmin, chargement, chargementDroits, deconnexion } = useAuth();
  const { theme, basculer } = useThemeAdmin();
  const router = useRouter();
  const chemin = usePathname();

  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    if (chargement || chargementDroits) return;
    if (!user) {
      router.replace(`/connexion?suite=${encodeURIComponent(chemin)}`);
      return;
    }
    if (!isAdmin) router.replace('/');
  }, [chargement, chargementDroits, user, isAdmin, router, chemin]);

  useEffect(() => {
    setMenuOuvert(false);
  }, [chemin]);

  if (chargement || chargementDroits) {
    return <EcranChargement message="Vérification des droits…" />;
  }
  if (!user || !isAdmin) {
    return <EcranChargement message="Redirection…" />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ============ Barre latérale ============ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line bg-card transition-transform duration-[240ms] ease-out lg:translate-x-0',
          menuOuvert ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
          <Link href="/admin" className="transition-opacity duration-[140ms] hover:opacity-70">
            <LogoLigne />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-canvas2 lg:hidden"
          >
            <Icon nom="fermer" taille={17} />
          </button>
        </div>

        <nav aria-label="Administration" className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {navAdmin.map((l) => {
              const actif = l.exact ? chemin === l.href : chemin.startsWith(l.href);

              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={actif ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-[140ms]',
                      actif ? 'text-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {/* Fond du lien actif. Il glissait d'un lien a l'autre
                        via un `layoutId` Framer ; les liens ont des largeurs
                        differentes, donc pas d'equivalent CSS simple. Il se
                        pose directement : le lien actif reste identifiable,
                        ce qui est ce que ce fond doit garantir. */}
                    {actif && (
                      <span aria-hidden className="absolute inset-0 rounded-lg bg-canvas2" />
                    )}
                    <Icon
                      nom={ICONES[l.href] ?? 'tableau'}
                      taille={17}
                      className={cn('relative z-10', actif && 'text-champagne')}
                    />
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* --- Pied de barre --- */}
        <div className="shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagnepale font-display text-sm text-champagne">
              {initiales(profil?.firstName, profil?.lastName, 'A')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">
                {profil?.firstName || 'Administration'}
              </p>
              <p className="truncate text-xs text-faint">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await deconnexion();
              router.push('/');
            }}
            className="mt-1 inline-flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-danger"
          >
            <Icon nom="sortie" taille={17} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Voile derriere la barre, sur mobile. Purement decoratif : il ne
          porte aucun contenu, et sa zone de clic reste active meme si le
          fondu ne se joue pas. */}
      {menuOuvert && (
        <button
          onClick={() => setMenuOuvert(false)}
          aria-label="Fermer le menu"
          className="voile-admin fixed inset-0 z-40 bg-ink/45 lg:hidden"
        />
      )}

      {/* ============ Contenu ============ */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas/92 px-5 backdrop-blur-md sm:px-7">
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors duration-[140ms] hover:bg-canvas2 lg:hidden"
          >
            <Icon nom="menu" taille={19} />
          </button>

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* --- Bascule de thème --- */}
            <button
              type="button"
              onClick={basculer}
              aria-label={theme === 'clair' ? 'Passer en mode sombre' : 'Passer en mode clair'}
              className="relative inline-flex h-9 w-16 items-center rounded-full bg-canvas2 px-1 ring-1 ring-inset ring-line transition-colors duration-[140ms] hover:ring-champagne"
            >
              {/* La poignee glissait par mesure de position (`layout`).
                  Sa position finale est deja portee par `translate-x-7` :
                  une transition CSS suffit, et sans elle la poignee est
                  simplement deja du bon cote. */}
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full bg-card text-champagne shadow-soft',
                  'transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  theme === 'sombre' && 'translate-x-7',
                )}
              >
                <Icon nom={theme === 'clair' ? 'etincelle' : 'goutte'} taille={14} />
              </span>
            </button>

            <Button href="/" variante="fantome" taille="sm">
              Voir le site
            </Button>
          </div>
        </header>

        {/* Remonte a chaque changement de page (`key`) : `.surgir` rejoue.
            Il partait de `opacity: 0` : quand la boucle d'animation ne
            tournait pas, TOUT le back-office arrivait invisible. */}
        <main key={chemin} className="surgir min-w-0 flex-1 p-5 sm:p-7">
          {children}
        </main>
      </div>
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
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[2rem] leading-tight text-ink">{titre}</h1>
        {texte && <p className="text-sm text-muted">{texte}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
