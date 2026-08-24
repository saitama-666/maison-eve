'use client';

import { useEffect, useState } from 'react';

import { TitreCompte } from '@/components/compte/CadreCompte';
import { Encart } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Case, Champ, ChampMotDePasse } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import { motDePasseValide, telValide, texteValide } from '@/lib/validation';

// =====================================================================
//  Paramètres du compte.
//
//  Trois blocs séparés, chacun avec son propre bouton d'enregistrement :
//  le profil, le mot de passe, la suppression. Un seul gros formulaire
//  obligerait à tout réenregistrer pour changer un numéro de téléphone.
//
//  L'e-mail est affiché mais NON MODIFIABLE : il identifie le compte
//  Firebase Auth, et les règles Firestore interdisent de le changer dans
//  le document profil. Le changer proprement demande une revérification
//  de l'adresse — un chantier à part, listé dans PROGRESS.md.
// =====================================================================

export function Parametres() {
  const { user, profil, majProfil, majMotDePasse, renvoyerVerification } = useAuth();
  const toast = useToast();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [lettre, setLettre] = useState(false);
  const [envoiProfil, setEnvoiProfil] = useState(false);
  const [erreursProfil, setErreursProfil] = useState<Record<string, string>>({});

  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [envoiMdp, setEnvoiMdp] = useState(false);
  const [erreursMdp, setErreursMdp] = useState<Record<string, string>>({});

  const [envoiVerif, setEnvoiVerif] = useState(false);

  // Le profil arrive de façon asynchrone : on remplit le formulaire dès
  // qu'il est là, sans écraser ce que la personne aurait déjà tapé.
  useEffect(() => {
    if (!profil) return;
    setPrenom((v) => v || profil.firstName || '');
    setNom((v) => v || profil.lastName || '');
    setTelephone((v) => v || profil.phone || '');
    setLettre(profil.marketingOptIn === true);
  }, [profil]);

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault();

    const erreurs: Record<string, string> = {};
    if (!texteValide(prenom, 2, 60)) erreurs.prenom = 'Indiquez votre prénom.';
    if (!texteValide(nom, 2, 60)) erreurs.nom = 'Indiquez votre nom.';
    if (telephone && !telValide(telephone)) erreurs.telephone = 'Ce numéro ne semble pas valide.';

    setErreursProfil(erreurs);
    if (Object.keys(erreurs).length > 0) return;

    setEnvoiProfil(true);
    try {
      await majProfil({
        firstName: prenom.trim(),
        lastName: nom.trim(),
        phone: telephone.trim(),
        marketingOptIn: lettre,
      });
      toast.succes('Profil enregistré.');
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoiProfil(false);
    }
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();

    const erreurs: Record<string, string> = {};
    if (!motDePasseValide(nouveau)) erreurs.nouveau = '8 caractères minimum.';
    if (nouveau !== confirmation) erreurs.confirmation = 'Les deux mots de passe diffèrent.';

    setErreursMdp(erreurs);
    if (Object.keys(erreurs).length > 0) return;

    setEnvoiMdp(true);
    try {
      await majMotDePasse(nouveau);
      setNouveau('');
      setConfirmation('');
      toast.succes('Mot de passe modifié.');
    } catch (err) {
      // Firebase exige une connexion récente pour cette opération : le
      // message traduit dit exactement quoi faire.
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoiMdp(false);
    }
  }

  async function renvoyer() {
    setEnvoiVerif(true);
    try {
      await renvoyerVerification();
      toast.succes('E-mail de confirmation renvoyé.');
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoiVerif(false);
    }
  }

  return (
    <>
      <TitreCompte titre="Paramètres" texte="Vos coordonnées et votre mot de passe." />

      <div className="flex flex-col gap-10">
        {/* ============ Profil ============ */}
        <section className="carte p-6">
          <h2 className="font-display text-2xl text-ink">Vos informations</h2>

          <form onSubmit={enregistrerProfil} className="mt-5 flex flex-col gap-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ
                label="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                erreur={erreursProfil.prenom}
                autoComplete="given-name"
              />
              <Champ
                label="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                erreur={erreursProfil.nom}
                autoComplete="family-name"
              />
            </div>

            <Champ
              label="Adresse e-mail"
              value={user?.email ?? ''}
              readOnly
              disabled
              aide="L’adresse identifie votre compte. Écrivez-nous pour la changer."
            />

            <Champ
              label="Téléphone"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              erreur={erreursProfil.telephone}
              facultatif
              autoComplete="tel"
              aide="Pour vous prévenir en cas d’imprévu sur un rendez-vous."
            />

            <Case
              label="Je veux recevoir la lettre de MAISON EVE (une fois par mois, pas plus)."
              coche={lettre}
              onChange={setLettre}
            />

            <div>
              <Button type="submit" chargement={envoiProfil} fleche>
                Enregistrer
              </Button>
            </div>
          </form>
        </section>

        {/* ============ Vérification e-mail ============ */}
        {user && !user.emailVerified && (
          <section className="carte p-6">
            <h2 className="font-display text-2xl text-ink">Confirmer votre adresse</h2>
            <Encart ton="attention" className="mt-4">
              Votre adresse n’est pas encore confirmée. Sans cette confirmation, les rappels de
              rendez-vous risquent de ne pas vous parvenir.
            </Encart>
            <div className="mt-4">
              <Button variante="secondaire" onClick={renvoyer} chargement={envoiVerif}>
                Renvoyer l’e-mail de confirmation
              </Button>
            </div>
          </section>
        )}

        {/* ============ Mot de passe ============ */}
        <section className="carte p-6">
          <h2 className="font-display text-2xl text-ink">Mot de passe</h2>

          <form onSubmit={changerMotDePasse} className="mt-5 flex flex-col gap-5" noValidate>
            <ChampMotDePasse
              label="Nouveau mot de passe"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              erreur={erreursMdp.nouveau}
              autoComplete="new-password"
              aide="8 caractères minimum. Une phrase vaut mieux qu’un mot compliqué."
            />

            <ChampMotDePasse
              label="Confirmer"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              erreur={erreursMdp.confirmation}
              autoComplete="new-password"
            />

            <p className="text-xs leading-relaxed text-faint">
              Si vous êtes connectée depuis longtemps, on vous demandera de vous reconnecter
              avant d’accepter le changement. C’est une sécurité, pas un bug.
            </p>

            <div>
              <Button type="submit" chargement={envoiMdp} variante="secondaire">
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </section>

        {/* ============ Suppression ============ */}
        <section className="carte border-danger/25 p-6">
          <h2 className="font-display text-2xl text-ink">Supprimer mon compte</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            La suppression se fait sur demande, pour une raison simple : vos rendez-vous passés
            servent aussi à la comptabilité de l’institut, qui doit les conserver. Écrivez-nous
            et on vous explique exactement ce qui est effacé et ce qui est conservé, et
            pourquoi.
          </p>
          <div className="mt-4">
            <Button href="/contact?sujet=suppression" variante="secondaire">
              Demander la suppression
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
