'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { EcranChargement } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { navCompte } from '@/data/site';
import { useAuth } from '@/lib/auth-context';
import { cn, initiales } from '@/lib/utils';

// =====================================================================
//  Cadre de l'espace client : garde d'accès + navigation latérale.
//
//  ⚠️  CE N'EST PAS UNE PROTECTION.
//      Cette garde améliore l'expérience — elle évite d'afficher une page
//      vide à quelqu'un de déconnecté. La VRAIE protection est dans
//      `firestore.rules` : même en forçant l'affichage de cette page, on
//      ne lit aucune donnée qui ne nous appartient pas.
//      Ne jamais confondre les deux : une garde d'interface se contourne
//      avec les outils de développement en dix secondes.
//
//  L'ordre des états compte : on attend `chargement` AVANT de rediriger.
//  Rediriger pendant le chargement éjecterait toute personne connectée à
//  chaque rafraîchissement, le temps que Firebase réponde.
// =====================================================================

export function CadreCompte({ children }: { children: ReactNode }) {
  const { user, profil, chargement, deconnexion } = useAuth();
  const router = useRouter();
  const chemin = usePathname();

  useEffect(() => {
    if (chargement) return;
    if (!user) {
      // On mémorise où la personne allait, pour l'y ramener après.
      router.replace(`/connexion?suite=${encodeURIComponent(chemin)}`);
    }
  }, [chargement, user, router, chemin]);

  if (chargement) return <EcranChargement message="Vérification de votre session…" />;
  if (!user) return <EcranChargement message="Redirection…" />;

  const prenom = profil?.firstName ?? '';
  const nom = profil?.lastName ?? '';

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
        {/* ============ Barre latérale ============ */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          {/* --- Identité --- */}
          <div className="carte flex items-center gap-3.5 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-champagnepale/70 font-display text-lg text-champagne">
              {initiales(prenom, nom, user.email?.[0]?.toUpperCase() ?? '?')}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight text-ink">
                {prenom || nom ? `${prenom} ${nom}`.trim() : 'Votre compte'}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>

          {/* --- Navigation --- */}
          <nav aria-label="Espace client" className="mt-4">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {navCompte.map((l) => {
                const actif = l.exact ? chemin === l.href : chemin.startsWith(l.href);

                return (
                  <li key={l.href} className="shrink-0 lg:shrink">
                    <Link
                      href={l.href}
                      aria-current={actif ? 'page' : undefined}
                      className={cn(
                        'relative block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition-colors duration-[140ms]',
                        actif ? 'text-ink' : 'text-muted hover:text-ink',
                      )}
                    >
                      {/* Fond de l'onglet actif. Il glissait d'un onglet à
                          l'autre via un `layoutId` Framer ; les onglets ont
                          des largeurs différentes, donc pas d'équivalent CSS
                          simple. Il se pose maintenant directement — l'onglet
                          actif reste identifiable, ce qui est l'essentiel. */}
                      {actif && (
                        <span aria-hidden className="absolute inset-0 rounded-lg bg-canvas2" />
                      )}
                      <span className="relative z-10">{l.label}</span>
                    </Link>
                  </li>
                );
              })}

              <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-line lg:pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await deconnexion();
                    router.push('/');
                  }}
                  className="inline-flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-danger"
                >
                  <Icon nom="sortie" taille={16} />
                  Se déconnecter
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* ============ Contenu ============ */}
        <div
          key={chemin}
          className="surgir min-w-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** En-tête d'une page de l'espace client. */
export function TitreCompte({
  titre,
  texte,
  action,
}: {
  titre: string;
  texte?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[2rem] leading-tight text-ink sm:text-[2.5rem]">
          {titre}
        </h1>
        {texte && <p className="text-sm leading-relaxed text-muted">{texte}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
