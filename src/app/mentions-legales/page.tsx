import type { Metadata } from 'next';

import { AValider, PageTexte, Section } from '@/components/layout/PageTexte';
import { contact, site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur et propriété intellectuelle du site MAISON EVE.',
  alternates: { canonical: '/mentions-legales' },
};

export default function PageMentionsLegales() {
  return (
    <PageTexte titre="Mentions légales" miseAJour="20 août 2026">
      <AValider>
        Plusieurs informations obligatoires manquent encore : forme juridique, capital,
        registre du commerce, identifiant fiscal, ICE, nom du directeur de la publication et
        coordonnées de l’hébergeur. Elles doivent être complétées avant la mise en ligne.
      </AValider>

      <Section titre="Éditeur du site">
        <p>
          {site.fullName}
          <br />
          {contact.street}
          <br />
          {contact.postalCode} {contact.city}, {contact.country}
          <br />
          Téléphone : {contact.phone}
          <br />
          E-mail : {contact.email}
        </p>
        <p className="text-faint">
          Forme juridique : [à compléter] · Capital : [à compléter] · Registre du commerce :
          [à compléter] · Identifiant fiscal : [à compléter] · ICE : [à compléter]
        </p>
      </Section>

      <Section titre="Directeur de la publication">
        <p>[Nom du directeur de la publication à compléter]</p>
      </Section>

      <Section titre="Hébergement">
        <p>
          Le site est hébergé par [nom de l’hébergeur à compléter], [adresse], [téléphone].
        </p>
        <p>
          Les données (comptes clients, rendez-vous, messages) sont hébergées par Google
          Firebase, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.
        </p>
      </Section>

      <Section titre="Propriété intellectuelle">
        <p>
          Les textes, la charte graphique et les éléments d’identité de ce site appartiennent à{' '}
          {site.fullName}. Toute reproduction, même partielle, est soumise à autorisation
          préalable.
        </p>
        <p>
          Les visuels actuellement affichés sur le site sont des illustrations générées, en
          attendant les photographies de l’institut. Elles ne représentent pas les lieux réels.
        </p>
      </Section>

      <Section titre="Liens">
        <p>
          Le site peut renvoyer vers des sites tiers, notamment des réseaux sociaux. Nous
          n’exerçons aucun contrôle sur leur contenu et déclinons toute responsabilité à leur
          égard.
        </p>
      </Section>

      <Section titre="Signaler un problème">
        <p>
          Une erreur, un lien cassé, une information inexacte ? Écrivez-nous à {contact.email} :
          nous corrigeons rapidement.
        </p>
      </Section>
    </PageTexte>
  );
}
