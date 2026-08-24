'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { TitreAdmin } from '@/components/admin/CadreAdmin';
import { Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Champ } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { dateCourte, initiales, prix } from '@/lib/utils';

// =====================================================================
//  Clientes inscrites.
//
//  Une simple liste consultable, avec recherche. Volontairement PAS
//  d'export CSV : un bouton qui déverse toutes les coordonnées dans un
//  fichier est exactement ce qui traîne ensuite sur un bureau ou dans une
//  boîte mail. Si le besoin apparaît, il faudra le tracer et le limiter.
//
//  La recherche filtre CÔTÉ CLIENT sur les données déjà chargées : la
//  liste est plafonnée à 500 entrées par la route, donc c'est instantané
//  et ça n'ajoute aucune requête.
// =====================================================================

type Client = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  lettre: boolean;
  inscritLe: string | null;
  nombreRdv: number;
  depense: number;
};

export function ListeClients() {
  const [liste, setListe] = useState<Client[]>([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const r = await appelAdmin<{ clients: Client[] }>('/api/admin/clients');
      setListe(r.clients);
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter((c) =>
      `${c.prenom} ${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(q),
    );
  }, [liste, recherche]);

  return (
    <>
      <TitreAdmin
        titre="Clientes"
        texte={`${liste.length} compte${liste.length > 1 ? 's' : ''} créé${liste.length > 1 ? 's' : ''}.`}
        action={
          <Button variante="secondaire" taille="sm" onClick={charger} chargement={chargement}>
            Actualiser
          </Button>
        }
      />

      <div className="mb-6 max-w-sm">
        <Champ
          label="Rechercher"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Nom, e-mail, téléphone…"
        />
      </div>

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
      ) : visibles.length === 0 ? (
        <EtatVide
          icone="utilisateur"
          titre={recherche ? 'Aucun résultat' : 'Aucune cliente inscrite'}
          texte={
            recherche
              ? 'Essayez avec un autre terme.'
              : 'Les comptes créés depuis le site apparaîtront ici. On peut réserver sans compte : cette liste ne reflète donc pas toute la clientèle.'
          }
        />
      ) : (
        <>
          {/* Le tableau glisse horizontalement sur petit écran plutôt que
              de déborder de la page. */}
          <div className="carte overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">
                Liste des clientes inscrites, avec leur nombre de rendez-vous et le total
                dépensé.
              </caption>
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3.5 font-sans text-xs uppercase tracking-[0.14em] text-faint">
                    Cliente
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-sans text-xs uppercase tracking-[0.14em] text-faint">
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-sans text-xs uppercase tracking-[0.14em] text-faint">
                    Rendez-vous
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-sans text-xs uppercase tracking-[0.14em] text-faint">
                    Total dépensé
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-sans text-xs uppercase tracking-[0.14em] text-faint">
                    Inscrite le
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-linesoft transition-colors duration-[140ms] last:border-0 hover:bg-canvas2"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagnepale text-xs text-champagne">
                          {initiales(c.prenom, c.nom, c.email[0]?.toUpperCase() ?? '?')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-ink">
                            {`${c.prenom} ${c.nom}`.trim() || '—'}
                          </p>
                          {c.lettre && (
                            <p className="inline-flex items-center gap-1 text-xs text-champagne">
                              <Icon nom="check" taille={11} />
                              lettre
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <a
                        href={`mailto:${c.email}`}
                        className="block truncate text-muted transition-colors duration-[140ms] hover:text-champagne"
                      >
                        {c.email}
                      </a>
                      {c.telephone && (
                        <a
                          href={`tel:${c.telephone}`}
                          className="block truncate text-xs text-faint transition-colors duration-[140ms] hover:text-champagne"
                        >
                          {c.telephone}
                        </a>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right text-ink tabular">{c.nombreRdv}</td>

                    <td className="px-5 py-3.5 text-right text-ink tabular">
                      {prix(c.depense)}
                    </td>

                    <td className="px-5 py-3.5 text-right text-muted tabular">
                      {c.inscritLe ? dateCourte(c.inscritLe) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            Cette liste ne contient que les comptes créés. La réservation étant possible sans
            compte, elle ne reflète pas l’ensemble de la clientèle — les rendez-vous, eux, sont
            tous dans l’onglet « Rendez-vous ».
          </p>
        </>
      )}
    </>
  );
}
