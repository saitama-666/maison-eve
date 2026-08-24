'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TitreAdmin } from '@/components/admin/CadreAdmin';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { LIBELLE_STATUT, TON_STATUT, type StatutReservation } from '@/lib/reservations';
import { useToast } from '@/lib/toast';
import { cn, dateHeure, duree, prix } from '@/lib/utils';

// =====================================================================
//  Gestion des rendez-vous.
//
//  L'écran de travail principal de l'institut. La ligne se déplie pour
//  montrer les coordonnées, les adresses et les remarques de la cliente —
//  tout ce qu'il faut pour l'appeler et confirmer, sans changer de page.
//
//  Le changement de statut est OPTIMISTE : l'interface se met à jour
//  immédiatement, puis appelle le serveur. En cas d'échec, elle revient
//  en arrière et affiche l'erreur. Attendre la réponse rendrait le
//  traitement de vingt rendez-vous pénible.
// =====================================================================

type Reservation = {
  id: string;
  reference: string;
  serviceNom: string;
  serviceSlug: string;
  duree: number;
  lieu: 'institut' | 'domicile';
  total: number;
  startAt: string | null;
  status: StatutReservation;
  client: { prenom: string; nom: string; email: string; telephone: string };
  adresseSoin: string | null;
  adresseFacturation: string | null;
  notes: string;
  createdAt: string | null;
};

const FILTRES = [
  { cle: '', label: 'Tous' },
  { cle: 'en-attente', label: 'À confirmer' },
  { cle: 'confirmee', label: 'Confirmés' },
  { cle: 'terminee', label: 'Terminés' },
  { cle: 'annulee', label: 'Annulés' },
] as const;

export function GestionReservations() {
  const parametres = useSearchParams();
  const toast = useToast();

  const [liste, setListe] = useState<Reservation[]>([]);
  const [filtre, setFiltre] = useState<string>(parametres.get('statut') ?? '');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [deplie, setDeplie] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const requete = filtre ? `?statut=${encodeURIComponent(filtre)}` : '';
      const r = await appelAdmin<{ reservations: Reservation[] }>(
        `/api/admin/reservations${requete}`,
      );
      setListe(r.reservations);
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, [filtre]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function changerStatut(id: string, statut: StatutReservation) {
    const avant = liste;
    // Mise à jour optimiste.
    setListe((v) => v.map((r) => (r.id === id ? { ...r, status: statut } : r)));

    try {
      await appelAdmin('/api/admin/reservations', {
        methode: 'PATCH',
        corps: { id, status: statut },
      });
      toast.succes(`Statut : ${LIBELLE_STATUT[statut].toLowerCase()}.`);

      // Si un filtre est actif, la ligne peut ne plus y appartenir.
      if (filtre && filtre !== statut) {
        setListe((v) => v.filter((r) => r.id !== id));
      }
    } catch (e) {
      setListe(avant);
      toast.erreur(e instanceof ErreurAdmin ? e.message : 'Modification impossible.');
    }
  }

  return (
    <>
      <TitreAdmin
        titre="Rendez-vous"
        texte={`${liste.length} rendez-vous affiché${liste.length > 1 ? 's' : ''}.`}
        action={
          <Button variante="secondaire" taille="sm" onClick={charger} chargement={chargement}>
            Actualiser
          </Button>
        }
      />

      {/* --- Filtres --- */}
      <div role="tablist" aria-label="Filtrer par statut" className="mb-6 flex flex-wrap gap-1">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            type="button"
            role="tab"
            aria-selected={filtre === f.cle}
            onClick={() => setFiltre(f.cle)}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm transition-colors duration-[140ms]',
              filtre === f.cle ? 'text-oncream' : 'text-muted hover:text-ink',
            )}
          >
            {/* Pastille du filtre actif. Onglets de largeurs differentes :
                pas d'equivalent CSS propre a un `layoutId`, elle se pose
                directement. */}
            {filtre === f.cle && (
              <span aria-hidden className="absolute inset-0 rounded-full bg-ink" />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      {erreur && (
        <Encart ton="attention" className="mb-6">
          {erreur}
        </Encart>
      )}

      {chargement && liste.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Squelette key={i} className="h-24" />
          ))}
        </div>
      ) : liste.length === 0 ? (
        <EtatVide
          icone="calendrier"
          titre="Aucun rendez-vous"
          texte={
            filtre
              ? 'Aucun rendez-vous avec ce statut. Essayez un autre filtre.'
              : 'Les demandes de rendez-vous apparaîtront ici.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((r) => {
            const ouvert = deplie === r.id;

            return (
              <article key={r.id} className="carte overflow-hidden">
                {/* --- Ligne repliée --- */}
                <button
                  type="button"
                  onClick={() => setDeplie(ouvert ? null : r.id)}
                  aria-expanded={ouvert}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors duration-[140ms] hover:bg-canvas2"
                >
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-[0.625rem] uppercase tracking-[0.1em] ring-1 ring-inset',
                      TON_STATUT[r.status],
                    )}
                  >
                    {LIBELLE_STATUT[r.status]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg leading-tight text-ink">
                      {r.client.prenom} {r.client.nom}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {r.serviceNom} · {r.startAt ? dateHeure(r.startAt) : 'date inconnue'}
                    </p>
                  </div>

                  <span className="hidden shrink-0 sm:block">
                    <Badge icone={r.lieu === 'domicile' ? 'maison' : 'position'}>
                      {r.lieu === 'domicile' ? 'Domicile' : 'Institut'}
                    </Badge>
                  </span>

                  <span className="shrink-0 font-display text-xl text-ink tabular">
                    {prix(r.total)}
                  </span>

                  <span
                    aria-hidden
                    className={cn(
                      'shrink-0 text-muted transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                      ouvert ? 'rotate-90' : 'rotate-0',
                    )}
                  >
                    <Icon nom="chevron-droite" taille={16} />
                  </span>
                </button>

                {/* --- Détail déplié --- */}
                {/* Tiroir : voir la note identique dans BoiteMessages. Ici
                    le detail contient l'adresse et le telephone du client —
                    la raison meme d'ouvrir la ligne. */}
                <div inert={!ouvert} data-ouvert={ouvert ? 'oui' : 'non'} className="tiroir">
                  <div>
                      <div className="border-t border-line p-5">
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* Coordonnées */}
                          <div className="flex flex-col gap-3">
                            <h3 className="surtitre">La cliente</h3>

                            <a
                              href={`tel:${r.client.telephone}`}
                              className="inline-flex items-center gap-2.5 text-sm text-ink transition-colors duration-[140ms] hover:text-champagne"
                            >
                              <Icon nom="telephone" taille={15} className="text-champagne" />
                              {r.client.telephone}
                            </a>

                            <a
                              href={`mailto:${r.client.email}`}
                              className="inline-flex items-center gap-2.5 text-sm text-ink transition-colors duration-[140ms] hover:text-champagne"
                            >
                              <Icon nom="email" taille={15} className="text-champagne" />
                              {r.client.email}
                            </a>

                            <p className="text-xs text-faint tabular">
                              Réf. {r.reference}
                              {r.createdAt && ` · demandé le ${dateHeure(r.createdAt)}`}
                            </p>
                          </div>

                          {/* Détail du soin */}
                          <div className="flex flex-col gap-3">
                            <h3 className="surtitre">Le soin</h3>
                            <p className="text-sm text-ink">
                              {r.serviceNom} · {duree(r.duree)}
                            </p>

                            {r.adresseSoin && (
                              <p className="flex items-start gap-2.5 text-sm text-muted">
                                <Icon
                                  nom="position"
                                  taille={15}
                                  className="mt-0.5 shrink-0 text-champagne"
                                />
                                <span>
                                  <strong className="font-sans font-medium text-ink">
                                    Adresse du soin :
                                  </strong>{' '}
                                  {r.adresseSoin}
                                </span>
                              </p>
                            )}

                            {r.adresseFacturation && (
                              <p className="flex items-start gap-2.5 text-sm text-muted">
                                <Icon
                                  nom="imprimer"
                                  taille={15}
                                  className="mt-0.5 shrink-0 text-champagne"
                                />
                                <span>
                                  <strong className="font-sans font-medium text-ink">
                                    Facturation :
                                  </strong>{' '}
                                  {r.adresseFacturation}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {r.notes && (
                          <div className="mt-5 rounded-md bg-canvas2 px-4 py-3">
                            <h3 className="surtitre mb-1.5">Remarques de la cliente</h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-inksoft">
                              {r.notes}
                            </p>
                          </div>
                        )}

                        {/* --- Actions --- */}
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                          {(
                            [
                              ['confirmee', 'Confirmer'],
                              ['terminee', 'Marquer terminé'],
                              ['absente', 'Non honoré'],
                              ['annulee', 'Annuler'],
                            ] as const
                          ).map(([statut, label]) => (
                            <Button
                              key={statut}
                              taille="sm"
                              variante={
                                statut === 'confirmee'
                                  ? 'principal'
                                  : statut === 'annulee'
                                    ? 'danger'
                                    : 'secondaire'
                              }
                              disabled={r.status === statut}
                              onClick={() => changerStatut(r.id, statut)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
