import type { Metadata } from 'next';

import { AppelReservation } from '@/components/home/AppelReservation';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { CatalogueSoins } from '@/components/soins/CatalogueSoins';
import { Button } from '@/components/ui/Button';
import { site } from '@/data/site';
import { getServices } from '@/lib/catalogue';
import { duree, prix } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Nos soins — massages, hammam et visage',
  description:
    'Le catalogue complet des soins MAISON EVE : massages, hammam et gommage, soins du visage, ' +
    'rituels. En institut ou à domicile, avec les durées et les tarifs.',
  alternates: { canonical: '/soins' },
};

// =====================================================================
//  Catalogue des soins.
//
//  La page est un composant SERVEUR : les données structurées sont
//  construites ici, à partir du catalogue réel, et partent dans le HTML.
//  Le filtrage, lui, est confié à `<CatalogueSoins>` côté client.
// =====================================================================

export default async function PageSoins() {
  const services = await getServices();
  const actifs = services.filter((s) => s.actif);

  // Chaque soin est une `Offer` dans un catalogue. C'est ce qui permet à
  // Google d'afficher les prix. Les montants viennent du catalogue
  // serveur — la même source que celle qui facture.
  const catalogueJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Soins MAISON EVE',
    itemListElement: actifs.map((s, i) => ({
      '@type': 'Offer',
      position: i + 1,
      name: s.nom,
      description: s.resume,
      price: s.prix,
      priceCurrency: site.currency,
      url: `${site.url}/soins/${s.slug}`,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueJsonLd) }}
      />

      <EnTetePage
        surtitre="Le catalogue"
        titre={
          <>
            Nos <span className="italic text-champagnesoft">soins</span>
          </>
        }
        texte={
          `${actifs.length} soins, de ${duree(Math.min(...actifs.map((s) => s.duree)))} ` +
          `à ${duree(Math.max(...actifs.map((s) => s.duree)))}, à partir de ` +
          `${prix(Math.min(...actifs.map((s) => s.prix)))}.`
        }
        image="/bandeaux/relaxation.jpg"
        filAriane={[{ label: 'Soins' }]}
        action={
          <Button href="/reservation" variante="clair" fleche>
            Prendre rendez-vous
          </Button>
        }
      />

      <CatalogueSoins />
      <AppelReservation />
    </>
  );
}
