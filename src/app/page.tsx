import type { Metadata } from 'next';

import { ADomicile } from '@/components/home/ADomicile';
import { AppelReservation } from '@/components/home/AppelReservation';
import { FaqAccueil } from '@/components/home/FaqAccueil';
import { Hero } from '@/components/home/Hero';
import { JournalTeaser } from '@/components/home/JournalTeaser';
import { Moments } from '@/components/home/Moments';
import { Presentation } from '@/components/home/Presentation';
import { Promesses } from '@/components/home/Promesses';
import { SoinsAccueil } from '@/components/home/SoinsAccueil';
import { Temoignages } from '@/components/home/Temoignages';
import { questionsAccueil } from '@/data/faq';
import { contact, site } from '@/data/site';
import { getArticles, getServices } from '@/lib/catalogue';

// =====================================================================
//  Page d'accueil.
//
//  L'ordre des sections suit un raisonnement, pas la maquette pour la
//  maquette :
//
//   1. Hero            — qui on est, en trois secondes.
//   2. Présentation    — pourquoi la maison existe.
//   3. Promesses       — les trois raisons de choisir.
//   4. Soins           — ce qu'on peut réserver. Le cœur.
//   5. À domicile      — ce qui nous distingue vraiment.
//   6. Avis            — la preuve par les autres.
//   7. Galerie         — la preuve par les yeux.
//   8. FAQ             — les objections qui bloquent la réservation.
//   9. Journal         — la preuve par la compétence, et le référencement.
//  10. Appel final     — la sortie vers /reservation.
//
//  ⚠️  Il n'y a PAS de bandeau de chiffres (« 500 clientes », « 8 ans
//      d'expérience »). Les valeurs de `chiffres` dans `src/data/site.ts`
//      sont à zéro parce qu'aucun chiffre réel n'a été fourni. Afficher
//      des nombres inventés serait le même mensonge que des faux avis.
//      La section est prête à être ajoutée dès que Hamza donne les vrais.
// =====================================================================

export const metadata: Metadata = {
  title: `${site.fullName} — Institut et soins à domicile à ${contact.city}`,
  description: site.description,
  alternates: { canonical: '/' },
};

/**
 * Données structurées FAQ.
 *
 * Google peut afficher ces questions directement dans ses résultats. Les
 * réponses envoyées ici sont EXACTEMENT celles affichées sur la page —
 * envoyer autre chose que ce que voit le visiteur est une infraction aux
 * consignes de Google, et se sanctionne.
 */
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questionsAccueil.map((q) => ({
    '@type': 'Question',
    name: q.q,
    acceptedAnswer: { '@type': 'Answer', text: q.r },
  })),
};

export default async function Accueil() {
  // Le catalogue est lu ICI, côté serveur, et descendu en propriétés.
  // Passer par le contexte client rendrait client toute la chaîne de
  // composants qui l'utilise — y compris les cartes de soin.
  const [services, articles] = await Promise.all([getServices(), getArticles()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Hero />
      <Presentation />
      <Promesses />
      <SoinsAccueil services={services} />
      <ADomicile />
      <Temoignages />
      <Moments />
      <FaqAccueil />
      <JournalTeaser articles={articles} />
      <AppelReservation />
    </>
  );
}
