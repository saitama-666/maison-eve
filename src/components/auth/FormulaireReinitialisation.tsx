'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CadreAuth } from '@/components/auth/CadreAuth';
import { Encart } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Champ } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { emailValide } from '@/lib/validation';

// =====================================================================
//  Mot de passe oublié.
//
//  ⚠️  POINT DE SÉCURITÉ : le message de succès est le MÊME que l'adresse
//      existe ou non, et on l'affiche même quand Firebase renvoie une
//      erreur « utilisateur inconnu ».
//
//      Sinon la page devient un oracle : on y teste des adresses une par
//      une pour savoir lesquelles ont un compte. Sur un site de soins,
//      c'est une information personnelle — savoir que quelqu'un est
//      cliente d'un spa n'a rien d'anodin.
//
//      Les vraies erreurs (réseau, quota) restent affichées : elles ne
//      disent rien sur l'existence du compte.
// =====================================================================

export function FormulaireReinitialisation() {
  const { reinitialiser } = useAuth();

  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState<string>();
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();

    if (!emailValide(email)) {
      setErreur('Cette adresse ne semble pas valide.');
      return;
    }

    setErreur(undefined);
    setEnvoi(true);

    try {
      await reinitialiser(email.trim());
      setEnvoye(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';

      // Compte inexistant : on fait comme si tout s'était bien passé.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setEnvoye(true);
      } else {
        setErreur(messageErreur(err));
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <CadreAuth
      titre="Mot de passe oublié"
      sousTitre="Indiquez votre adresse : on vous envoie un lien pour en choisir un nouveau."
      visuel="/bandeaux/faq.svg"
      pied={
        <>
          Vous vous en souvenez ?{' '}
          <Link href="/connexion" className="souligne text-ink">
            Se connecter
          </Link>
        </>
      }
    >
      {envoye ? (
        <div className="surgir flex flex-col gap-5">
          <div className="surgir-coche mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-champagnepale/70 text-champagne">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
              <path
                className="trace-coche"
                d="M7 15.5L12.5 21L23 9.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <Encart ton="succes" titre="C’est envoyé">
            Si un compte existe avec <strong>{email}</strong>, un lien vient d’y être envoyé.
            Il est valable une heure. Pensez à regarder dans les indésirables.
          </Encart>

          <Button href="/connexion" variante="secondaire" pleineLargeur>
            Retour à la connexion
          </Button>
        </div>
      ) : (
        <form onSubmit={soumettre} className="flex flex-col gap-5" noValidate>
          <Champ
            label="Adresse e-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErreur(undefined);
            }}
            erreur={erreur}
            autoComplete="email"
            autoFocus
            required
          />

          <Button type="submit" chargement={envoi} pleineLargeur taille="lg" fleche>
            Envoyer le lien
          </Button>
        </form>
      )}
    </CadreAuth>
  );
}
