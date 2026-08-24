'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BoutonGoogle, CadreAuth } from '@/components/auth/CadreAuth';
import { Encart } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Champ, ChampMotDePasse } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import { estValide, validerConnexion, type Erreurs } from '@/lib/validation';

// =====================================================================
//  Connexion.
//
//  Le paramètre `?suite=/compte/adresses` renvoie la personne là où elle
//  allait avant d'être arrêtée par la connexion.
//
//  ⚠️  `suite` est une entrée CONTRÔLÉE PAR L'UTILISATEUR. On n'accepte
//      qu'un chemin interne commençant par `/` et ne commençant PAS par
//      `//`. Sans ce filtre, `?suite=//site-malveillant.tld` produirait
//      une redirection ouverte : un lien qui a l'air d'aller sur MAISON
//      EVE et qui envoie ailleurs juste après la saisie du mot de passe.
// =====================================================================

function destinationSure(brut: string | null): string {
  if (!brut) return '/compte';
  if (!brut.startsWith('/')) return '/compte';
  if (brut.startsWith('//')) return '/compte';
  return brut;
}

/**
 * Lit `?suite=` au moment où on en a besoin, pas pendant le rendu.
 *
 * `useSearchParams()` force Next à mettre TOUT l'arbre derrière une
 * frontière `<Suspense>` : le HTML servi ne contenait alors qu'un écran
 * de chargement, sans `<h1>` ni formulaire, en attendant l'hydratation.
 * Sur un écran de connexion, c'est le pire endroit pour ça.
 *
 * Le paramètre ne sert qu'après une action (redirection post-connexion),
 * donc le lire à ce moment-là suffit — et la page redevient rendue par le
 * serveur.
 */
function destinationDemandee(): string {
  if (typeof window === 'undefined') return '/compte';
  return destinationSure(new URLSearchParams(window.location.search).get('suite'));
}

export function FormulaireConnexion() {
  const router = useRouter();
  const { connexion, connexionGoogle, user, chargement, disponible } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreurs, setErreurs] = useState<Erreurs<{ email: string; motDePasse: string }>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoiGoogle, setEnvoiGoogle] = useState(false);

  // Déjà connectée : on ne montre pas un formulaire de connexion à
  // quelqu'un qui est connecté.
  useEffect(() => {
    if (!chargement && user) router.replace(destinationDemandee());
  }, [chargement, user, router]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();

    const trouvees = validerConnexion({ email, motDePasse });
    setErreurs(trouvees);
    if (!estValide(trouvees)) return;

    setEnvoi(true);
    try {
      await connexion(email.trim(), motDePasse);
      toast.succes('Bon retour parmi nous.');
      router.replace(destinationDemandee());
    } catch (err) {
      toast.erreur(messageErreur(err));
      setEnvoi(false);
    }
  }

  async function avecGoogle() {
    setEnvoiGoogle(true);
    try {
      await connexionGoogle();
      toast.succes('Connexion réussie.');
      router.replace(destinationDemandee());
    } catch (err) {
      toast.erreur(messageErreur(err));
      setEnvoiGoogle(false);
    }
  }

  return (
    <CadreAuth
      titre="Content de vous revoir"
      sousTitre="Connectez-vous pour retrouver vos rendez-vous et vos adresses."
      pied={
        <>
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="souligne text-ink">
            Créer un compte
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
        <Champ
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erreur={erreurs.email}
          autoComplete="email"
          autoFocus
          required
        />

        <div className="flex flex-col gap-2">
          <ChampMotDePasse
            label="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            erreur={erreurs.motDePasse}
            autoComplete="current-password"
            required
          />
          <Link
            href="/mot-de-passe-oublie"
            className="self-end text-xs text-muted transition-colors duration-[140ms] hover:text-ink"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" chargement={envoi} pleineLargeur taille="lg" fleche>
          Se connecter
        </Button>
      </form>

      <div className="mt-6">
        <BoutonGoogle onClick={avecGoogle} chargement={envoiGoogle} />
      </div>
    </CadreAuth>
  );
}
