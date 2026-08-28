import type { Metadata } from 'next';

import { AValider, PageTexte, Section } from '@/components/layout/PageTexte';
import { contact, estAComplete, legal, legalManquant, lignesAdresse, site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur et propriété intellectuelle du site MAISON EVE.',
  alternates: { canonical: '/mentions-legales' },
};

// =====================================================================
//  Mentions légales.
//
//  RÈGLE DE CETTE PAGE : on n'écrit que ce qui est vrai.
//
//  Les identifiants légaux (RC, ICE, IF, capital, forme juridique) sont
//  des données officielles. Tant que l'institut ne les a pas fournies,
//  elles restent vides dans `src/data/site.ts` — et une ligne vide ne
//  s'affiche PAS. Un « [à compléter] » en clair sur une page légale dit
//  au visiteur que le site n'est pas fini ; pire, un identifiant inventé
//  serait un faux.
//
//  Le bandeau « À faire valider » liste tout seul ce qui manque encore :
//  il se videra au fur et à mesure que `legal` sera rempli, et
//  disparaîtra quand tout sera là.
// =====================================================================

/** Les lignes d'identité légale réellement renseignées. */
function identiteLegale(): string[] {
  return [
    ['Forme juridique', legal.formeJuridique],
    ['Capital', legal.capital],
    ['Registre du commerce', legal.registreCommerce],
    ['Identifiant fiscal', legal.identifiantFiscal],
    ['ICE', legal.ice],
  ]
    .filter(([, valeur]) => valeur.trim() !== '')
    .map(([label, valeur]) => `${label} : ${valeur}`);
}

export default function PageMentionsLegales() {
  const identite = identiteLegale();
  const emailPublie = !estAComplete(contact.email);

  return (
    <PageTexte titre="Mentions légales" miseAJour="28 août 2026">
      {legalManquant.length > 0 && (
        <AValider>
          Informations obligatoires encore manquantes : {legalManquant.join(', ')}. Elles ne
          sont pas affichées tant qu’elles n’ont pas été fournies par l’institut, et doivent
          l’être avant la mise en ligne.
        </AValider>
      )}

      <Section titre="Éditeur du site">
        <p>
          {site.fullName}
          {lignesAdresse().map((ligne) => (
            <span key={ligne}>
              <br />
              {ligne}
            </span>
          ))}
          <br />
          {contact.country}
          <br />
          Téléphone : {contact.phone}
          {emailPublie && (
            <>
              <br />
              E-mail : {contact.email}
            </>
          )}
        </p>

        {identite.length > 0 && <p className="text-faint">{identite.join(' · ')}</p>}
      </Section>

      {legal.directeurPublication.trim() !== '' && (
        <Section titre="Directeur de la publication">
          <p>{legal.directeurPublication}</p>
        </Section>
      )}

      <Section titre="Hébergement">
        {legal.hebergeur.trim() !== '' && (
          <p>
            Le site est hébergé par {legal.hebergeur}
            {legal.hebergeurAdresse.trim() !== '' && `, ${legal.hebergeurAdresse}`}
            {legal.hebergeurTelephone.trim() !== '' && `, ${legal.hebergeurTelephone}`}.
          </p>
        )}
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
          Une erreur, un lien cassé, une information inexacte ?{' '}
          {emailPublie ? (
            <>Écrivez-nous à {contact.email} : nous corrigeons rapidement.</>
          ) : (
            <>Appelez-nous au {contact.phone} : nous corrigeons rapidement.</>
          )}
        </p>
      </Section>
    </PageTexte>
  );
}
