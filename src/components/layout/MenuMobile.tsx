'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { contact, estAComplete, navPrincipale, social } from '@/data/site';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

// =====================================================================
//  Menu plein écran (mobile et tablette).
//
//  Trois exigences d'accessibilité tenues ici, parce qu'un panneau
//  superposé les casse toutes les trois s'il est écrit naïvement :
//
//   1. FERMETURE AU CLAVIER — la touche Échap ferme le panneau.
//
//   2. DÉFILEMENT BLOQUÉ derrière le panneau. Sans ça, on scrolle la page
//      du dessous à travers le menu, et à la fermeture on se retrouve
//      ailleurs sans comprendre pourquoi.
//
//   3. FOCUS RENDU — à la fermeture, le focus revient sur le bouton qui a
//      ouvert le menu. Sans ça, la tabulation repart du haut du document.
//
//  Le panneau n'est monté QUE s'il est ouvert : fermé, il ne prend ni
//  place dans le DOM ni ordre de tabulation.
//
//  ⚠️  PLUS AUCUNE ANIMATION EN JAVASCRIPT ICI.
//
//      Ce panneau était piloté par Framer Motion :
//        initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}   sur le volet
//        variants={{ cache: { opacity: 0, y: 26 } }}      sur les liens
//
//      Framer avance ses animations depuis `requestAnimationFrame`. Quand
//      rAF ne tourne pas — onglet en arrière-plan au moment du clic,
//      appareil en économie d'énergie, erreur levée ailleurs dans l'arbre
//      animé — l'élément RESTE sur son état initial. Mesuré : trois
//      secondes après le clic, le volet était encore à
//      `clip-path: inset(0 0 100%)` et les liens à `opacity: 0`.
//
//      Autrement dit : on ouvrait la seule navigation du mobile, et on ne
//      voyait rien. C'est le même défaut que « les boutons ne mènent vers
//      aucune page », sur la commande la plus importante du site.
//
//      Tout passe donc par CSS (`.volet`, `.volet-liens`), qui n'anime
//      que la position et se résout même sans boucle d'animation.
// =====================================================================

/** Durée de `volet-fermer` dans globals.css. Les deux doivent rester égales. */
const DUREE_FERMETURE = 240;

export function MenuMobile({ ouvert, fermer }: { ouvert: boolean; fermer: () => void }) {
  const chemin = usePathname();
  const { user } = useAuth();

  // `monte` suit `ouvert` avec un retard à la fermeture, le temps de
  // laisser jouer l'animation de sortie.
  const [monte, setMonte] = useState(ouvert);
  const [sortie, setSortie] = useState(false);

  useEffect(() => {
    if (ouvert) {
      setSortie(false);
      setMonte(true);
      return;
    }
    if (!monte) return;

    setSortie(true);
    // Le démontage est piloté par CE minuteur, jamais par `animationend`.
    // Si l'animation ne se joue pas, `animationend` ne part jamais et le
    // panneau resterait affiché pour toujours par-dessus la page.
    const t = window.setTimeout(() => {
      setMonte(false);
      setSortie(false);
    }, DUREE_FERMETURE);
    return () => window.clearTimeout(t);
  }, [ouvert, monte]);

  // --- Échap + blocage du défilement + retour du focus -------------------
  useEffect(() => {
    if (!ouvert) return;

    const declencheur = document.activeElement;

    function surTouche(e: KeyboardEvent) {
      if (e.key === 'Escape') fermer();
    }

    const debordementInitial = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', surTouche);

    return () => {
      document.body.style.overflow = debordementInitial;
      document.removeEventListener('keydown', surTouche);
      // Le focus retourne d'où il venait.
      if (declencheur instanceof HTMLElement) declencheur.focus();
    };
  }, [ouvert, fermer]);

  if (!monte) return null;

  return (
    <div
      id="menu-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-sortie={sortie ? 'oui' : 'non'}
      // `bg-shelldeep` et non `bg-shell` : sur le moka clair, le texte
      // secondaire ne donnait que 3,81 de contraste, sous le seuil AA de
      // 4,5 pour du petit texte. Sur le moka profond il monte a 5,32, et
      // l'or a 6,33. Un panneau plein ecran est aussi plus immersif en
      // fonce — la correction sert les deux.
      className="volet fixed inset-0 z-[95] flex flex-col bg-shelldeep lg:hidden"
    >
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-24">
        {/* --- Liens --- */}
        <nav aria-label="Navigation principale">
          <ul className="volet-liens flex flex-col">
            {navPrincipale.map((lien) => {
              const actif = lien.href === '/' ? chemin === '/' : chemin.startsWith(lien.href);

              return (
                <li key={lien.href} className="border-b border-onshellmuted/15">
                  <Link
                    href={lien.href}
                    onClick={fermer}
                    aria-current={actif ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between py-4 font-display text-3xl transition-colors duration-[140ms]',
                      actif ? 'text-champagnesoft' : 'text-onshell hover:text-champagnesoft',
                    )}
                  >
                    {lien.label}
                    <Icon nom="fleche-droite" taille={18} className="opacity-45" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* --- Actions --- */}
        <div className="volet-pied mt-8 flex flex-col gap-3">
          <Button href="/reservation" variante="clair" pleineLargeur onClick={fermer} fleche>
            Réserver un soin
          </Button>
          <Button
            href={user ? '/compte' : '/connexion'}
            variante="fantome"
            pleineLargeur
            onClick={fermer}
            className="text-onshell ring-1 ring-inset ring-onshellmuted/30 hover:bg-white/10"
          >
            {user ? 'Mon compte' : 'Se connecter'}
          </Button>
        </div>

        {/* --- Coordonnées --- */}
        <div className="volet-pied mt-10 flex flex-col gap-3 text-sm text-onshellmuted">
          <a
            href={`tel:${contact.phoneHref}`}
            className="inline-flex items-center gap-2.5 transition-colors duration-[140ms] hover:text-onshell"
          >
            <Icon nom="telephone" taille={15} />
            {contact.phone}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-2.5 transition-colors duration-[140ms] hover:text-onshell"
          >
            <Icon nom="email" taille={15} />
            {contact.email}
          </a>
          <span className="inline-flex items-start gap-2.5">
            <Icon nom="position" taille={15} className="mt-0.5 shrink-0" />
            {contact.street}, {contact.city}
          </span>

          {/* Seuls les comptes renseignés : un `href` resté à l'état de
              gabarit produisait un lien mort. */}
          <div className="mt-3 flex gap-2">
            {(
              [
                ['instagram', social.instagram],
                ['facebook', social.facebook],
                ['tiktok', social.tiktok],
              ] as const
            )
              .filter(([, url]) => !estAComplete(url))
              .map(([nom, url]) => (
              <a
                key={nom}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={nom}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-onshellmuted/25 transition-colors duration-[140ms] hover:bg-white/10 hover:text-onshell"
              >
                  <Icon nom={nom} taille={17} />
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
