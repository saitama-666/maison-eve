'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TitreAdmin } from '@/components/admin/CadreAdmin';
import {
  AnneauLieu,
  BarresSoins,
  CourbeReservations,
  Tuile,
  TuileMontant,
} from '@/components/admin/Graphiques';
import { Encart, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';

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

          {/* --- Chiffres clés --- */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Tuile
              label="Rendez-vous à venir"
              valeur={donnees.aVenir}
              note={`${donnees.total} au total sur la période`}
              ton="champagne"
            />
            <TuileMontant
              label="Encaissé"
              montant={donnees.encaisse}
              note="soins terminés uniquement"
              ton="succes"
            />
            <TuileMontant
              label="Attendu"
              montant={donnees.attendu}
              note="rendez-vous à venir non annulés"
            />
            <Tuile label="Clientes inscrites" valeur={donnees.clients} note="comptes créés" />
          </div>

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
