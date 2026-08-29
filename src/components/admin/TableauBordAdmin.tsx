'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Agenda } from '@/components/admin/Agenda';
import { TitreAdmin } from '@/components/admin/CadreAdmin';
import { AnneauLieu, BarresSoins, CourbeReservations } from '@/components/admin/Graphiques';
import {
  ChiffreTuile,
  CourbeMinuscule,
  GrilleTuiles,
  PuceVariation,
  TuileBord,
} from '@/components/admin/TuilesBord';
import { Encart, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { prix } from '@/lib/utils';

// =====================================================================
//  Tableau de bord du back-office.
//
//  Il répond à trois questions, dans cet ordre :
//   1. Y a-t-il quelque chose à traiter maintenant ? (demandes en attente,
//      messages non lus)
//   2. Comment ça se passe ? (rendez-vous, chiffre d'affaires)
//   3. Qu'est-ce qui marche ? (soins les plus réservés, domicile vs institut)
//
//  Les demandes en attente sont EN HAUT et en couleur d'alerte : une
//  réservation non confirmée est une cliente qui attend un appel.
// =====================================================================

type Apercu = {
  total: number;
  parStatut: Record<string, number>;
  encaisse: number;
  attendu: number;
  aVenir: number;
  messagesNonLus: number;
  clients: number;
  serie: { jour: string; nombre: number; montant: number }[];
  soinsPopulaires: { nom: string; nombre: number }[];
  repartitionLieu: { domicile: number; institut: number };

  aujourdhui: {
    nombre: number;
    prochain: { heure: string; soin: string; cliente: string } | null;
  };
  dernier: { jour: string; heure: string } | null;
  revenu: {
    mois: number;
    moisPrecedent: number;
    /** `null` quand le mois précédent est à zéro : une variation sur une
     *  base vide n'a pas de sens, et se lit pourtant comme un fait. */
    variation: number | null;
    courbe: number[];
  };
  demandes: { id: string; nom: string; extrait: string }[];
};

export function TableauBordAdmin() {
  const [donnees, setDonnees] = useState<Apercu | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setDonnees(await appelAdmin<Apercu>('/api/admin/apercu'));
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const enAttente = donnees?.parStatut['en-attente'] ?? 0;

  return (
    <>
      <TitreAdmin
        titre="Tableau de bord"
        texte="Les 180 derniers jours."
        action={
          <Button variante="secondaire" taille="sm" onClick={charger} chargement={chargement}>
            Actualiser
          </Button>
        }
      />

      {erreur && (
        <Encart ton="attention" titre="Impossible de charger les chiffres" className="mb-6">
          {erreur}
        </Encart>
      )}

      {chargement && !donnees ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Squelette key={i} className="h-32" />
          ))}
        </div>
      ) : donnees ? (
        <div className="flex flex-col gap-7">
          {/* --- À traiter --- */}
          {(enAttente > 0 || donnees.messagesNonLus > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {enAttente > 0 && (
                <Link href="/admin/reservations?statut=en-attente" className="block">
                  <div className="carte flex items-center gap-4 p-5 ring-1 ring-inset ring-warning/30 transition-shadow duration-[240ms] hover:shadow-soft">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
                      <Icon nom="alerte" taille={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl text-ink tabular">{enAttente}</p>
                      <p className="text-sm text-muted">
                        demande{enAttente > 1 ? 's' : ''} à confirmer
                      </p>
                    </div>
                    <Icon nom="fleche-droite" taille={17} className="shrink-0 text-champagne" />
                  </div>
                </Link>
              )}

              {donnees.messagesNonLus > 0 && (
                <Link href="/admin/messages" className="block">
                  <div className="carte flex items-center gap-4 p-5 ring-1 ring-inset ring-champagne/30 transition-shadow duration-[240ms] hover:shadow-soft">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagnepale/60 text-champagne">
                      <Icon nom="email" taille={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl text-ink tabular">
                        {donnees.messagesNonLus}
                      </p>
                      <p className="text-sm text-muted">
                        message{donnees.messagesNonLus > 1 ? 's' : ''} non lu
                        {donnees.messagesNonLus > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Icon nom="fleche-droite" taille={17} className="shrink-0 text-champagne" />
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* --- Les quatre tuiles de tête --- */}
          <GrilleTuiles>
            <TuileBord
              titre="Rendez-vous du jour"
              href="/admin/reservations"
              libelleLien="Voir tous les rendez-vous"
              contexte={
                donnees.aujourdhui.prochain
                  ? `Prochain : ${donnees.aujourdhui.prochain.heure} — ${donnees.aujourdhui.prochain.soin}${
                      donnees.aujourdhui.prochain.cliente
                        ? ` avec ${donnees.aujourdhui.prochain.cliente}`
                        : ''
                    }`
                  : 'Plus rien de prévu aujourd’hui.'
              }
            >
              <ChiffreTuile
                valeur={String(donnees.aujourdhui.nombre).padStart(2, '0')}
                legende={`rendez-vous aujourd’hui${
                  donnees.aujourdhui.nombre > 1 ? '' : ''
                }`}
              />
            </TuileBord>

            <TuileBord
              titre="Total des rendez-vous"
              href="/admin/reservations"
              libelleLien="Voir tous les rendez-vous"
              contexte={
                donnees.dernier
                  ? `Dernier pris : ${donnees.dernier.jour} — ${donnees.dernier.heure}`
                  : 'Aucun rendez-vous enregistré.'
              }
            >
              <ChiffreTuile valeur={donnees.total} legende="sur les 180 derniers jours" />
            </TuileBord>

            <TuileBord
              titre="Chiffre du mois"
              href="/admin/reservations?statut=terminee"
              libelleLien="Voir les soins terminés"
              contexte={
                <CourbeMinuscule
                  valeurs={donnees.revenu.courbe}
                  hausse={(donnees.revenu.variation ?? 0) >= 0}
                />
              }
            >
              <ChiffreTuile
                valeur={prix(donnees.revenu.mois)}
                legende={
                  donnees.revenu.variation === null
                    ? 'aucun encaissement le mois précédent'
                    : `${donnees.revenu.variation >= 0 ? 'de plus' : 'de moins'} que le mois dernier`
                }
                puce={
                  donnees.revenu.variation === null ? undefined : (
                    <PuceVariation variation={donnees.revenu.variation} />
                  )
                }
              />
            </TuileBord>

            <TuileBord
              titre="Nouvelles demandes"
              href="/admin/messages"
              libelleLien="Voir les messages"
              contexte={
                donnees.demandes.length > 0 ? (
                  <span className="flex flex-col gap-2">
                    {donnees.demandes.slice(0, 2).map((d) => (
                      <span key={d.id} className="block">
                        <span className="block truncate text-[0.8125rem] text-ink">{d.nom}</span>
                        <span className="block truncate text-[0.75rem] text-muted">
                          « {d.extrait} »
                        </span>
                      </span>
                    ))}
                  </span>
                ) : (
                  'Aucun message en attente.'
                )
              }
            >
              <ChiffreTuile
                valeur={donnees.messagesNonLus}
                legende={`message${donnees.messagesNonLus > 1 ? 's' : ''} non lu${
                  donnees.messagesNonLus > 1 ? 's' : ''
                }`}
              />
            </TuileBord>
          </GrilleTuiles>

          {/* --- Agenda --- */}
          <Agenda />

          {/* --- Courbe --- */}
          <section className="carte p-6">
            <h2 className="mb-5 font-display text-2xl text-ink">Activité</h2>
            <CourbeReservations serie={donnees.serie} />
          </section>

          {/* --- Soins + répartition --- */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="carte p-6">
              <h2 className="mb-5 font-display text-2xl text-ink">Soins les plus réservés</h2>
              <BarresSoins donnees={donnees.soinsPopulaires} />
            </section>

            <section className="carte p-6">
              <h2 className="mb-5 font-display text-2xl text-ink">Institut ou domicile</h2>
              <AnneauLieu
                institut={donnees.repartitionLieu.institut}
                domicile={donnees.repartitionLieu.domicile}
              />
            </section>
          </div>

          {/* --- Détail par statut --- */}
          <section className="carte p-6">
            <h2 className="mb-5 font-display text-2xl text-ink">Répartition par statut</h2>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                ['en-attente', 'En attente'],
                ['confirmee', 'Confirmés'],
                ['terminee', 'Terminés'],
                ['annulee', 'Annulés'],
                ['absente', 'Non honorés'],
              ].map(([cle, label]) => (
                <div key={cle} className="flex flex-col gap-0.5">
                  <span className="font-display text-3xl text-ink tabular">
                    {donnees.parStatut[cle] ?? 0}
                  </span>
                  <span className="text-xs text-muted">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
