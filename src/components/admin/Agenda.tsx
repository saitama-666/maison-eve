'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Encart, Squelette } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { cleJourLocale, instantLocal, partiesLocales } from '@/lib/fuseau';
import { cn } from '@/lib/utils';

// =====================================================================
//  Agenda des rendez-vous.
//
//  Deux formes pour une même semaine, et c'est délibéré :
//
//   · À partir de `lg` — une GRILLE : sept colonnes de jours, les heures
//     en lignes. On voit les trous, les chevauchements, les journées
//     chargées. C'est ce qu'on veut d'un agenda sur un écran large.
//
//   · En dessous — une LISTE d'un seul jour. Sept colonnes sur 375 px
//     donnent 45 px par jour : ni le nom de la cliente ni l'heure n'y
//     tiennent, et le texte se réduit à des barres de couleur. Mieux vaut
//     un jour lisible que sept illisibles. Le sélecteur de jour reste
//     visible au-dessus, donc rien n'est perdu — on change de jour d'un
//     geste au lieu de tout voir mal.
//
//  ⚠️  LES HEURES SONT CELLES DE L'INSTITUT (`Africa/Casablanca`), pas
//      celles du navigateur ni du serveur. Une gérante en déplacement, ou
//      Vercel qui exécute à Washington, ne doivent pas décaler l'agenda.
//      D'où `partiesLocales` partout, et jamais `getHours()`.
// =====================================================================

/** Plage horaire affichée. L'institut ouvre de 10 h à 20 h ; on déborde
 *  d'une heure de chaque côté pour que les extrêmes ne collent pas au bord. */
const HEURE_DEBUT = 9;
const HEURE_FIN = 21;
const HAUTEUR_HEURE = 60; // px

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS_LONGS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Reservation = {
  id: string;
  reference: string;
  serviceNom: string;
  startAt: string;
  endAt: string;
  status: string;
  lieu: string;
  notes: string;
  client: { prenom: string; nom: string };
};

/**
 * Aplats des rendez-vous, repris de la maquette : des pastels francs,
 * un par statut.
 *
 * Le statut n'est PAS porte par la seule couleur — chaque bloc affiche
 * aussi son libelle. Une gerante daltonienne, ou un ecran mal calibre,
 * ne doivent pas empecher de distinguer un rendez-vous confirme d'un
 * rendez-vous annule.
 */
const TONS: Record<string, string> = {
  'en-attente': 'bg-rdvjaune text-ink ring-champagne/25',
  confirmee: 'bg-rdvbleu text-ink ring-selection/20',
  terminee: 'bg-rdvvert text-ink ring-success/20',
  annulee: 'bg-canvas2 text-faint ring-line',
  absente: 'bg-rdvrouge text-ink ring-danger/20',
};

const LIBELLE_STATUT: Record<string, string> = {
  'en-attente': 'À confirmer',
  confirmee: 'Confirmé',
  terminee: 'Terminé',
  annulee: 'Annulé',
  absente: 'Non honoré',
};

/**
 * Position du jour dans une semaine qui COMMENCE LE LUNDI.
 *
 * ⚠️  `partiesLocales().jourSemaine` suit `Date.getDay()` : 0 = DIMANCHE.
 *     Nos libellés, eux, commencent au lundi. Utiliser `jourSemaine - 1`
 *     décale toute la semaine d'un cran et met le dimanche à l'indice −1
 *     — la grille se remplit alors du mauvais jour, sans rien casser de
 *     visible. Passer par ici, jamais par le calcul à la main.
 */
function indexLundi(jourSemaine: number): number {
  return (jourSemaine + 6) % 7;
}

/** Lundi de la semaine qui contient `jour`, à minuit heure institut. */
function lundiDeLaSemaine(jour: Date): Date {
  const p = partiesLocales(jour);
  const minuit = instantLocal(p.an, p.mois, p.jour, 0, 0);
  return new Date(minuit.getTime() - indexLundi(p.jourSemaine) * 86400000);
}

function minutesLocales(iso: string): number {
  const p = partiesLocales(new Date(iso));
  return p.heures * 60 + p.minutes;
}

export function Agenda() {
  const [selection, setSelection] = useState<Date>(() => new Date());
  const [moisAffiche, setMoisAffiche] = useState<Date>(() => new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  const lundi = useMemo(() => lundiDeLaSemaine(selection), [selection]);

  const joursSemaine = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(lundi.getTime() + i * 86400000)),
    [lundi],
  );

  // --- Lecture de la semaine ---
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const fin = new Date(lundi.getTime() + 7 * 86400000);
      const r = await appelAdmin<{ reservations: Reservation[] }>(
        `/api/admin/reservations?du=${encodeURIComponent(lundi.toISOString())}&au=${encodeURIComponent(
          fin.toISOString(),
        )}&limite=300`,
      );
      setReservations(r.reservations ?? []);
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, [lundi]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return reservations;
    return reservations.filter((r) =>
      [r.client.prenom, r.client.nom, r.serviceNom, r.reference]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [reservations, recherche]);

  const parJour = useCallback(
    (jour: Date) => {
      const cle = cleJourLocale(jour);
      return filtrees
        .filter((r) => r.startAt && cleJourLocale(new Date(r.startAt)) === cle)
        .sort((a, b) => minutesLocales(a.startAt) - minutesLocales(b.startAt));
    },
    [filtrees],
  );

  const heures = useMemo(
    () => Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i),
    [],
  );

  return (
    <section className="carte overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linesoft p-4 sm:p-5">
        <h2 className="font-display text-xl text-ink sm:text-2xl">
          Rendez-vous programmés{' '}
          <span className="align-super text-xs text-muted tabular">({filtrees.length})</span>
        </h2>
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-1.5 text-sm text-champagne transition-opacity duration-[140ms] hover:opacity-75"
        >
          Tout voir
          <Icon nom="fleche-droite" taille={14} />
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* ============ Calendrier du mois ============ */}
        <div className="shrink-0 border-b border-linesoft p-4 sm:p-5 lg:w-[286px] lg:border-b-0 lg:border-r">
          <CalendrierMois
            mois={moisAffiche}
            selection={selection}
            surMois={setMoisAffiche}
            surJour={(d) => setSelection(d)}
          />
        </div>

        {/* ============ Semaine / jour ============ */}
        <div className="min-w-0 flex-1">
          <div className="border-b border-linesoft p-4 sm:p-5">
            <label className="relative block">
              <span className="sr-only">Rechercher un rendez-vous</span>
              <Icon
                nom="recherche"
                taille={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-full border border-line bg-canvas py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne"
              />
            </label>
          </div>

          {/* --- Sélecteur de semaine --- */}
          <div className="flex items-center gap-2 border-b border-linesoft px-4 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => setSelection(new Date(selection.getTime() - 7 * 86400000))}
              aria-label="Semaine précédente"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
            >
              <Icon nom="fleche-gauche" taille={15} />
            </button>
            <button
              type="button"
              onClick={() => setSelection(new Date(selection.getTime() + 7 * 86400000))}
              aria-label="Semaine suivante"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
            >
              <Icon nom="fleche-droite" taille={15} />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm text-muted">
              {libelleSemaine(joursSemaine)}
            </p>
            <button
              type="button"
              onClick={() => {
                const a = new Date();
                setSelection(a);
                setMoisAffiche(a);
              }}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs text-champagne ring-1 ring-inset ring-champagne/35 transition-colors duration-[140ms] hover:bg-champagnepale"
            >
              Aujourd’hui
            </button>
          </div>

          {erreur ? (
            <div className="p-4 sm:p-5">
              <Encart ton="attention" titre="Impossible de charger l’agenda">
                {erreur}
              </Encart>
            </div>
          ) : chargement ? (
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <Squelette className="h-20" />
              <Squelette className="h-20" />
              <Squelette className="h-20" />
            </div>
          ) : (
            <>
              {/* ---- Grille de la semaine, à partir de `lg` ---- */}
              <div className="hidden lg:block">
                <GrilleSemaine jours={joursSemaine} heures={heures} parJour={parJour} />
              </div>

              {/* ---- Un seul jour, en dessous ---- */}
              <div className="lg:hidden">
                <BandeJours jours={joursSemaine} selection={selection} surJour={setSelection} parJour={parJour} />
                <ListeDuJour jour={selection} rendezVous={parJour(selection)} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function libelleSemaine(jours: Date[]) {
  const a = partiesLocales(jours[0]);
  const b = partiesLocales(jours[6]);
  const moisA = MOIS[a.mois - 1];
  const moisB = MOIS[b.mois - 1];
  return a.mois === b.mois
    ? `${a.jour} – ${b.jour} ${moisA} ${a.an}`
    : `${a.jour} ${moisA} – ${b.jour} ${moisB} ${b.an}`;
}

// ---------------------------------------------------------------------
//  Calendrier du mois
// ---------------------------------------------------------------------
function CalendrierMois({
  mois,
  selection,
  surMois,
  surJour,
}: {
  mois: Date;
  selection: Date;
  surMois: (d: Date) => void;
  surJour: (d: Date) => void;
}) {
  const p = partiesLocales(mois);
  const premier = instantLocal(p.an, p.mois, 1, 12, 0);
  const decalage = indexLundi(partiesLocales(premier).jourSemaine);
  const nbJours = new Date(Date.UTC(p.an, p.mois, 0)).getUTCDate();

  const cases: (Date | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => instantLocal(p.an, p.mois, i + 1, 12, 0)),
  ];

  const cleSelection = cleJourLocale(selection);
  const cleAujourdhui = cleJourLocale(new Date());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink">
          {MOIS[p.mois - 1]} {p.an}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => surMois(instantLocal(p.an, p.mois - 1, 1, 12, 0))}
            aria-label="Mois précédent"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
          >
            <Icon nom="fleche-gauche" taille={14} />
          </button>
          <button
            type="button"
            onClick={() => surMois(instantLocal(p.an, p.mois + 1, 1, 12, 0))}
            aria-label="Mois suivant"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
          >
            <Icon nom="fleche-droite" taille={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {JOURS.map((j) => (
          <span key={j} className="pb-1 text-center text-[0.6875rem] uppercase text-faint">
            {j.slice(0, 2)}
          </span>
        ))}

        {cases.map((d, i) => {
          if (!d) return <span key={`vide-${i}`} />;
          const cle = cleJourLocale(d);
          const choisi = cle === cleSelection;
          const cejour = cle === cleAujourdhui;
          return (
            <button
              key={cle}
              type="button"
              onClick={() => surJour(d)}
              aria-pressed={choisi}
              aria-label={`${partiesLocales(d).jour} ${MOIS[partiesLocales(d).mois - 1]}`}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm tabular transition-colors duration-[140ms]',
                choisi
                  ? 'bg-selection text-onselection'
                  : cejour
                    ? 'text-selection ring-1 ring-inset ring-selection/55'
                    : 'text-muted hover:bg-canvas2 hover:text-ink',
              )}
            >
              {partiesLocales(d).jour}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Grille de la semaine (≥ lg)
// ---------------------------------------------------------------------
function GrilleSemaine({
  jours,
  heures,
  parJour,
}: {
  jours: Date[];
  heures: number[];
  parJour: (j: Date) => Reservation[];
}) {
  const cleAujourdhui = cleJourLocale(new Date());
  const hauteur = heures.length * HAUTEUR_HEURE;

  return (
    <div className="overflow-x-auto">
      {/* 1120 px minimum, soit ~150 px par jour : c'est la largeur en
          dessous de laquelle « Salma Bennani » se coupe en « Salma Ben… ».
          Sur un grand ecran tout tient ; sur un ecran moyen la grille
          glisse horizontalement — la maquette fait pareil, son 18 mars
          est coupe au bord. Mieux vaut faire glisser sept jours lisibles
          que tout montrer illisible. */}
      <div className="min-w-[1120px]">
        {/* En-tête des jours */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-linesoft bg-champagnepale/30">
          <span />
          {jours.map((j) => {
            const p = partiesLocales(j);
            const cejour = cleJourLocale(j) === cleAujourdhui;
            return (
              <div
                key={p.jour + '-' + p.mois}
                className={cn(
                  'border-l border-linesoft px-2 py-2.5 text-center text-[0.8125rem]',
                  cejour ? 'font-medium text-ink' : 'text-inksoft',
                )}
              >
                {p.jour} {MOIS[p.mois - 1].slice(0, 4).toLowerCase()}., {JOURS[indexLundi(p.jourSemaine)]}
              </div>
            );
          })}
        </div>

        {/* Corps */}
        <div className="relative grid grid-cols-[64px_repeat(7,1fr)]" style={{ height: hauteur }}>
          {/* Colonne des heures */}
          <div className="relative">
            {heures.map((h, i) => (
              <span
                key={h}
                className="absolute left-0 w-full pr-2 text-right text-xs text-faint tabular"
                style={{ top: i * HAUTEUR_HEURE - 6 }}
              >
                {h} h
              </span>
            ))}
          </div>

          {jours.map((j) => {
            const rdv = parJour(j);
            return (
              <div key={cleJourLocale(j)} className="relative border-l border-linesoft">
                {heures.map((h, i) => (
                  <span
                    key={h}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-linesoft"
                    style={{ top: i * HAUTEUR_HEURE }}
                  />
                ))}

                {rdv.map((r) => {
                  const debut = minutesLocales(r.startAt);
                  const fin = r.endAt ? minutesLocales(r.endAt) : debut + 60;
                  const haut = ((debut - HEURE_DEBUT * 60) / 60) * HAUTEUR_HEURE;
                  const h = Math.max(((fin - debut) / 60) * HAUTEUR_HEURE, 30);
                  return (
                    <Link
                      key={r.id}
                      href={`/admin/reservations?ref=${encodeURIComponent(r.reference)}`}
                      className={cn(
                        'absolute inset-x-1 flex gap-2 overflow-hidden rounded-lg p-2 text-left ring-1 ring-inset transition-opacity duration-[140ms] hover:opacity-85',
                        TONS[r.status] ?? TONS.confirmee,
                      )}
                      style={{ top: Math.max(haut, 0), height: h }}
                    >
                      {/* Pastille d'icone, comme la maquette. Elle disparait
                          sous 50 px de haut : a cette taille elle mangerait
                          la place du nom, qui est l'information utile. */}
                      {h >= 50 && (
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-card/70">
                          <Icon nom="lotus" taille={12} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {r.client.prenom} {r.client.nom}
                        </span>
                        <span className="block truncate text-[0.6875rem] opacity-80">
                          {r.serviceNom}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.6875rem] tabular opacity-70">
                          {heureCourte(r.startAt)} – {heureCourte(r.endAt)}
                        </span>
                        {/* La note de la cliente, seulement si le bloc est
                            assez haut pour l'accueillir sans rogner le reste. */}
                        {r.notes && h >= 110 && (
                          <span className="mt-1.5 block rounded-md bg-card/60 p-1.5 text-[0.6875rem] italic leading-snug opacity-80">
                            « {r.notes} »
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function heureCourte(iso: string) {
  if (!iso) return '';
  const p = partiesLocales(new Date(iso));
  return `${p.heures}h${String(p.minutes).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------
//  Bande des sept jours (< lg)
//
//  Elle remplace les colonnes : chaque jour porte une pastille avec son
//  nombre de rendez-vous, donc on garde la vue d'ensemble de la semaine
//  sans essayer d'afficher sept colonnes sur 375 px.
// ---------------------------------------------------------------------
function BandeJours({
  jours,
  selection,
  surJour,
  parJour,
}: {
  jours: Date[];
  selection: Date;
  surJour: (d: Date) => void;
  parJour: (j: Date) => Reservation[];
}) {
  const cleSelection = cleJourLocale(selection);
  const cleAujourdhui = cleJourLocale(new Date());
  const choisiRef = useRef<HTMLButtonElement>(null);

  /*
    La bande défile horizontalement : sept jours ne tiennent pas dans
    375 px. Si on choisit un jour depuis le calendrier du mois, ou si on
    change de semaine, le jour retenu peut se retrouver HORS CHAMP — la
    liste dessous parle alors d'un jour qu'on ne voit pas surligné.
    On le ramène donc au centre.

    `block: 'nearest'` est indispensable : sans lui, le navigateur fait
    aussi défiler la PAGE pour amener le bouton à l'écran, et la vue
    saute pendant qu'on lit.
  */
  useEffect(() => {
    choisiRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [cleSelection]);

  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-linesoft px-4 py-3 sm:px-5">
      {jours.map((j) => {
        const p = partiesLocales(j);
        const cle = cleJourLocale(j);
        const choisi = cle === cleSelection;
        const nb = parJour(j).length;
        return (
          <button
            key={cle}
            ref={choisi ? choisiRef : undefined}
            type="button"
            onClick={() => surJour(j)}
            aria-pressed={choisi}
            className={cn(
              'flex min-w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-colors duration-[140ms]',
              choisi
                ? 'bg-selection text-onselection'
                : cle === cleAujourdhui
                  ? 'text-selection ring-1 ring-inset ring-selection/50'
                  : 'text-muted hover:bg-canvas2',
            )}
          >
            <span className="text-[0.625rem] uppercase opacity-80">{JOURS[indexLundi(p.jourSemaine)]}</span>
            <span className="text-base leading-none tabular">{p.jour}</span>
            <span
              className={cn(
                'mt-0.5 h-1.5 w-1.5 rounded-full',
                nb === 0 ? 'bg-transparent' : choisi ? 'bg-onselection' : 'bg-selection',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Liste d'un jour (< lg)
// ---------------------------------------------------------------------
function ListeDuJour({ jour, rendezVous }: { jour: Date; rendezVous: Reservation[] }) {
  const p = partiesLocales(jour);

  return (
    <div className="p-4 sm:p-5">
      <p className="mb-3 text-sm text-muted">
        {JOURS_LONGS[indexLundi(p.jourSemaine)]} {p.jour} {MOIS[p.mois - 1].toLowerCase()}
      </p>

      {rendezVous.length === 0 ? (
        <p className="rounded-xl bg-canvas2 px-4 py-6 text-center text-sm text-faint">
          Aucun rendez-vous ce jour-là.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rendezVous.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/reservations?ref=${encodeURIComponent(r.reference)}`}
                className={cn(
                  'flex gap-3 rounded-xl p-3 ring-1 ring-inset transition-opacity duration-[140ms] active:opacity-80',
                  TONS[r.status] ?? TONS.confirmee,
                )}
              >
                <span className="flex shrink-0 flex-col items-center gap-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/70">
                    <Icon nom="lotus" taille={15} />
                  </span>
                  <span className="text-xs tabular">{heureCourte(r.startAt)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.client.prenom} {r.client.nom}
                  </span>
                  <span className="block truncate text-[0.8125rem] opacity-80">{r.serviceNom}</span>
                  <span className="mt-0.5 block text-xs tabular opacity-70">
                    {heureCourte(r.startAt)} – {heureCourte(r.endAt)}
                    {r.lieu === 'domicile' && ' · à domicile'}
                    {LIBELLE_STATUT[r.status] && ` · ${LIBELLE_STATUT[r.status]}`}
                  </span>
                  {/* La note de la cliente : c'est elle qui dit pourquoi
                      elle vient, et souvent ce qu'il faut préparer. */}
                  {r.notes && (
                    <span className="mt-2 block border-l-2 border-current/25 pl-2.5 text-xs italic leading-snug opacity-75">
                      « {r.notes} »
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
