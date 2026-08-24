import type { Metadata } from 'next';

import { AValider, Liste, PageTexte, Section } from '@/components/layout/PageTexte';
import { contact, site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données MAISON EVE collecte, pourquoi, combien de temps elles sont conservées, ' +
    'et comment exercer vos droits.',
  alternates: { canonical: '/confidentialite' },
};

// =====================================================================
//  Politique de confidentialité.
//
//  Elle doit décrire ce que le site fait RÉELLEMENT. Chaque affirmation
//  ci-dessous est vérifiable dans le code :
//   · pas de donnée bancaire → `noPaymentData()` dans firestore.rules,
//     `contientDonneeBancaire()` dans les routes API ;
//   · pas de traceur publicitaire → aucun script tiers, CSP restrictive
//     dans next.config.ts ;
//   · sous-traitant unique → Firebase (Google), plus l'hébergeur.
//
//  Si le site change, cette page change AUSSI. Une politique qui décrit
//  autre chose que la réalité est pire que pas de politique du tout.
// =====================================================================

export default function PageConfidentialite() {
  return (
    <PageTexte
      titre="Politique de confidentialité"
      miseAJour="20 août 2026"
      intro="Ce que nous collectons, pourquoi, et ce que nous ne faisons pas."
    >
      <AValider>
        Ce texte décrit fidèlement le fonctionnement actuel du site, mais il n’a pas été relu
        par un juriste. À faire valider au regard de la loi 09-08 (Maroc) et, si vous avez des
        clientes dans l’Union européenne, du RGPD.
      </AValider>

      <Section titre="En résumé">
        <Liste
          items={[
            'Nous ne demandons ni ne conservons aucune donnée bancaire. Le paiement se fait sur place.',
            'Nous ne vendons, ne louons et n’échangeons vos données avec personne.',
            'Nous n’utilisons aucun traceur publicitaire, et le site ne dépose aucun cookie de mesure d’audience.',
            'Vous pouvez demander à consulter, corriger ou supprimer vos données à tout moment.',
          ]}
        />
      </Section>

      <Section titre="Qui est responsable">
        <p>
          {site.fullName}, {contact.street}, {contact.postalCode} {contact.city},{' '}
          {contact.country}. Pour toute question : {contact.email}.
        </p>
      </Section>

      <Section titre="Ce que nous collectons">
        <p>
          <strong className="font-sans font-medium text-ink">
            Quand vous réservez un soin :
          </strong>{' '}
          vos prénom, nom, e-mail et téléphone ; le soin, la date et le lieu choisis ;
          l’adresse d’intervention si le soin a lieu chez vous ; l’adresse postale de
          facturation ; et les remarques que vous nous laissez.
        </p>
        <p>
          <strong className="font-sans font-medium text-ink">Quand vous créez un compte :</strong>{' '}
          les mêmes informations, plus votre mot de passe — que nous ne voyons jamais. Il est
          géré par Firebase Authentication (Google), qui n’en conserve qu’une empreinte
          chiffrée.
        </p>
        <p>
          <strong className="font-sans font-medium text-ink">Quand vous nous écrivez :</strong>{' '}
          votre nom, votre e-mail, votre téléphone si vous le donnez, et le contenu de votre
          message.
        </p>
      </Section>

      <Section titre="Ce que nous ne collectons pas">
        <p>
          <strong className="font-sans font-medium text-ink">Aucune donnée bancaire.</strong>{' '}
          Ni numéro de carte, ni cryptogramme, ni IBAN, ni RIB. Ce n’est pas une promesse en
          l’air : nos règles de base de données rejettent activement ces champs, et nos routes
          serveur refusent toute requête qui en contiendrait. Le paiement se fait sur place,
          après le soin.
        </p>
        <p>
          Nous ne collectons pas non plus de données de santé au sens médical. Les remarques
          que vous laissez (allergie, grossesse, zone sensible) servent uniquement à adapter le
          soin, et ne sont visibles que par l’institut.
        </p>
      </Section>

      <Section titre="Pourquoi nous les collectons">
        <Liste
          items={[
            'Pour organiser et confirmer votre rendez-vous — c’est la raison principale.',
            'Pour vous joindre en cas d’imprévu sur ce rendez-vous.',
            'Pour adapter le soin à votre situation, quand vous nous signalez quelque chose.',
            'Pour tenir la comptabilité de l’institut, ce qui est une obligation légale.',
            'Pour vous envoyer notre lettre, uniquement si vous l’avez demandé — et vous pouvez vous désinscrire à tout moment.',
          ]}
        />
      </Section>

      <Section titre="Combien de temps">
        <Liste
          items={[
            'Compte client : tant que le compte existe. Nous supprimons les comptes inactifs depuis trois ans.',
            'Rendez-vous : conservés pour la durée légale de conservation comptable, puis supprimés.',
            'Messages de contact : deux ans après le dernier échange.',
            'Inscription à la lettre : jusqu’à votre désinscription.',
          ]}
        />
        <AValider>
          Les durées de conservation comptable doivent être vérifiées auprès de votre
          comptable : elles dépendent du régime fiscal de l’entreprise.
        </AValider>
      </Section>

      <Section titre="Qui y a accès">
        <p>
          L’équipe de l’institut, et personne d’autre. Nous ne vendons, ne louons et
          n’échangeons vos données avec aucun tiers.
        </p>
        <p>
          Deux prestataires techniques les hébergent pour notre compte :{' '}
          <strong className="font-sans font-medium text-ink">Firebase</strong> (Google) pour la
          base de données et les comptes, et notre hébergeur pour le site lui-même. Ils
          agissent sur nos instructions et n’ont pas le droit d’en faire autre chose.
        </p>
        <AValider>
          Préciser le nom de l’hébergeur retenu, et vérifier les modalités de transfert de
          données hors du Maroc.
        </AValider>
      </Section>

      <Section titre="Cookies et traceurs">
        <p>
          Le site ne dépose aucun cookie publicitaire et n’utilise aucun outil de mesure
          d’audience. Il conserve seulement, dans votre navigateur, ce qui est nécessaire à
          votre connexion — pour vous éviter de saisir votre mot de passe à chaque visite.
        </p>
        <p>
          C’est aussi pourquoi vous ne voyez aucune bannière de cookies : il n’y a rien à vous
          faire accepter.
        </p>
      </Section>

      <Section titre="Vos droits">
        <p>
          Vous pouvez à tout moment demander à consulter vos données, les faire corriger, les
          faire supprimer, ou vous opposer à leur utilisation. Écrivez à {contact.email} : nous
          répondons dans les meilleurs délais.
        </p>
        <p>
          Certaines données doivent être conservées malgré une demande de suppression, quand la
          loi l’impose — la comptabilité, notamment. Nous vous disons alors précisément ce qui
          est effacé et ce qui est conservé, et pourquoi.
        </p>
      </Section>

      <Section titre="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés. L’accès aux données est verrouillé par des
          règles côté serveur : un compte ne peut lire que ses propres informations, y compris
          si quelqu’un modifiait la page dans son navigateur.
        </p>
        <p>
          Aucun système n’est infaillible. En cas d’incident touchant vos données, nous vous en
          informerions.
        </p>
      </Section>
    </PageTexte>
  );
}
