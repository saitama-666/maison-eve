'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Encart } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Champ, Liste, ZoneTexte } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import {
  estValide,
  validerContact,
  type ChampsContact,
  type Erreurs,
} from '@/lib/validation';

// =====================================================================
//  Formulaire de contact.
//
//  Il écrit dans `messages` via la route `/api/contact`, qui applique une
//  limitation de débit et revalide tout côté serveur.
//
//  ANTI-SPAM : un champ « pot de miel » (`entreprise`), invisible à
//  l'écran mais rempli par la plupart des robots. S'il contient quelque
//  chose, on fait semblant d'avoir envoyé — sans rien enregistrer. Dire
//  « rejeté » apprendrait au robot à contourner le piège.
//
//  Le champ est masqué par du CSS ET marqué `aria-hidden` + `tabindex=-1`
//  pour qu'aucune personne réelle, y compris au lecteur d'écran, ne
//  tombe dessus.
// =====================================================================

const SUJETS = [
  { valeur: 'reservation', label: 'Une réservation' },
  { valeur: 'soins', label: 'Une question sur un soin' },
  { valeur: 'cadeau', label: 'Une carte cadeau' },
  { valeur: 'avis', label: 'Laisser un avis' },
  { valeur: 'suppression', label: 'Mes données personnelles' },
  { valeur: 'autre', label: 'Autre chose' },
];

export function FormulaireContact() {
  const parametres = useSearchParams();
  const { user, profil } = useAuth();
  const toast = useToast();

  const [v, setV] = useState<ChampsContact>({
    nom: '',
    email: '',
    telephone: '',
    sujet: 'reservation',
    message: '',
  });
  const [pot, setPot] = useState('');
  const [erreurs, setErreurs] = useState<Erreurs<ChampsContact>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  // `/contact?sujet=avis` — les liens du site arrivent avec le sujet posé.
  useEffect(() => {
    const sujet = parametres.get('sujet');
    if (sujet && SUJETS.some((s) => s.valeur === sujet)) {
      setV((x) => ({ ...x, sujet }));
    }
  }, [parametres]);

  useEffect(() => {
    if (!user) return;
    setV((x) => ({
      ...x,
      nom: x.nom || `${profil?.firstName ?? ''} ${profil?.lastName ?? ''}`.trim(),
      email: x.email || user.email || '',
      telephone: x.telephone || profil?.phone || '',
    }));
  }, [user, profil]);

  function maj<K extends keyof ChampsContact>(cle: K, valeur: ChampsContact[K]) {
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

    const trouvees = validerContact(v);
    setErreurs(trouvees);
    if (!estValide(trouvees)) return;

    setEnvoi(true);
    try {
      const reponse = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, entreprise: pot }),
      });

      const resultat = await reponse.json();
      if (!reponse.ok) throw new Error(resultat?.error || 'Envoi impossible.');

      setEnvoye(true);
      toast.succes('Message envoyé. On vous répond vite.');
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      /*
        Cet écran est la SEULE confirmation que le message est parti. Il
        partait de `opacity: 0` sous Framer : sans boucle d'animation, on
        envoyait son message et le formulaire disparaissait sans rien
        afficher à la place. On écrit alors une seconde fois, en croyant
        que ça n'a pas marché.
      */
      <div className="surgir carte flex flex-col items-center gap-5 p-8 text-center">
        <div className="surgir-coche flex h-16 w-16 items-center justify-center rounded-full bg-champagnepale/70 text-champagne">
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

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl text-ink">Message envoyé</h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
            On vous répond en général dans la journée. Si c’est urgent, appelez-nous — c’est
            plus rapide.
          </p>
        </div>

        <Button
          variante="secondaire"
          onClick={() => {
            setEnvoye(false);
            setV((x) => ({ ...x, message: '' }));
          }}
        >
          Écrire un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="carte flex flex-col gap-5 p-6 sm:p-8" noValidate>
      <h2 className="font-display text-3xl text-ink">Écrivez-nous</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Votre nom"
          value={v.nom}
          onChange={(e) => maj('nom', e.target.value)}
          erreur={erreurs.nom}
          autoComplete="name"
          required
        />
        <Champ
          label="Téléphone"
          type="tel"
          value={v.telephone}
          onChange={(e) => maj('telephone', e.target.value)}
          erreur={erreurs.telephone}
          facultatif
          autoComplete="tel"
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

      <Liste
        label="À quel sujet ?"
        value={v.sujet}
        onChange={(e) => maj('sujet', e.target.value)}
        options={SUJETS}
      />

      <ZoneTexte
        label="Votre message"
        value={v.message}
        onChange={(e) => maj('message', e.target.value)}
        erreur={erreurs.message}
        rows={6}
        compteur={4000}
        required
      />

      {/* --- Pot de miel --- */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="entreprise">Ne pas remplir</label>
        <input
          id="entreprise"
          name="entreprise"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={pot}
          onChange={(e) => setPot(e.target.value)}
        />
      </div>

      <Encart ton="info">
        Vos coordonnées servent uniquement à vous répondre. Elles ne sont ni revendues, ni
        transmises. Voir la{' '}
        <a href="/confidentialite" className="souligne text-ink">
          politique de confidentialité
        </a>
        .
      </Encart>

      <Button type="submit" chargement={envoi} taille="lg" pleineLargeur fleche>
        Envoyer le message
      </Button>
    </form>
  );
}
