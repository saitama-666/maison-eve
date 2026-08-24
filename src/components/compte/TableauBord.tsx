'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TitreCompte } from '@/components/compte/CadreCompte';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon, type NomIcone } from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';
import { listerAdresses } from '@/lib/addresses';
import {
  listerMesReservations,
  separerReservations,
  LIBELLE_STATUT,
  TON_STATUT,
  type Reservation,
} from '@/lib/reservations';
import { cn, dateHeure, duree, prix } from '@/lib/utils';

// =====================================================================
//  Tableau de bord de l'espace client.
//
//  Il répond à une seule question : « c'est quand, mon prochain
//  rendez-vous ? ». Tout le reste est secondaire et tient en raccourcis.
//
//  Les erreurs de chargement sont AVALÉES volontairement : le tableau de
//  bord est une page de confort. Afficher un message d'échec rouge parce
//  qu'un compteur n'a pas pu se calculer inquiéterait pour rien — les
//  pages dédiées, elles, signalent leurs erreurs.
// =====================================================================

export function TableauBord() {
  const { user, profil } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [nbAdresses, setNbAdresses] = useState(0);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    try {
      const [r, a] = await Promise.all([
        listerMesReservations(user.uid).catch(() => [] as Reservation[]),
        listerAdresses(user.uid).catch(() => []),
      ]);
      setReservations(r);
      setNbAdresses(a.length);
    } finally {
      setChargement(false);
    }
  }, [user]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const { aVenir, passees } = separerReservations(reservations);
  const prochain = aVenir[0];
  const prenom = profil?.firstName;

  return (
    <>
      <TitreCompte
        titre={prenom ? `Bonjour ${prenom}` : 'Votre espace'}
        texte="Vos rendez-vous, vos adresses et vos préférences."
        action={
          <Button href="/reservation" fleche>
            Réserver
          </Button>
        }
      />

      {/* --- E-mail non vérifié ---
          Firebase le sait dès la connexion : autant le dire ici plutôt
          que de laisser la personne découvrir plus tard que ses e-mails
          de confirmation n'arrivent pas. */}
      {user && !user.emailVerified && (
        <Encart ton="attention" titre="Adresse e-mail non confirmée" className="mb-8">
          Un lien de confirmation vous a été envoyé à {user.email}. Sans cette confirmation,
          vous risquez de ne pas recevoir les rappels de rendez-vous.
        </Encart>
      )}

      {/* --- Prochain rendez-vous --- */}
      <section className="mb-10">
        <h2 className="surtitre mb-4">Prochain rendez-vous</h2>

        {chargement ? (
          <Squelette className="h-40" />
        ) : !prochain ? (
          <EtatVide
            icone="calendrier"
            titre="Rien de prévu"
            texte="Le moment est peut-être bien choisi pour réserver une parenthèse."
            action={
              <Button href="/soins" fleche>
                Voir les soins
              </Button>
            }
          />
        ) : (
          <div
            className="surgir carte overflow-hidden"
          >
            {/* Bandeau champagne : le rendez-vous à venir doit se
                distinguer immédiatement du reste de la page. */}
            <div className="h-1 bg-champagne" aria-hidden />

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ring-1 ring-inset',
                      TON_STATUT[prochain.status],
                    )}
                  >
                    {LIBELLE_STATUT[prochain.status]}
                  </span>
                  <Badge icone={prochain.lieu === 'domicile' ? 'maison' : 'position'}>
                    {prochain.lieu === 'domicile' ? 'À domicile' : 'En institut'}
                  </Badge>
                </div>

                <h3 className="font-display text-3xl leading-tight text-ink">
                  {prochain.serviceNom}
                </h3>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon nom="calendrier" taille={14} className="text-champagne" />
                    {prochain.startAt ? dateHeure(prochain.startAt) : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon nom="horloge" taille={14} className="text-champagne" />
                    {duree(prochain.duree)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className="font-display text-3xl text-ink tabular">
                  {prix(prochain.total)}
                </span>
                <Link
                  href="/compte/reservations"
                  className="inline-flex items-center gap-1.5 text-sm text-champagne transition-colors duration-[140ms] hover:text-ink"
                >
                  Voir le détail
                  <Icon nom="fleche-droite" taille={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* --- Raccourcis --- */}
      <section>
        <h2 className="surtitre mb-4">Raccourcis</h2>

        <RevealGroup intervalle={0.06} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Raccourci
            href="/compte/reservations"
            icone="calendrier"
            titre="Rendez-vous"
            valeur={chargement ? '—' : String(aVenir.length)}
            note={`${passees.length} passé${passees.length > 1 ? 's' : ''}`}
          />
          <Raccourci
            href="/compte/adresses"
            icone="position"
            titre="Adresses"
            valeur={chargement ? '—' : String(nbAdresses)}
            note="facturation et soin"
          />
          <Raccourci
            href="/compte/favoris"
            icone="coeur"
            titre="Favoris"
            valeur="—"
            note="vos soins préférés"
          />
          <Raccourci
            href="/compte/parametres"
            icone="utilisateur"
            titre="Profil"
            valeur=""
            note="coordonnées et mot de passe"
          />
        </RevealGroup>
      </section>
    </>
  );
}

function Raccourci({
  href,
  icone,
  titre,
  valeur,
  note,
}: {
  href: string;
  icone: NomIcone;
  titre: string;
  valeur: string;
  note: string;
}) {
  return (
    <RevealItem className="h-full">
      <div className="h-full">
        <Link
          href={href}
          className="carte group flex h-full flex-col gap-3 p-5 transition-[box-shadow,transform] duration-[240ms] ease-out hover:-translate-y-1 hover:shadow-soft active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas2 text-champagne">
            <Icon nom={icone} taille={19} />
          </span>

          <div className="flex flex-1 flex-col">
            <span className="text-sm text-muted">{titre}</span>
            {valeur && (
              <span className="font-display text-3xl leading-tight text-ink tabular">
                {valeur}
              </span>
            )}
            <span className="mt-auto pt-1 text-xs text-faint">{note}</span>
          </div>

          <Icon
            nom="fleche-droite"
            taille={15}
            className="text-champagne transition-transform duration-[140ms] group-hover:translate-x-1"
          />
        </Link>
      </div>
    </RevealItem>
  );
}
