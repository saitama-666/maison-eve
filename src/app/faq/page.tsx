import type { Metadata } from 'next';

import { EnTetePage } from '@/components/layout/EnTetePage';
import { Reveal } from '@/components/motion/Reveal';
import { Accordeon } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { questions } from '@/data/faq';
import { contact } from '@/data/site';

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Réservation, horaires, paiement, contre-indications, annulation : ' +
    'les réponses aux questions qu’on nous pose le plus.',
  alternates: { canonical: '/faq' },
};

// =====================================================================
//  Questions fréquentes.
//
//  Groupées par thème plutôt qu'en une seule liste : quinze questions à
//  la suite se lisent mal, et on ne trouve pas la sienne.
//
//  Les données structurées `FAQPage` reprennent EXACTEMENT les réponses
//  affichées. Envoyer à Google un texte différent de celui que voit le
//  visiteur est contraire à ses consignes, et sanctionné.
// =====================================================================

const GROUPES = [
  { cle: 'reservation', titre: 'Réserver', icone: 'calendrier' as const },
  { cle: 'soins', titre: 'Les soins', icone: 'lotus' as const },
  { cle: 'paiement', titre: 'Paiement et cadeaux', icone: 'etincelle' as const },
];

export default function PageFaq() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.r },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <EnTetePage
        surtitre="Bon à savoir"
        titre={
          <>
            Questions <span className="italic text-champagnesoft">fréquentes</span>
          </>
        }
        texte="Tout ce qu’on nous demande avant un premier rendez-vous."
        image="/bandeaux/faq.jpg"
        filAriane={[{ label: 'Questions fréquentes' }]}
        hauteur="court"
      />

      <section className="bg-canvas py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="flex flex-col gap-14">
            {GROUPES.map((g) => {
              const entrees = questions.filter((q) => q.categorie === g.cle);
              if (entrees.length === 0) return null;

              return (
                <div key={g.cle} className="flex flex-col gap-5">
                  <Reveal>
                    <h2 className="flex items-center gap-3 font-display text-3xl text-ink">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas2 text-champagne">
                        <Icon nom={g.icone} taille={19} />
                      </span>
                      {g.titre}
                    </h2>
                  </Reveal>

                  <Reveal delai={0.06}>
                    <Accordeon
                      entrees={entrees.map((q) => ({ q: q.q, r: q.r }))}
                      ouvertParDefaut={-1}
                      multiple
                    />
                  </Reveal>
                </div>
              );
            })}
          </div>

          {/* --- Sortie --- */}
          <Reveal delai={0.1} className="mt-16">
            <div className="carte flex flex-col items-center gap-5 p-8 text-center">
              <h2 className="font-display text-3xl text-ink">Votre question n’y est pas ?</h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                Écrivez-nous ou appelez-nous. On répond en général dans la journée, et il n’y
                a pas de question bête.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/contact" fleche>
                  Nous écrire
                </Button>
                <Button href={`tel:${contact.phoneHref}`} variante="secondaire">
                  {contact.phone}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
