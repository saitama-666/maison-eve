'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import { emailValide } from '@/lib/validation';
import { cn } from '@/lib/utils';

// =====================================================================
//  Inscription à la lettre.
//
//  Extrait du pied de page pour une raison précise : le pied de page est
//  sur TOUTES les pages du site. Tant qu'il portait ce formulaire, il
//  était un composant client, et il embarquait donc React, ses états et
//  la couche de notification dans le paquet de chaque page — pour un
//  champ que presque personne ne remplit.
//
//  Seul ce fragment est client désormais. Le reste du pied de page est
//  rendu par le serveur, en HTML pur.
//
//  L'identifiant du document Firestore EST l'adresse en minuscules : une
//  même adresse ne peut donc pas s'inscrire deux fois, et les règles
//  réservent la lecture de la liste à l'administration.
// =====================================================================

export function Lettre() {
  const [email, setEmail] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const toast = useToast();

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValide(email)) {
      toast.erreur('Cette adresse ne semble pas valide.');
      return;
    }

    setEnvoi(true);
    try {
      // Import dynamique : Firestore ne pèse dans le bundle que si
      // quelqu'un s'inscrit réellement. Le pied de page est sur TOUTES les
      // pages — l'y charger d'office coûterait à chaque visite.
      const { doc, serverTimestamp, setDoc } = await import('firebase/firestore');
      const { requireDb } = await import('@/lib/firebase/client');

      const propre = email.trim().toLowerCase();
      await setDoc(doc(requireDb(), 'newsletter', propre), {
        email: propre,
        source: 'pied-de-page',
        createdAt: serverTimestamp(),
      });

      setFait(true);
      setEmail('');
      toast.succes('Merci — vous êtes inscrite.');
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  if (fait) {
    return (
      <p className="flex items-center gap-2 text-sm text-champagnesoft">
        <Icon nom="check" taille={15} />
        Inscription enregistrée.
      </p>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-2">
      <label htmlFor="lettre-email" className="text-xs text-onshellmuted">
        Nos actualités, une fois par mois. Pas plus.
      </label>

      <div className="flex gap-2">
        <input
          id="lettre-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          autoComplete="email"
          required
          /*
            Le champ etait en `bg-white/10` sur le moka, avec du texte creme.
            Mesure : l'espace reserve tombait a 2,48 de contraste, et meme a
            opacite pleine il plafonnait a 4,03 — sous le seuil. Le fond
            translucide produisait un ton trop proche du texte pose dessus.

            Un champ CLAIR a texte espresso resout le probleme par la
            structure plutot que par un reglage d'opacite : 14,2 pour le
            texte saisi, 6,7 pour l'espace reserve. Et sur un pied de page
            sombre, il se voit enfin comme un champ.
          */
          className="h-11 min-w-0 flex-1 rounded-full bg-card px-4 text-sm text-ink placeholder:text-muted ring-1 ring-inset ring-line transition-shadow duration-[140ms] focus:outline-none focus:ring-2 focus:ring-champagnesoft" 
        />
        <button
          type="submit"
          disabled={envoi}
          aria-label="S’inscrire à la lettre"
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne text-surchampagne',
            'transition-[background-color,transform] duration-[140ms] ease-out hover:scale-105 active:scale-95',
            'motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
            envoi && 'opacity-60',
          )}
        >
          <Icon nom={envoi ? 'chargement' : 'fleche-droite'} taille={17} className={cn(envoi && 'animate-spin')} />
        </button>
      </div>
    </form>
  );
}
