'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Calendrier } from '@/components/reservation/Calendrier';
import { EtapesReservation, type Etape } from '@/components/reservation/EtapesReservation';
import { Badge, Encart, Ligne, Rouet } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Case, Champ, Liste, Segments, ZoneTexte } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import type { Service } from '@/data/services';
import { contact, lignesAdresse } from '@/data/site';
import { adresseEnLigne, listerAdresses, type Adresse } from '@/lib/addresses';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/catalogue-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import { duree, prix } from '@/lib/utils';
import { validerReservation, type ChampsReservation } from '@/lib/validation';
import { cn } from '@/lib/utils';

// =====================================================================
//  Tunnel de réservation.
//
//  Cinq étapes : le soin, le lieu, le moment, vos coordonnées, et le
//  récapitulatif.
//
//  ⚠️  AUCUN PRIX N'EST ENVOYÉ AU SERVEUR.
//      Ce composant affiche un montant pour informer, mais la requête ne
//      transporte qu'un `serviceId` et un `lieu`. Le serveur recalcule
//      tout depuis le catalogue (`tarifDuSoin`). Si le prix voyageait
//      depuis le navigateur, n'importe qui pourrait réserver à zéro
//      dirham. Les règles Firestore verrouillent le même chemin en posant
//      `allow create: if false` sur `reservations`.
//
//  ⚠️  AUCUNE DONNÉE BANCAIRE N'EST DEMANDÉE.
//      L'« adresse de facturation » est une adresse POSTALE : celle qui
//      figurera sur le reçu. Le règlement se fait sur place, après le soin.
// =====================================================================

const ETAPES: readonly Etape[] = [
  { cle: 'soin', label: 'Choisir le soin', courte: 'Soin' },
  { cle: 'lieu', label: 'Choisir le lieu', courte: 'Lieu' },
  { cle: 'moment', label: 'Choisir la date et l’heure', courte: 'Moment' },
  { cle: 'coordonnees', label: 'Vos coordonnées', courte: 'Vous' },
  { cle: 'recap', label: 'Vérifier et confirmer', courte: 'Confirmer' },
];

type Donnees = ChampsReservation & {
  /** Adresse d'intervention, pour un soin à domicile. */
  soinLine1: string;
  soinLine2: string;
  soinCity: string;
  soinPostalCode: string;
  soinCountry: string;
  /** Adresse de facturation — postale, jamais bancaire. */
  memeAdresse: boolean;
  factLine1: string;
  factLine2: string;
  factCity: string;
  factPostalCode: string;
  factCountry: string;
  conditions: boolean;
};

function donneesVides(): Donnees {
  return {
    serviceId: '',
    lieu: 'institut',
    date: '',
    creneau: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    notes: '',
    soinLine1: '',
    soinLine2: '',
    soinCity: contact.city,
    soinPostalCode: '',
    soinCountry: 'Maroc',
    memeAdresse: true,
    factLine1: '',
    factLine2: '',
    factCity: contact.city,
    factPostalCode: '',
    factCountry: 'Maroc',
    conditions: false,
  };
}

export function TunnelReservation() {
  const services = useServices();
  const parametres = useSearchParams();
  const router = useRouter();
  const { user, profil, jeton } = useAuth();
  const toast = useToast();

  const [etape, setEtape] = useState(0);


  // Créneaux déjà pris pour le jour affiché, par date.

  //

  // Sans ça, la cliente choisissait une heure déjà réservée, remplissait

  // tout le formulaire, et se faisait refuser à la dernière étape. Le

  // serveur refuse toujours — c'est lui qui fait autorité — mais autant

  // ne pas proposer ce qui n'est plus disponible.

  const [occupes, setOccupes] = useState<Record<string, readonly string[]>>({});
  const [atteinte, setAtteinte] = useState(0);
  const [d, setD] = useState<Donnees>(donneesVides);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);

  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [adresseChoisie, setAdresseChoisie] = useState<string>('');

  const service = useMemo(
    () => services.find((s) => s.id === d.serviceId),
    [services, d.serviceId],
  );

  const total = service
    ? service.prix + (d.lieu === 'domicile' ? service.supplementDomicile : 0)
    : 0;

  function maj<K extends keyof Donnees>(cle: K, valeur: Donnees[K]) {
    setD((v) => ({ ...v, [cle]: valeur }));
    setErreurs((e) => {
      if (!e[cle as string]) return e;
      const suivant = { ...e };
      delete suivant[cle as string];
      return suivant;
    });
  }

  // --- Pré-remplissage depuis l'URL -------------------------------------
  // `/reservation?soin=massage-traditionnel&lieu=domicile` — les liens des
  // fiches de soin arrivent ici avec le soin déjà choisi.
  useEffect(() => {
    const slug = parametres.get('soin');
    const lieu = parametres.get('lieu');

    if (slug) {
      const trouve = services.find((s) => s.slug === slug);
      if (trouve) {
        setD((v) => ({ ...v, serviceId: trouve.id }));
        setEtape((e) => (e === 0 ? 1 : e));
        setAtteinte((a) => Math.max(a, 1));
      }
    }

    if (lieu === 'domicile') {
      setD((v) => ({ ...v, lieu: 'domicile' }));
    }
  }, [parametres, services]);

  // --- Pré-remplissage depuis le compte ---------------------------------
  useEffect(() => {
    if (!user) return;
    setD((v) => ({
      ...v,
      prenom: v.prenom || profil?.firstName || '',
      nom: v.nom || profil?.lastName || '',
      email: v.email || user.email || '',
      telephone: v.telephone || profil?.phone || '',
    }));
  }, [user, profil]);

  // --- Carnet d'adresses -------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let annule = false;

    void (async () => {
      try {
        const liste = await listerAdresses(user.uid);
        if (annule) return;
        setAdresses(liste);
      } catch {
        // Le carnet est un confort : son échec ne doit pas bloquer une
        // réservation. On retombe sur la saisie manuelle.
      }
    })();

    return () => {
      annule = true;
    };
  }, [user]);

  /** Recopie une adresse enregistrée dans le formulaire. */
  const appliquerAdresse = useCallback(
    (id: string) => {
      setAdresseChoisie(id);
      const a = adresses.find((x) => x.id === id);
      if (!a) return;

      setD((v) => ({
        ...v,
        soinLine1: a.line1,
        soinLine2: a.line2,
        soinCity: a.city,
        soinPostalCode: a.postalCode,
        soinCountry: a.country,
        telephone: v.telephone || a.phone,
        prenom: v.prenom || a.firstName,
        nom: v.nom || a.lastName,
      }));
    },
    [adresses],
  );

  // --- Validation par étape ----------------------------------------------
  function validerEtape(i: number): boolean {
    const e: Record<string, string> = {};

    if (i === 0 && !d.serviceId) e.serviceId = 'Choisissez un soin pour continuer.';

    if (i === 1) {
      if (d.lieu === 'domicile' && service && !service.domicileDisponible) {
        e.lieu = 'Ce soin n’est pas proposé à domicile.';
      }
    }

    if (i === 2) {
      if (!d.date) e.date = 'Choisissez une date.';
      if (!d.creneau) e.creneau = 'Choisissez un horaire.';
    }

    if (i === 3) {
      const base = validerReservation(d);
      Object.entries(base).forEach(([k, v]) => {
        // Les champs des étapes précédentes ne doivent pas s'afficher ici.
        if (!['serviceId', 'lieu', 'date', 'creneau'].includes(k) && v) e[k] = v;
      });

      if (d.lieu === 'domicile') {
        if (!d.soinLine1.trim()) e.soinLine1 = 'Indiquez la rue et le numéro.';
        if (!d.soinCity.trim()) e.soinCity = 'Indiquez la ville.';
      }

      if (!d.memeAdresse) {
        if (!d.factLine1.trim()) e.factLine1 = 'Indiquez l’adresse de facturation.';
        if (!d.factCity.trim()) e.factCity = 'Indiquez la ville.';
      }
    }

    if (i === 4 && !d.conditions) {
      e.conditions = 'Il faut accepter les conditions pour réserver.';
    }

    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  function suivant() {
    if (!validerEtape(etape)) return;
    const prochaine = Math.min(etape + 1, ETAPES.length - 1);
    setEtape(prochaine);
    setAtteinte((a) => Math.max(a, prochaine));
  }

  function precedent() {
    setEtape((e) => Math.max(0, e - 1));
  }

  // --- Envoi ---------------------------------------------------------------
  async function confirmer() {
    if (!validerEtape(4)) return;
    if (!service) return;

    setEnvoi(true);
    try {
      const t = await jeton();

      const adresseSoin =
        d.lieu === 'domicile'
          ? [d.soinLine1, d.soinLine2, d.soinPostalCode, d.soinCity, d.soinCountry]
              .filter(Boolean)
              .join(', ')
          : null;

      const adresseFacturation = d.memeAdresse
        ? adresseSoin
        : [d.factLine1, d.factLine2, d.factPostalCode, d.factCity, d.factCountry]
            .filter(Boolean)
            .join(', ');

      const reponse = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        // Remarquez ce qui N'EST PAS envoyé : ni `prix`, ni `total`, ni
        // `duree`. Le serveur les recalcule depuis le catalogue.
        body: JSON.stringify({
          serviceId: d.serviceId,
          lieu: d.lieu,
          date: d.date,
          creneau: d.creneau,
          client: {
            prenom: d.prenom,
            nom: d.nom,
            email: d.email,
            telephone: d.telephone,
          },
          adresseSoin,
          adresseFacturation,
          notes: d.notes,
        }),
      });

      const resultat = await reponse.json();

      // 409 : quelqu'un a réservé ce créneau pendant que la cliente
      // remplissait le formulaire. Ce n'est pas une erreur de sa part —
      // on la ramène au calendrier, rafraîchi, plutôt que de lui montrer
      // un message d'échec devant un formulaire qu'elle croit fautif.
      if (reponse.status === 409) {
        setOccupes((p) => ({
          ...p,
          [d.date]: [...(p[d.date] ?? []), d.creneau],
        }));
        maj('creneau', '');
        setEtape(2);
        setEnvoi(false);
        toast.erreur(
          resultat?.error || 'Ce créneau vient d’être réservé. Choisissez un autre horaire.',
        );
        return;
      }

      if (!reponse.ok) {
        throw new Error(resultat?.error || 'La réservation n’a pas pu être enregistrée.');
      }

      toast.succes('Demande envoyée. On vous confirme très vite.');
      router.push(`/reservation/${resultat.id}`);
    } catch (err) {
      toast.erreur(messageErreur(err));
      setEnvoi(false);
    }
  }

  // Recharge la liste des heures prises quand le jour ou le soin change.
  useEffect(() => {
    if (etape !== 2 || !d.date) return;

    const duree = service?.duree ?? 60;
    const arret = new AbortController();

    fetch(`/api/reservations?date=${encodeURIComponent(d.date)}&duree=${duree}`, {
      signal: arret.signal,
    })
      .then((r) => (r.ok ? r.json() : { occupees: [] }))
      .then((j: { occupees?: string[] }) => {
        setOccupes((p) => ({ ...p, [d.date]: j.occupees ?? [] }));
      })
      // Panne réseau : on ne bloque rien côté affichage. Le serveur
      // refusera de toute façon un créneau réellement pris.
      .catch(() => {});

    return () => arret.abort();
  }, [etape, d.date, service?.duree]);

  return (
    <>
      {/* Le <h1> de la page est rendu PAR LE SERVEUR, dans
          `app/reservation/page.tsx`, hors de la frontière Suspense : la
          page a donc un titre lisible avant même que ce composant soit
          hydraté. Ne pas le redescendre ici. */}

      {/* --- Étapes --- */}
      <div className="mx-auto max-w-2xl">
        <EtapesReservation
          etapes={ETAPES}
          actuelle={etape}
          atteinte={atteinte}
          aller={(i) => setEtape(i)}
        />
      </div>

      {/*
        `min-w-0` sur les DEUX enfants n'est pas decoratif.

        Un element de grille a `min-width: auto` par defaut : il refuse de
        retrecir sous la largeur `min-content` de son contenu. Ici, la carte
        de recapitulatif et la liste des soins imposaient 646 px de
        min-content — dans un conteneur de 335 px sur telephone. Resultat
        mesure : toute la page defilait horizontalement (690 px au lieu de
        375), en-tete compris.

        `min-w-0` leve cette contrainte et laisse la colonne suivre son
        conteneur. A garder sur tout enfant de grille qui contient du texte
        long ou une carte.
      */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* ============ Panneau d'étape ============ */}
        <div className="min-w-0 min-h-[420px]">
          {/*
            L'étape est remontée à chaque changement (`key`), ce qui relance
            l'animation CSS `.surgir` — un simple décalage de 14 px.

            Elle glissait auparavant depuis `{ opacity: 0, x: 24 }` sous
            Framer. Framer avance depuis `requestAnimationFrame` : si rAF
            ne tourne pas, l'étape reste à opacité nulle. Le client cliquait
            « Suivant » et tombait sur un panneau vide, au milieu d'une
            réservation. C'est le contenu qui rapporte l'argent — il ne
            dépend plus d'une boucle JavaScript.
          */}
          <div key={ETAPES[etape].cle} className="surgir">
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                {ETAPES[etape].label}
              </h2>

              <div className="mt-8">
                {etape === 0 && (
                  <EtapeSoin
                    services={services}
                    choisi={d.serviceId}
                    onChoisir={(id) => maj('serviceId', id)}
                    erreur={erreurs.serviceId}
                  />
                )}

                {etape === 1 && (
                  <EtapeLieu
                    service={service}
                    lieu={d.lieu}
                    onLieu={(l) => maj('lieu', l)}
                    erreur={erreurs.lieu}
                  />
                )}

                {etape === 2 && (
                  <div className="flex flex-col gap-4">
                    <Calendrier
                      dureeMinutes={service?.duree ?? 60}
                      date={d.date}
                      creneau={d.creneau}
                      occupes={occupes}
                      onDate={(v) => maj('date', v)}
                      onCreneau={(v) => maj('creneau', v)}
                    />
                    {(erreurs.date || erreurs.creneau) && (
                      <p role="alert" className="text-sm text-danger">
                        {erreurs.date || erreurs.creneau}
                      </p>
                    )}
                  </div>
                )}

                {etape === 3 && (
                  <EtapeCoordonnees
                    d={d}
                    maj={maj}
                    erreurs={erreurs}
                    adresses={adresses}
                    adresseChoisie={adresseChoisie}
                    appliquerAdresse={appliquerAdresse}
                    connecte={Boolean(user)}
                  />
                )}

                {etape === 4 && service && (
                  <EtapeRecapitulatif
                    d={d}
                    service={service}
                    total={total}
                    erreurConditions={erreurs.conditions}
                    onConditions={(v) => maj('conditions', v)}
                  />
                )}
              </div>
          </div>

          {/* --- Navigation --- */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
            <Button
              variante="fantome"
              onClick={precedent}
              disabled={etape === 0}
              className={cn(etape === 0 && 'invisible')}
            >
              Retour
            </Button>

            {etape < ETAPES.length - 1 ? (
              <Button onClick={suivant} fleche>
                Continuer
              </Button>
            ) : (
              <Button onClick={confirmer} chargement={envoi} fleche>
                Confirmer la demande
              </Button>
            )}
          </div>
        </div>

        {/* ============ Récapitulatif latéral ============ */}
        <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
          <RecapLateral service={service} d={d} total={total} />
        </aside>
      </div>
    </>
  );
}

// =====================================================================
//  Étape 1 — le soin
// =====================================================================

function EtapeSoin({
  services,
  choisi,
  onChoisir,
  erreur,
}: {
  services: readonly Service[];
  choisi: string;
  onChoisir: (id: string) => void;
  erreur?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {erreur && (
        <p role="alert" className="text-sm text-danger">
          {erreur}
        </p>
      )}

      <div role="radiogroup" aria-label="Choisir un soin" className="flex flex-col gap-2.5">
        {services.map((s) => {
          const actif = s.id === choisi;

          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onChoisir(s.id)}
              className={cn(
                'flex items-center gap-4 rounded-lg p-3 text-left ring-1 ring-inset',
                'transition-[transform,box-shadow,background-color] duration-[140ms] ease-out',
                'hover:translate-x-[3px] active:scale-[0.995] motion-reduce:hover:translate-x-0',
                actif ? 'bg-canvas2 ring-champagne' : 'bg-card ring-line hover:ring-champagne/60',
              )}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <Image src={s.image} alt="" fill sizes="64px" className="object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg leading-tight text-ink">{s.nom}</h3>
                <p className="mt-0.5 truncate text-xs text-muted">{s.resume}</p>
                <p className="mt-1 text-xs text-faint tabular">
                  {duree(s.duree)} · {prix(s.prix)}
                </p>
              </div>

              {/* Pastille de sélection. La coche reste montée : seule son
                  échelle change. L'état réel est porté par `aria-checked`
                  sur le bouton, donc il est annoncé même sans animation. */}
              <span
                aria-hidden
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 transition-colors duration-[140ms]',
                  actif ? 'bg-champagne text-surchampagne ring-champagne' : 'ring-line',
                )}
              >
                <span
                  className={cn(
                    'transition-transform duration-[180ms] ease-[cubic-bezier(0.34,1.4,0.64,1)]',
                    actif ? 'scale-100' : 'scale-0',
                  )}
                >
                  <Icon nom="check" taille={13} trait={2.4} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
//  Étape 2 — le lieu
// =====================================================================

function EtapeLieu({
  service,
  lieu,
  onLieu,
  erreur,
}: {
  service?: Service;
  lieu: 'institut' | 'domicile';
  onLieu: (l: 'institut' | 'domicile') => void;
  erreur?: string;
}) {
  const domicilePossible = service?.domicileDisponible ?? true;

  return (
    <div className="flex flex-col gap-6">
      <Segments
        label="Où souhaitez-vous être reçue ?"
        valeur={lieu}
        onChange={onLieu}
        erreur={erreur}
        options={[
          { valeur: 'institut', label: 'En institut', note: contact.city },
          {
            valeur: 'domicile',
            label: 'À domicile',
            note: service ? `+ ${prix(service.supplementDomicile)}` : undefined,
            desactive: !domicilePossible,
          },
        ]}
      />

      {!domicilePossible && (
        <Encart ton="info">
          {service?.nom} demande l’équipement de l’institut (hammam, vapeur) : il n’est pas
          proposé à domicile.
        </Encart>
      )}

      {/* Remonté à chaque changement de lieu : `.surgir` rejoue. */}
      <div key={lieu} className="surgir carte flex flex-col gap-3 p-5">
          {lieu === 'institut' ? (
            <>
              <h3 className="font-display text-xl text-ink">Chez nous</h3>
              <p className="text-sm leading-relaxed text-muted">
                {lignesAdresse().join(', ')}. Arrivez dix minutes avant : elles servent à
                parler de vos zones sensibles et à choisir la pression.
              </p>
              <div className="mt-1 flex flex-col gap-1 text-sm text-muted">
                {contact.hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4">
                    <span>{h.day}</span>
                    <span className="text-ink">{h.slot}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl text-ink">Chez vous</h3>
              <p className="text-sm leading-relaxed text-muted">
                On apporte la table, les serviettes, les huiles et la musique. Il vous faut
                deux mètres sur deux dans une pièce qui ferme et qui est chauffée.
              </p>
              <p className="text-sm text-muted">
                <strong className="font-sans font-medium text-ink">Zone couverte :</strong>{' '}
                {contact.homeServiceArea}
              </p>
            </>
          )}
      </div>
    </div>
  );
}

// =====================================================================
//  Étape 4 — coordonnées et adresses
// =====================================================================

function EtapeCoordonnees({
  d,
  maj,
  erreurs,
  adresses,
  adresseChoisie,
  appliquerAdresse,
  connecte,
}: {
  d: Donnees;
  maj: <K extends keyof Donnees>(cle: K, valeur: Donnees[K]) => void;
  erreurs: Record<string, string>;
  adresses: readonly Adresse[];
  adresseChoisie: string;
  appliquerAdresse: (id: string) => void;
  connecte: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      {!connecte && (
        <Encart ton="info">
          <Link href="/connexion" className="souligne text-ink">
            Connectez-vous
          </Link>{' '}
          pour retrouver vos adresses et suivre vos rendez-vous. Ce n’est pas obligatoire.
        </Encart>
      )}

      {/* --- Identité --- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Prénom"
          value={d.prenom}
          onChange={(e) => maj('prenom', e.target.value)}
          erreur={erreurs.prenom}
          autoComplete="given-name"
        />
        <Champ
          label="Nom"
          value={d.nom}
          onChange={(e) => maj('nom', e.target.value)}
          erreur={erreurs.nom}
          autoComplete="family-name"
        />
        <Champ
          label="E-mail"
          type="email"
          value={d.email}
          onChange={(e) => maj('email', e.target.value)}
          erreur={erreurs.email}
          autoComplete="email"
          aide="Pour recevoir la confirmation."
        />
        <Champ
          label="Téléphone"
          type="tel"
          value={d.telephone}
          onChange={(e) => maj('telephone', e.target.value)}
          erreur={erreurs.telephone}
          autoComplete="tel"
          aide="On vous appelle si un imprévu survient."
        />
      </div>

      {/* --- Adresse d'intervention --- */}
      {d.lieu === 'domicile' && (
        <div className="surgir flex flex-col gap-4 border-t border-line pt-8">
          <div className="flex items-center gap-2">
            <Icon nom="maison" taille={17} className="text-champagne" />
            <h3 className="font-display text-2xl text-ink">Où venir</h3>
          </div>

          {adresses.length > 0 && (
            <Liste
              label="Une de vos adresses enregistrées"
              value={adresseChoisie}
              onChange={(e) => appliquerAdresse(e.target.value)}
              options={[
                { valeur: '', label: 'Saisir une nouvelle adresse' },
                ...adresses.map((a) => ({
                  valeur: a.id,
                  label: `${a.label || a.city} — ${adresseEnLigne(a)}`,
                })),
              ]}
            />
          )}

          <Champ
            label="Rue et numéro"
            value={d.soinLine1}
            onChange={(e) => maj('soinLine1', e.target.value)}
            erreur={erreurs.soinLine1}
            autoComplete="address-line1"
          />
          <Champ
            label="Complément"
            value={d.soinLine2}
            onChange={(e) => maj('soinLine2', e.target.value)}
            facultatif
            autoComplete="address-line2"
            aide="Étage, code, interphone — tout ce qui évite un appel devant la porte."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Champ
              label="Ville"
              value={d.soinCity}
              onChange={(e) => maj('soinCity', e.target.value)}
              erreur={erreurs.soinCity}
              autoComplete="address-level2"
            />
            <Champ
              label="Code postal"
              value={d.soinPostalCode}
              onChange={(e) => maj('soinPostalCode', e.target.value)}
              facultatif
              autoComplete="postal-code"
            />
            <Champ
              label="Pays"
              value={d.soinCountry}
              onChange={(e) => maj('soinCountry', e.target.value)}
              autoComplete="country-name"
            />
          </div>
        </div>
      )}

      {/* --- Adresse de facturation --- */}
      <div className="flex flex-col gap-4 border-t border-line pt-8">
        <div className="flex items-center gap-2">
          <Icon nom="imprimer" taille={17} className="text-champagne" />
          <h3 className="font-display text-2xl text-ink">Adresse de facturation</h3>
        </div>

        {/* Cette phrase n'est PAS décorative : sans elle, « facturation »
            fait attendre un formulaire de carte bancaire, et une partie
            des gens abandonne à cette étape. */}
        <p className="text-sm leading-relaxed text-muted">
          C’est l’adresse qui figurera sur votre reçu. Aucun moyen de paiement ne vous est
          demandé : vous réglez sur place, à la fin du soin.
        </p>

        {d.lieu === 'domicile' && (
          <Case
            label="Identique à l’adresse du soin"
            coche={d.memeAdresse}
            onChange={(v) => maj('memeAdresse', v)}
          />
        )}

        {/*
          Les champs de facturation ne sont plus masqués par une hauteur
          animée en JavaScript : ils sont rendus ou non. Une adresse de
          facturation invisible mais présente dans le formulaire bloquait
          la validation sans montrer quoi corriger.
        */}
        {(!d.memeAdresse || d.lieu === 'institut') && (
            <div className="surgir flex flex-col gap-4">
              <Champ
                label="Rue et numéro"
                value={d.factLine1}
                onChange={(e) => maj('factLine1', e.target.value)}
                erreur={erreurs.factLine1}
                facultatif={d.lieu === 'institut'}
                autoComplete="billing address-line1"
              />
              <Champ
                label="Complément"
                value={d.factLine2}
                onChange={(e) => maj('factLine2', e.target.value)}
                facultatif
                autoComplete="billing address-line2"
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Champ
                  label="Ville"
                  value={d.factCity}
                  onChange={(e) => maj('factCity', e.target.value)}
                  erreur={erreurs.factCity}
                  autoComplete="billing address-level2"
                />
                <Champ
                  label="Code postal"
                  value={d.factPostalCode}
                  onChange={(e) => maj('factPostalCode', e.target.value)}
                  facultatif
                  autoComplete="billing postal-code"
                />
                <Champ
                  label="Pays"
                  value={d.factCountry}
                  onChange={(e) => maj('factCountry', e.target.value)}
                  autoComplete="billing country-name"
                />
              </div>
            </div>
        )}
      </div>

      {/* --- Notes --- */}
      <div className="border-t border-line pt-8">
        <ZoneTexte
          label="Quelque chose à nous signaler ?"
          value={d.notes}
          onChange={(e) => maj('notes', e.target.value)}
          facultatif
          compteur={1000}
          rows={4}
          erreur={erreurs.notes}
          aide="Zones sensibles, allergies, grossesse, opération récente, pression préférée."
        />
      </div>
    </div>
  );
}

// =====================================================================
//  Étape 5 — récapitulatif
// =====================================================================

function EtapeRecapitulatif({
  d,
  service,
  total,
  erreurConditions,
  onConditions,
}: {
  d: Donnees;
  service: Service;
  total: number;
  erreurConditions?: string;
  onConditions: (v: boolean) => void;
}) {
  const adresseSoin = [d.soinLine1, d.soinLine2, d.soinPostalCode, d.soinCity, d.soinCountry]
    .filter(Boolean)
    .join(', ');

  const adresseFact = d.memeAdresse
    ? adresseSoin
    : [d.factLine1, d.factLine2, d.factPostalCode, d.factCity, d.factCountry]
        .filter(Boolean)
        .join(', ');

  return (
    <div className="flex flex-col gap-7">
      <div className="carte p-6">
        <Ligne cle="Soin" valeur={service.nom} />
        <Ligne cle="Durée" valeur={duree(service.duree)} />
        <Ligne cle="Lieu" valeur={d.lieu === 'domicile' ? 'À domicile' : 'En institut'} />
        <Ligne
          cle="Date"
          valeur={
            d.date
              ? `${new Date(`${d.date}T${d.creneau || '00:00'}`).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })} à ${d.creneau}`
              : '—'
          }
        />
        <Ligne cle="Au nom de" valeur={`${d.prenom} ${d.nom}`} />
        <Ligne cle="Téléphone" valeur={d.telephone} />
        <Ligne cle="E-mail" valeur={d.email} />

        {d.lieu === 'domicile' && adresseSoin && (
          <Ligne cle="Adresse du soin" valeur={adresseSoin} />
        )}
        {adresseFact && <Ligne cle="Adresse de facturation" valeur={adresseFact} />}

        <Ligne cle="Prix du soin" valeur={prix(service.prix)} />
        {d.lieu === 'domicile' && service.supplementDomicile > 0 && (
          <Ligne cle="Déplacement" valeur={prix(service.supplementDomicile)} />
        )}
        <Ligne cle="À régler sur place" valeur={prix(total)} fort />
      </div>

      <Encart ton="info" titre="Ce qui se passe ensuite">
        Votre demande part à l’institut. On vous confirme le créneau par téléphone ou par
        e-mail, en général dans la journée. Tant que la confirmation n’est pas arrivée, le
        rendez-vous reste « en attente ».
      </Encart>

      <Case
        label={
          <>
            J’accepte les{' '}
            <Link href="/cgv" target="_blank" className="souligne text-ink">
              conditions générales
            </Link>{' '}
            et la{' '}
            <Link href="/confidentialite" target="_blank" className="souligne text-ink">
              politique de confidentialité
            </Link>
            .
          </>
        }
        coche={d.conditions}
        onChange={onConditions}
        erreur={erreurConditions}
      />
    </div>
  );
}

// =====================================================================
//  Récapitulatif latéral, visible en permanence
// =====================================================================

function RecapLateral({
  service,
  d,
  total,
}: {
  service?: Service;
  d: Donnees;
  total: number;
}) {
  if (!service) {
    return (
      <div className="carte flex flex-col items-center gap-3 px-5 py-10 text-center">
        <Rouet />
        <p className="text-sm text-muted">Choisissez un soin pour voir le récapitulatif.</p>
      </div>
    );
  }

  return (
    <div className="carte overflow-hidden">
      <div className="relative aspect-[16/10]">
        <Image src={service.image} alt="" fill sizes="360px" className="object-cover" />
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-2xl leading-tight text-ink">{service.nom}</h3>
          <p className="mt-1 text-sm text-muted">{duree(service.duree)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge icone={d.lieu === 'domicile' ? 'maison' : 'position'}>
            {d.lieu === 'domicile' ? 'À domicile' : 'En institut'}
          </Badge>
          {d.date && d.creneau && (
            <Badge icone="calendrier">
              {new Date(`${d.date}T${d.creneau}`).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              · {d.creneau}
            </Badge>
          )}
        </div>

        <div className="border-t border-linesoft pt-3">
          <Ligne cle="Total" valeur={prix(total)} fort />
        </div>

        <p className="text-xs leading-relaxed text-faint">
          Paiement sur place après le soin. Aucune donnée bancaire ne vous est demandée.
        </p>
      </div>
    </div>
  );
}
