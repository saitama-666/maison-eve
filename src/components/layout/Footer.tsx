import Link from 'next/link';

import { Lettre } from '@/components/layout/Lettre';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { contact, navPied, site, social } from '@/data/site';

// =====================================================================
//  Pied de page.
//
//  Reprend la composition de la maquette : la marque et son résumé à
//  gauche, puis trois colonnes de liens, l'adresse et les réseaux.
//
//  L'inscription à la lettre écrit directement dans Firestore
//  (`newsletter/{email}`). L'identifiant du document EST l'adresse en
//  minuscules : une même adresse ne peut donc pas s'inscrire deux fois,
//  et personne ne peut lire la liste — les règles réservent la lecture à
//  l'administration.
// =====================================================================

export function Footer() {
  return (
    <footer className="bg-shelldeep text-onshell">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
          {/* --- Marque --- */}
          <Reveal className="flex flex-col items-start gap-5">
            <Logo ton="sombre" taille="md" />
            <p className="max-w-xs text-sm leading-relaxed text-onshellmuted">
              Institut de beauté et spa à {contact.city}. Massages, soins du visage et rituels
              du corps — chez nous, ou chez vous.
            </p>
            <Reseaux />
          </Reveal>

          {/* --- Colonnes de liens --- */}
          <ColonneLiens titre="La maison" liens={navPied.maison} />
          <ColonneLiens titre="Pratique" liens={navPied.aide} />

          {/* --- Coordonnées + lettre --- */}
          <Reveal className="flex flex-col gap-5">
            <h2 className="surtitre text-champagnesoft">Nous trouver</h2>

            <address className="flex flex-col gap-3 text-sm not-italic text-onshellmuted">
              <span className="flex items-start gap-2.5">
                <Icon nom="position" taille={15} className="mt-0.5 shrink-0 text-champagnesoft" />
                <span>
                  {contact.street}
                  <br />
                  {contact.postalCode} {contact.city}, {contact.country}
                </span>
              </span>

              <a
                href={`tel:${contact.phoneHref}`}
                className="flex items-center gap-2.5 transition-colors duration-[140ms] hover:text-onshell"
              >
                <Icon nom="telephone" taille={15} className="shrink-0 text-champagnesoft" />
                {contact.phone}
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2.5 transition-colors duration-[140ms] hover:text-onshell"
              >
                <Icon nom="email" taille={15} className="shrink-0 text-champagnesoft" />
                {contact.email}
              </a>
            </address>

            <div className="flex flex-col gap-1.5 text-sm text-onshellmuted">
              {contact.hours.map((h) => (
                <div key={h.day} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span className="text-onshell">{h.slot}</span>
                </div>
              ))}
            </div>

            <Lettre />
          </Reveal>
        </div>

        {/* --- Bas de page --- */}
        <div className="mt-14 flex flex-col gap-4 border-t border-onshellmuted/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-onshellmuted">
            © {new Date().getFullYear()} {site.name}. Tous droits réservés.
          </p>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {navPied.legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-xs text-onshellmuted transition-colors duration-[140ms] hover:text-onshell"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function ColonneLiens({
  titre,
  liens,
}: {
  titre: string;
  liens: readonly { label: string; href: string }[];
}) {
  return (
    <RevealGroup className="flex flex-col gap-5">
      <RevealItem>
        <h2 className="surtitre text-champagnesoft">{titre}</h2>
      </RevealItem>

      <ul className="flex flex-col gap-2.5">
        {liens.map((l) => (
          <RevealItem key={l.href} as="li">
            <Link
              href={l.href}
              className="souligne inline-block text-sm text-onshellmuted transition-colors duration-[140ms] hover:text-onshell"
            >
              {l.label}
            </Link>
          </RevealItem>
        ))}
      </ul>
    </RevealGroup>
  );
}

function Reseaux() {
  const liens = [
    { nom: 'instagram' as const, url: social.instagram, label: 'Instagram' },
    { nom: 'facebook' as const, url: social.facebook, label: 'Facebook' },
    { nom: 'tiktok' as const, url: social.tiktok, label: 'TikTok' },
  ];

  return (
    <div className="flex gap-2">
      {liens.map((l) => (
        <a
          key={l.nom}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-onshellmuted ring-1 ring-onshellmuted/25 transition-[color,box-shadow,transform] duration-[140ms] ease-out hover:-translate-y-0.5 hover:text-onshell hover:ring-champagnesoft"
        >
          <Icon nom={l.nom} taille={17} />
        </a>
      ))}
    </div>
  );
}
