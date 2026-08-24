import type { Metadata } from 'next';

import { AValider, Liste, PageTexte, Section } from '@/components/layout/PageTexte';
import { contact, site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Conditions générales',
  description:
    'Conditions générales de vente et de service de MAISON EVE : réservation, annulation, ' +
    'paiement, déroulement des soins.',
  alternates: { canonical: '/cgv' },
};

export default function PageCgv() {
  return (
    <PageTexte
      titre="Conditions générales"
      miseAJour="20 août 2026"
      intro={`Elles encadrent les prestations de ${site.fullName}, en institut comme à domicile.`}
    >
      <AValider>
        Ce texte a été rédigé pour être clair et honnête, mais il n’a pas été relu par un
        juriste. Faites-le valider avant la mise en ligne : les mentions obligatoires
        dépendent de la forme juridique de l’entreprise et du droit marocain applicable.
      </AValider>

      <Section titre="1. Qui nous sommes">
        <p>
          {site.fullName}, institut de beauté et spa situé {contact.street}, {contact.postalCode}{' '}
          {contact.city}, {contact.country}. Téléphone : {contact.phone}. E-mail :{' '}
          {contact.email}.
        </p>
        <AValider>
          Ajouter ici la forme juridique, le numéro de registre du commerce, l’identifiant
          fiscal et l’ICE. Ces mentions sont obligatoires.
        </AValider>
      </Section>

      <Section titre="2. Les prestations">
        <p>
          Nous proposons des soins de bien-être : massages, soins du visage, rituels du corps
          et hammam. Ils se déroulent dans notre institut ou, pour les soins qui le permettent,
          à votre domicile.
        </p>
        <p>
          <strong className="font-sans font-medium text-ink">
            Nos soins sont des soins de bien-être et d’esthétique.
          </strong>{' '}
          Ce ne sont ni des actes médicaux, ni des actes de kinésithérapie. Ils ne remplacent
          aucun traitement, ne posent aucun diagnostic et ne soignent aucune pathologie.
        </p>
        <p>
          Les durées annoncées correspondent au temps de soin effectif. Un retard de votre part
          réduit d’autant la séance, sans réduction de tarif : le créneau suivant appartient à
          quelqu’un d’autre.
        </p>
      </Section>

      <Section titre="3. Réserver">
        <p>
          La réservation se fait en ligne, par téléphone ou sur place. Une réservation en ligne
          est une <strong className="font-sans font-medium text-ink">demande</strong> : elle
          devient un rendez-vous ferme une fois que nous l’avons confirmée, en général dans la
          journée.
        </p>
        <p>
          Les créneaux affichés sont indicatifs et peuvent avoir été pris entre-temps. Si le
          créneau demandé n’est plus disponible, nous vous proposons le plus proche.
        </p>
      </Section>

      <Section titre="4. Tarifs et paiement">
        <p>
          Les tarifs sont affichés en dirhams ({site.currency}), toutes taxes comprises. Le
          tarif applicable est celui affiché au moment de la réservation.
        </p>
        <p>
          Un soin à domicile fait l’objet d’un supplément de déplacement, indiqué avant la
          confirmation.
        </p>
        <p>
          <strong className="font-sans font-medium text-ink">
            Le paiement se fait sur place, après le soin
          </strong>{' '}
          — espèces ou carte. Il n’y a pas de paiement en ligne, et aucune donnée bancaire ne
          vous est demandée lors de la réservation.
        </p>
      </Section>

      <Section titre="5. Annuler ou déplacer">
        <Liste
          items={[
            'Plus de 24 heures avant : annulation ou report libre, depuis votre espace client ou par téléphone.',
            'Moins de 24 heures avant : appelez-nous. La praticienne a déjà bloqué son créneau, et pour un soin à domicile elle s’est parfois déjà organisée pour le déplacement.',
            'Absence sans prévenir : nous nous réservons le droit de demander un acompte pour toute réservation ultérieure.',
            'De notre côté : si nous devons annuler, nous vous prévenons dès que possible et vous proposons un autre créneau en priorité.',
          ]}
        />
      </Section>

      <Section titre="6. Les soins à domicile">
        <p>
          Nous apportons la table, le linge, les huiles et le matériel. De votre côté, nous
          avons besoin d’un espace d’environ deux mètres sur deux, dans une pièce fermée et
          chauffée, ainsi que d’un accès à un point d’eau.
        </p>
        <p>
          La praticienne peut interrompre ou refuser une prestation si les conditions ne
          permettent pas de travailler correctement ou en sécurité, ou en cas de comportement
          déplacé. La séance est alors due.
        </p>
      </Section>

      <Section titre="7. Santé et contre-indications">
        <p>
          Vous devez nous signaler, au moment de la réservation, toute grossesse, opération
          récente, problème circulatoire ou cardiaque, affection cutanée, allergie et
          traitement en cours.
        </p>
        <p>
          Certains soins sont déconseillés dans ces situations. Nous adaptons la prestation ou
          vous orientons vers un autre soin. En cas de doute, demandez l’avis de votre médecin :
          nous ne sommes pas habilités à le faire à sa place.
        </p>
      </Section>

      <Section titre="8. Cartes cadeaux">
        <p>
          Les cartes cadeaux sont nominatives ou au porteur, valables un an à compter de leur
          date d’émission, et non remboursables en espèces.
        </p>
        <AValider>
          La durée de validité et les conditions de remboursement doivent être vérifiées au
          regard du droit applicable.
        </AValider>
      </Section>

      <Section titre="9. Responsabilité">
        <p>
          Nous mettons tout en œuvre pour que chaque soin se déroule dans de bonnes conditions.
          Notre responsabilité ne peut être engagée en cas de réaction liée à une information
          de santé qui ne nous aurait pas été communiquée.
        </p>
        <p>
          Nous vous conseillons de ne pas apporter d’objets de valeur : ils restent sous votre
          responsabilité.
        </p>
      </Section>

      <Section titre="10. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre{' '}
          <a href="/confidentialite" className="souligne text-ink">
            politique de confidentialité
          </a>
          .
        </p>
      </Section>

      <Section titre="11. Réclamations">
        <p>
          Écrivez-nous à {contact.email} ou appelez le {contact.phone}. Nous répondons à toute
          réclamation dans les meilleurs délais, et nous préférons de loin en parler qu’ignorer
          un problème.
        </p>
      </Section>
    </PageTexte>
  );
}
