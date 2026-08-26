import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FormulaireContact } from '@/components/contact/FormulaireContact';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { Reveal } from '@/components/motion/Reveal';
import { Squelette } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { contact, estAComplete, site, social, lignesAdresse } from '@/data/site';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    `Contacter ${site.name} : téléphone, e-mail, adresse de l’institut à ${contact.city}, ` +
    'horaires et zone couverte pour les soins à domicile.',
  alternates: { canonical: '/contact' },
};

// =====================================================================
//  Contact.
//
//  Les coordonnées sont AU-DESSUS du formulaire, pas en dessous : la
//  plupart des gens veulent un numéro, pas écrire. Leur imposer un
//  formulaire quand ils cherchent un téléphone est une friction inutile.
// =====================================================================

export default function PageContact() {
  const moyens = [
    {
      icone: 'telephone' as const,
      titre: 'Par téléphone',
      valeur: contact.phone,
      href: `tel:${contact.phoneHref}`,
      note: 'Le plus rapide, surtout pour un rendez-vous.',
    },
    {
      icone: 'whatsapp' as const,
      titre: 'Sur WhatsApp',
      valeur: contact.phone,
      href: `https://wa.me/${contact.whatsapp}`,
      note: 'Pour envoyer une photo ou poser une question rapide.',
    },
    {
      icone: 'email' as const,
      titre: 'Par e-mail',
      valeur: contact.email,
      href: `mailto:${contact.email}`,
      note: 'Réponse en général dans la journée.',
    },
  ];

  return (
    <>
      <EnTetePage
        surtitre="Nous parler"
        titre={
          <>
            On vous <span className="italic text-champagnesoft">répond</span>
          </>
        }
        texte="Par téléphone, par WhatsApp ou par écrit. Choisissez ce qui vous arrange."
        image="/bandeaux/contact.jpg"
        filAriane={[{ label: 'Contact' }]}
      />

      <section className="bg-canvas py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          {/* --- Moyens de contact --- */}
          <div className="grid gap-5 sm:grid-cols-3">
            {moyens.map((m, i) => (
              <Reveal key={m.titre} delai={i * 0.06}>
                <a
                  href={m.href}
                  target={m.href.startsWith('http') ? '_blank' : undefined}
                  rel={m.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="carte group flex h-full flex-col gap-3 p-6 transition-shadow duration-[240ms] hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas2 text-champagne transition-colors duration-[140ms] group-hover:bg-champagne group-hover:text-surchampagne">
                    <Icon nom={m.icone} taille={20} />
                  </span>
                  <h2 className="font-display text-xl text-ink">{m.titre}</h2>
                  <p className="text-[0.9375rem] text-ink">{m.valeur}</p>
                  <p className="mt-auto text-xs leading-relaxed text-faint">{m.note}</p>
                </a>
              </Reveal>
            ))}
          </div>

          {/* --- Formulaire + infos --- */}
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <Suspense fallback={<Squelette className="h-[640px]" />}>
              <FormulaireContact />
            </Suspense>

            <div className="flex flex-col gap-8">
              {/* Adresse */}
              <Reveal className="carte p-6">
                <h2 className="font-display text-2xl text-ink">L’institut</h2>
                <address className="mt-4 flex flex-col gap-3 text-sm not-italic leading-relaxed text-muted">
                  <span className="flex items-start gap-2.5">
                    <Icon nom="position" taille={16} className="mt-0.5 shrink-0 text-champagne" />
                    <span>
                      {lignesAdresse().map((l) => (
                        <span key={l}>
                          {l}
                          <br />
                        </span>
                      ))}
                      {contact.country}
                    </span>
                  </span>
                </address>
              </Reveal>

              {/* Horaires */}
              <Reveal delai={0.06} className="carte p-6">
                <h2 className="font-display text-2xl text-ink">Horaires</h2>
                <dl className="mt-4 flex flex-col gap-2.5 text-sm">
                  {contact.hours.map((h) => (
                    <div key={h.day} className="flex justify-between gap-4">
                      <dt className="text-muted">{h.day}</dt>
                      <dd className="text-ink">{h.slot}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>

              {/* Zone à domicile */}
              <Reveal delai={0.12} className="carte p-6">
                <h2 className="font-display text-2xl text-ink">Soins à domicile</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {contact.homeServiceArea}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Au-delà, écrivez-nous : on regarde au cas par cas, un supplément de
                  déplacement peut s’appliquer.
                </p>
              </Reveal>

              {/* Réseaux */}
              <Reveal delai={0.18} className="carte p-6">
                <h2 className="font-display text-2xl text-ink">Nous suivre</h2>
                <div className="mt-4 flex gap-2">
                  {(
                    [
                      ['instagram', social.instagram, 'Instagram'],
                      ['facebook', social.facebook, 'Facebook'],
                      ['tiktok', social.tiktok, 'TikTok'],
                    ] as const
                  )
                    .filter(([, url]) => !estAComplete(url))
                    .map(([nom, url, label]) => (
                    <a
                      key={nom}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted ring-1 ring-line transition-colors duration-[140ms] hover:text-champagne hover:ring-champagne"
                    >
                        <Icon nom={nom} taille={18} />
                      </a>
                    ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
