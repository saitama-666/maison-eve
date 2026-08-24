'use client';

import { useCallback, useEffect, useState } from 'react';

import { TitreAdmin } from '@/components/admin/CadreAdmin';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { useToast } from '@/lib/toast';
import { cn, dateHeure } from '@/lib/utils';

// =====================================================================
//  Boîte de réception du formulaire de contact.
//
//  Un message s'ouvre en se dépliant, et passe automatiquement de
//  « nouveau » à « lu » à la première ouverture. C'est le comportement
//  qu'on attend d'une boîte mail : personne ne pense à cliquer sur
//  « marquer comme lu ».
//
//  La suppression est DÉFINITIVE et le dit. Elle sert à honorer une
//  demande d'effacement de données personnelles : un archivage silencieux
//  ne répondrait pas à la demande, il la masquerait.
// =====================================================================

type Message = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  sujet: string;
  message: string;
  statut: 'nouveau' | 'lu' | 'traite';
  recuLe: string | null;
};

const LIBELLE_SUJET: Record<string, string> = {
  reservation: 'Une réservation',
  soins: 'Question sur un soin',
  domicile: 'Soin à domicile',
  cadeau: 'Carte cadeau',
  avis: 'Avis',
  suppression: 'Données personnelles',
  autre: 'Autre',
};

export function BoiteMessages() {
  const toast = useToast();

  const [liste, setListe] = useState<Message[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const r = await appelAdmin<{ messages: Message[] }>('/api/admin/messages');
      setListe(r.messages);
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function changerStatut(id: string, statut: Message['statut'], silencieux = false) {
    const avant = liste;
    setListe((v) => v.map((m) => (m.id === id ? { ...m, statut } : m)));

    try {
      await appelAdmin('/api/admin/messages', { methode: 'PATCH', corps: { id, statut } });
      if (!silencieux) toast.succes('Message mis à jour.');
    } catch (e) {
      setListe(avant);
      if (!silencieux) {
        toast.erreur(e instanceof ErreurAdmin ? e.message : 'Modification impossible.');
      }
    }
  }

  function ouvrir(m: Message) {
    const suivant = ouvert === m.id ? null : m.id;
    setOuvert(suivant);

    // Passage automatique en « lu ». Silencieux : afficher une
    // notification à chaque ouverture serait insupportable.
    if (suivant && m.statut === 'nouveau') {
      void changerStatut(m.id, 'lu', true);
    }
  }

  async function supprimer(id: string) {
    try {
      await appelAdmin(`/api/admin/messages?id=${encodeURIComponent(id)}`, {
        methode: 'DELETE',
      });
      setListe((v) => v.filter((m) => m.id !== id));
      setASupprimer(null);
      toast.succes('Message supprimé définitivement.');
    } catch (e) {
      toast.erreur(e instanceof ErreurAdmin ? e.message : 'Suppression impossible.');
    }
  }

  const nonLus = liste.filter((m) => m.statut === 'nouveau').length;

  return (
    <>
      <TitreAdmin
        titre="Messages"
        texte={
          nonLus > 0
            ? `${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}.`
            : 'Tout est lu.'
        }
        action={
          <Button variante="secondaire" taille="sm" onClick={charger} chargement={chargement}>
            Actualiser
          </Button>
        }
      />

      {erreur && (
        <Encart ton="attention" className="mb-6">
          {erreur}
        </Encart>
      )}

      {chargement && liste.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Squelette key={i} className="h-20" />
          ))}
        </div>
      ) : liste.length === 0 ? (
        <EtatVide
          icone="email"
          titre="Aucun message"
          texte="Les messages envoyés depuis la page Contact arriveront ici."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((m) => {
            const estOuvert = ouvert === m.id;

            return (
              <article
                key={m.id}
                className={cn(
                  'carte overflow-hidden',
                  m.statut === 'nouveau' && 'ring-1 ring-inset ring-champagne/35',
                )}
              >
                <button
                  type="button"
                  onClick={() => ouvrir(m)}
                  aria-expanded={estOuvert}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors duration-[140ms] hover:bg-canvas2"
                >
                  {/* Pastille de non-lu — plus lisible qu'un texte en gras,
                      et visible d'un coup d'œil sur une longue liste. */}
                  <span
                    aria-hidden
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      m.statut === 'nouveau' ? 'bg-champagne' : 'bg-transparent',
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate leading-tight',
                        m.statut === 'nouveau' ? 'font-sans text-ink' : 'text-inksoft',
                      )}
                    >
                      {m.nom}
                    </p>
                    <p className="truncate text-xs text-muted">{m.message}</p>
                  </div>

                  <span className="hidden shrink-0 sm:block">
                    <Badge>{LIBELLE_SUJET[m.sujet] ?? m.sujet ?? 'Message'}</Badge>
                  </span>

                  {m.statut === 'traite' && (
                    <span className="shrink-0 text-success">
                      <Icon nom="check" taille={16} />
                    </span>
                  )}

                  <span className="hidden shrink-0 text-xs text-faint tabular md:block">
                    {m.recuLe ? dateHeure(m.recuLe) : ''}
                  </span>

                  <span
                    aria-hidden
                    className={cn(
                      'shrink-0 text-muted transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                      estOuvert ? 'rotate-90' : 'rotate-0',
                    )}
                  >
                    <Icon nom="chevron-droite" taille={16} />
                  </span>
                </button>

                {/* Tiroir : la hauteur passe par `grid-template-rows`
                    (classe `.tiroir`), l'etat ferme par `inert`. Il partait
                    de `{ height: 0, opacity: 0 }` sous Framer : le message
                    ne s'ouvrait jamais si la boucle d'animation ne tournait
                    pas. */}
                <div inert={!estOuvert} data-ouvert={estOuvert ? 'oui' : 'non'} className="tiroir">
                  <div>
                      <div className="border-t border-line p-5">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <a
                            href={`mailto:${m.email}`}
                            className="inline-flex items-center gap-2 text-ink transition-colors duration-[140ms] hover:text-champagne"
                          >
                            <Icon nom="email" taille={15} className="text-champagne" />
                            {m.email}
                          </a>

                          {m.telephone && (
                            <a
                              href={`tel:${m.telephone}`}
                              className="inline-flex items-center gap-2 text-ink transition-colors duration-[140ms] hover:text-champagne"
                            >
                              <Icon nom="telephone" taille={15} className="text-champagne" />
                              {m.telephone}
                            </a>
                          )}

                          {m.recuLe && (
                            <span className="inline-flex items-center gap-2 text-muted">
                              <Icon nom="horloge" taille={15} className="text-champagne" />
                              {dateHeure(m.recuLe)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 rounded-md bg-canvas2 px-4 py-3.5">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-inksoft">
                            {m.message}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                          <Button
                            taille="sm"
                            href={`mailto:${m.email}?subject=${encodeURIComponent(
                              `Re: ${LIBELLE_SUJET[m.sujet] ?? 'Votre message'} — MAISON EVE`,
                            )}`}
                            externe
                            fleche
                          >
                            Répondre
                          </Button>

                          <Button
                            taille="sm"
                            variante="secondaire"
                            disabled={m.statut === 'traite'}
                            onClick={() => changerStatut(m.id, 'traite')}
                          >
                            Marquer traité
                          </Button>

                          {aSupprimer === m.id ? (
                            <>
                              <Button
                                taille="sm"
                                variante="danger"
                                onClick={() => supprimer(m.id)}
                              >
                                Confirmer la suppression
                              </Button>
                              <Button
                                taille="sm"
                                variante="fantome"
                                onClick={() => setASupprimer(null)}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <Button
                              taille="sm"
                              variante="fantome"
                              onClick={() => setASupprimer(m.id)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </div>

                        {aSupprimer === m.id && (
                          <p className="mt-3 text-xs text-danger">
                            La suppression est définitive : le message ne sera pas archivé.
                          </p>
                        )}
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
