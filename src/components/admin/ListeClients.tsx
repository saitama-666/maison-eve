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
          {/* ============ Cartes, sous `lg` ============
              ⚠️  UN TABLEAU QUI GLISSE N'EST PAS UN TABLEAU RESPONSIVE.

                  La version précédente posait `min-w-[720px]` dans un
                  `overflow-x-auto`. Sur 375 px, lire UNE cliente demandait
                  de faire glisser la page horizontalement, colonne par
                  colonne, puis de revenir pour la suivante. Le tableau ne
                  débordait pas de la page — il était juste inutilisable.

                  Cinq colonnes ne rentrent pas sur un téléphone. On
                  change donc de forme, pas d'échelle : une carte par
                  cliente, où chaque valeur porte son propre libellé. */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visibles.map((c) => (
              <li key={c.id} className="carte p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagnepale text-xs text-champagne">
                    {initiales(c.prenom, c.nom, c.email[0]?.toUpperCase() ?? '?')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink">{`${c.prenom} ${c.nom}`.trim() || '—'}</p>
                    <a
                      href={`mailto:${c.email}`}
                      className="block truncate text-sm text-muted transition-colors duration-[140ms] hover:text-champagne"
                    >
                      {c.email}
                    </a>
                  </div>
                  {c.lettre && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-champagne">
                      <Icon nom="check" taille={11} />
                      lettre
                    </span>
                  )}
                </div>

                {c.telephone && (
                  <a
                    href={`tel:${c.telephone}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-[140ms] hover:text-champagne"
                  >
                    <Icon nom="telephone" taille={13} />
                    {c.telephone}
                  </a>
                )}

                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-linesoft pt-3">
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-faint">
                      Rendez-vous
                    </dt>
                    <dd className="text-sm text-ink tabular">{c.nombreRdv}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-faint">
                      Dépensé
                    </dt>
                    <dd className="text-sm text-ink tabular">{prix(c.depense)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-faint">
                      Inscrite
                    </dt>
                    <dd className="text-sm text-muted tabular">
                      {c.inscritLe ? dateCourte(c.inscritLe) : '—'}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {/* ============ Tableau, à partir de `lg` ============ */}
          <div className="carte hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
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
