'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TitreCompte } from '@/components/compte/CadreCompte';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import {
  annulable,
  annulationTardive,
  annulerReservation,
  listerMesReservations,
  separerReservations,
  LIBELLE_STATUT,
  TON_STATUT,
  type Reservation,
} from '@/lib/reservations';
import { useToast } from '@/lib/toast';
import { cn, dateHeure, duree, prix } from '@/lib/utils';

// =====================================================================
//  Mes rendez-vous.
//
//  Deux listes séparées — à venir, puis passés. Mélanger les deux oblige
//  à chercher : ce qu'on vient consulter, c'est presque toujours le
//  prochain rendez-vous.
//
//  L'annulation demande une confirmation en ligne, et PRÉVIENT quand elle
//  est tardive (moins de 24 h). La cliente doit savoir avant de cliquer
//  que la praticienne a déjà bloqué son créneau.
// =====================================================================

export function MesReservations() {
  const { user } = useAuth();
  const toast = useToast();

  const [liste, setListe] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const recharger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    try {
      setListe(await listerMesReservations(user.uid));
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  async function annuler(id: string) {
    setEnvoi(true);
    try {
      await annulerReservation(id);
      toast.succes('Rendez-vous annulé.');
      setAAnnuler(null);
      await recharger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  const { aVenir, passees } = separerReservations(liste);

  return (
    <>
      <TitreCompte
        titre="Mes rendez-vous"
        texte="Vos séances à venir et l’historique de vos soins."
        action={
          <Button href="/reservation" fleche>
            Nouveau rendez-vous
          </Button>
        }
      />

      {chargement ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <Squelette key={i} className="h-36" />
          ))}
        </div>
      ) : liste.length === 0 ? (
        <EtatVide
          icone="calendrier"
          titre="Aucun rendez-vous pour l’instant"
          texte="Vos réservations apparaîtront ici, avec leur statut et leur récapitulatif."
          action={
            <Button href="/soins" fleche>
              Découvrir les soins
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {/* ============ À venir ============ */}
          <section>
            <h2 className="surtitre mb-4">
              À venir {aVenir.length > 0 && <span className="tabular">({aVenir.length})</span>}
            </h2>

            {aVenir.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-5 py-8 text-center text-sm text-faint">
                Aucun rendez-vous à venir.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {aVenir.map((r) => (
                  <CarteReservation
                    key={r.id}
                    r={r}
                    aAnnuler={aAnnuler}
                    setAAnnuler={setAAnnuler}
                    annuler={annuler}
                    envoi={envoi}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ============ Historique ============ */}
          {passees.length > 0 && (
            <section>
              <h2 className="surtitre mb-4">
                Historique <span className="tabular">({passees.length})</span>
              </h2>
              <div className="flex flex-col gap-4">
                {passees.map((r) => (
                  <CarteReservation
                    key={r.id}
                    r={r}
                    aAnnuler={aAnnuler}
                    setAAnnuler={setAAnnuler}
                    annuler={annuler}
                    envoi={envoi}
                    terne
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function CarteReservation({
  r,
  aAnnuler,
  setAAnnuler,
  annuler,
  envoi,
  terne,
}: {
  r: Reservation;
  aAnnuler: string | null;
  setAAnnuler: (id: string | null) => void;
  annuler: (id: string) => void;
  envoi: boolean;
  terne?: boolean;
}) {
  const peutAnnuler = annulable(r);
  const tardif = annulationTardive(r);

  return (
    <article
      className={cn('surgir', 'carte p-5', terne && 'opacity-75')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ring-1 ring-inset',
                TON_STATUT[r.status],
              )}
            >
              {LIBELLE_STATUT[r.status]}
            </span>
            <Badge icone={r.lieu === 'domicile' ? 'maison' : 'position'}>
              {r.lieu === 'domicile' ? 'À domicile' : 'En institut'}
            </Badge>
            <span className="text-xs text-faint tabular">Réf. {r.reference}</span>
          </div>

          <h3 className="font-display text-2xl leading-tight text-ink">
            {r.serviceSlug ? (
              <Link
                href={`/soins/${r.serviceSlug}`}
                className="transition-colors duration-[140ms] hover:text-champagne"
              >
                {r.serviceNom}
              </Link>
            ) : (
              r.serviceNom
            )}
          </h3>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon nom="calendrier" taille={14} className="text-champagne" />
              {r.startAt ? dateHeure(r.startAt) : '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon nom="horloge" taille={14} className="text-champagne" />
              {duree(r.duree)}
            </span>
          </div>

          {r.adresseSoin && (
            <p className="flex items-start gap-1.5 text-sm text-muted">
              <Icon nom="position" taille={14} className="mt-0.5 shrink-0 text-champagne" />
              {r.adresseSoin}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <span className="font-display text-3xl text-ink tabular">{prix(r.total)}</span>

          {peutAnnuler && aAnnuler !== r.id && (
            <button
              type="button"
              onClick={() => setAAnnuler(r.id)}
              className="text-sm text-muted underline-offset-4 transition-colors duration-[140ms] hover:text-danger hover:underline"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* --- Confirmation d'annulation --- */}
        {aAnnuler === r.id && (
          <div
            className="surgir overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              {tardif ? (
                <Encart ton="attention" titre="Annulation tardive">
                  Le rendez-vous est dans moins de 24 heures. La praticienne a déjà bloqué son
                  créneau — appelez-nous plutôt, on trouvera une solution.
                </Encart>
              ) : (
                <p className="text-sm text-ink">
                  Annuler ce rendez-vous ? Cette action est définitive.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  taille="sm"
                  variante="danger"
                  chargement={envoi}
                  onClick={() => annuler(r.id)}
                >
                  Confirmer l’annulation
                </Button>
                <Button taille="sm" variante="fantome" onClick={() => setAAnnuler(null)}>
                  Garder le rendez-vous
                </Button>
              </div>
            </div>
          </div>
        )}
    </article>
  );
}
