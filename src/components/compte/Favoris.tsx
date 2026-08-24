'use client';

import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { TitreCompte } from '@/components/compte/CadreCompte';
import { CarteSoin } from '@/components/soins/CarteSoin';
import { EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/catalogue-context';
import { requireDb } from '@/lib/firebase/client';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';

// =====================================================================
//  Soins favoris.
//
//  Firestore ne stocke que des IDENTIFIANTS (`users/{uid}/favorites`). Le
//  nom, le prix et le visuel sont résolus depuis le catalogue déjà en
//  mémoire.
//
//  C'est volontaire : recopier le prix dans le favori le figerait, et la
//  page afficherait un tarif périmé le jour où il change. On ne duplique
//  jamais une donnée qui a une source.
//
//  Conséquence à assumer : un soin retiré du catalogue disparaît des
//  favoris. C'est le bon comportement — on ne propose pas un soin qui
//  n'existe plus.
// =====================================================================

export function Favoris() {
  const { user } = useAuth();
  const services = useServices();
  const toast = useToast();

  const [ids, setIds] = useState<string[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    try {
      const snap = await getDocs(collection(requireDb(), 'users', user.uid, 'favorites'));
      setIds(snap.docs.map((d) => d.id));
    } catch {
      // Silencieux : une page de favoris vide est moins alarmante qu'un
      // bandeau d'erreur rouge.
      setIds([]);
    } finally {
      setChargement(false);
    }
  }, [user]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function retirer(id: string) {
    if (!user) return;
    try {
      await deleteDoc(doc(requireDb(), 'users', user.uid, 'favorites', id));
      setIds((v) => v.filter((x) => x !== id));
      toast.succes('Retiré des favoris.');
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  }

  const favoris = services.filter((s) => ids.includes(s.id));

  return (
    <>
      <TitreCompte
        titre="Mes favoris"
        texte="Les soins que vous avez mis de côté."
        action={
          <Button href="/soins" variante="secondaire" fleche>
            Parcourir les soins
          </Button>
        }
      />

      {chargement ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Squelette key={i} className="h-80" />
          ))}
        </div>
      ) : favoris.length === 0 ? (
        <EtatVide
          icone="coeur"
          titre="Aucun favori"
          texte="Ajoutez un soin à vos favoris depuis sa fiche, pour le retrouver ici."
          action={
            <Button href="/soins" fleche>
              Découvrir les soins
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoris.map((s) => (
            <div
              key={s.id}
              className="surgir relative h-full"
            >
              <CarteSoin service={s} />

              {/* Le bouton est PAR-DESSUS la carte, qui est un lien : d'où
                  le `z-10` et le positionnement absolu. Sans ça, le clic
                  ouvrirait la fiche au lieu de retirer le favori. */}
              <button
                type="button"
                onClick={() => retirer(s.id)}
                aria-label={`Retirer ${s.nom} des favoris`}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card/92 text-danger shadow-soft backdrop-blur-sm transition-colors duration-[140ms] hover:bg-card"
              >
                <Icon nom="coeur" taille={16} className="fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
