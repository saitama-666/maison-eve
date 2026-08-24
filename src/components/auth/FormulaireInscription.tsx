'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BoutonGoogle, CadreAuth } from '@/components/auth/CadreAuth';
import { Encart } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Case, Champ, ChampMotDePasse } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import {
  estValide,
  validerInscription,
  type ChampsInscription,
  type Erreurs,
} from '@/lib/validation';
import { cn } from '@/lib/utils';

// =====================================================================
//  Création de compte.
//
//  Le compte n'est PAS obligatoire pour réserver — c'est délibéré, exiger
//  une inscription avant un premier rendez-vous fait perdre des clientes.
//  Il sert à retrouver ses rendez-vous, ses adresses et ses favoris.
// =====================================================================

/**
 * Force du mot de passe.
 *
 * Le score dépend surtout de la LONGUEUR, pas de la présence de symboles.
 * « chatonrougeaubalcon » vaut mieux que « P@ss1! » : c'est plus long,
 * plus facile à retenir, et bien plus coûteux à casser. On récompense donc
 * la longueur en premier.
 */
function forceMotDePasse(v: string): { score: 0 | 1 | 2 | 3; label: string; ton: string } {
  if (v.length < 8) return { score: 0, label: 'Trop court', ton: 'bg-danger' };

  let points = 0;
  if (v.length >= 12) points += 1;
  if (v.length >= 16) points += 1;
  if (/[^a-zA-Z0-9]/.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v))) {
    points += 1;
  }

  if (points >= 3) return { score: 3, label: 'Excellent', ton: 'bg-success' };
  if (points === 2) return { score: 2, label: 'Bien', ton: 'bg-champagne' };
  return { score: 1, label: 'Correct', ton: 'bg-warning' };
}

export function FormulaireInscription() {
  const router = useRouter();
  const { inscription, connexionGoogle, user, chargement, disponible } = useAuth();
  const toast = useToast();

  const [v, setV] = useState<ChampsInscription>({
    prenom: '',
    nom: '',
    email: '',
    motDePasse: '',
    confirmation: '',
    conditions: false,
  });
  const [erreurs, setErreurs] = useState<Erreurs<ChampsInscription>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoiGoogle, setEnvoiGoogle] = useState(false);

  const force = useMemo(() => forceMotDePasse(v.motDePasse), [v.motDePasse]);

  useEffect(() => {
    if (!chargement && user) router.replace('/compte');
  }, [chargement, user, router]);

  function maj<K extends keyof ChampsInscription>(cle: K, valeur: ChampsInscription[K]) {
    setV((x) => ({ ...x, [cle]: valeur }));
    setErreurs((e) => {
      if (!e[cle]) return e;
      const suivant = { ...e };
      delete suivant[cle];
      return suivant;
    });
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();

    const trouvees = validerInscription(v);
    setErreurs(trouvees);
    if (!estValide(trouvees)) return;

    setEnvoi(true);
    try {
      await inscription(v.email.trim(), v.motDePasse, v.prenom.trim(), v.nom.trim());
      toast.succes('Compte créé. Bienvenue.');
      router.replace('/compte');
    } catch (err) {
      toast.erreur(messageErreur(err));
      setEnvoi(false);
    }
  }

  async function avecGoogle() {
    setEnvoiGoogle(true);
    try {
      await connexionGoogle();
      toast.succes('Compte créé. Bienvenue.');
      router.replace('/compte');
    } catch (err) {
      toast.erreur(messageErreur(err));
      setEnvoiGoogle(false);
    }
  }

  return (
    <CadreAuth
      titre="Créer un compte"
      sousTitre="Pour retrouver vos rendez-vous et ne plus ressaisir vos adresses."
      visuel="/bandeaux/equipe.svg"
      pied={
        <>
          Vous avez déjà un compte ?{' '}
          <Link href="/connexion" className="souligne text-ink">
            Se connecter
          </Link>
        </>
      }
    >
      {!disponible && (
        <Encart ton="attention" className="mb-6">
          Les comptes ne sont pas encore actifs sur ce site. Vous pouvez réserver sans compte.
        </Encart>
      )}

      <form onSubmit={soumettre} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ
            label="Prénom"
            value={v.prenom}
            onChange={(e) => maj('prenom', e.target.value)}
            erreur={erreurs.prenom}
            autoComplete="given-name"
            autoFocus
            required
          />
          <Champ
            label="Nom"
            value={v.nom}
            onChange={(e) => maj('nom', e.target.value)}
            erreur={erreurs.nom}
            autoComplete="family-name"
            required
          />
        </div>

        <Champ
          label="Adresse e-mail"
          type="email"
          value={v.email}
          onChange={(e) => maj('email', e.target.value)}
          erreur={erreurs.email}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-2">
          <ChampMotDePasse
            label="Mot de passe"
            value={v.motDePasse}
            onChange={(e) => maj('motDePasse', e.target.value)}
            erreur={erreurs.motDePasse}
            autoComplete="new-password"
            aide="8 caractères minimum. Une phrase vaut mieux qu’un mot compliqué."
            required
          />

          {/* Jauge de force — trois segments qui se remplissent.
              `scaleX` est posé en style inline et transitionné par CSS :
              le segment est toujours à la bonne longueur, animé ou non. */}
          {v.motDePasse.length > 0 && (
            <div className="surgir flex items-center gap-2.5">
              <span className="flex flex-1 gap-1" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    style={{ transform: `scaleX(${force.score >= n ? 1 : 0.16})` }}
                    className={cn(
                      'h-1 flex-1 origin-left rounded-full',
                      'transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                      force.score >= n ? force.ton : 'bg-line',
                    )}
                  />
                ))}
              </span>
              <span className="text-xs text-muted">{force.label}</span>
            </div>
          )}
        </div>

        <ChampMotDePasse
          label="Confirmer le mot de passe"
          value={v.confirmation}
          onChange={(e) => maj('confirmation', e.target.value)}
          erreur={erreurs.confirmation}
          autoComplete="new-password"
          required
        />

        <Case
          label={
            <>
              J’accepte les{' '}
              <Link href="/cgv" target="_blank" className="souligne text-ink">
                conditions générales
              </Link>{' '}
              et la{' '}
              <Link href="/confidentialite" target="_blank" className="souligne text-ink">
                politique de confidentialité
              </Link>
              .
            </>
          }
          coche={v.conditions}
          onChange={(c) => maj('conditions', c)}
          erreur={erreurs.conditions}
        />

        <Button type="submit" chargement={envoi} pleineLargeur taille="lg" fleche>
          Créer mon compte
        </Button>
      </form>

      <div className="mt-6">
        <BoutonGoogle onClick={avecGoogle} chargement={envoiGoogle} texte="S’inscrire avec Google" />
      </div>
    </CadreAuth>
  );
}
