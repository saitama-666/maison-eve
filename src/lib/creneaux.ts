import {
  cleJourLocale,
  instantLocal,
  minutesDansLaJournee,
  partiesLocales,
} from '@/lib/fuseau';

// =====================================================================
//  Créneaux de rendez-vous.
//
//  Ce fichier est importé par le NAVIGATEUR (pour afficher le calendrier)
//  ET par le SERVEUR (pour revalider le créneau reçu). Il ne doit donc
//  dépendre ni de `window`, ni de Firebase.
//
//  ⚠️  Le serveur ne fait JAMAIS confiance au créneau envoyé : il le
//      repasse par `creneauValide()` avant d'écrire. Sinon on réserve à
//      3 h du matin un dimanche en modifiant une requête.
// =====================================================================

/** Horaires d'ouverture, par jour de la semaine (0 = dimanche). */
const OUVERTURE: Record<number, { debut: number; fin: number } | null> = {
  0: null, // dimanche — sur rendez-vous uniquement, pas en ligne
  1: { debut: 10, fin: 20 },
  2: { debut: 10, fin: 20 },
  3: { debut: 10, fin: 20 },
  4: { debut: 10, fin: 20 },
  5: { debut: 10, fin: 20 },
  6: { debut: 10, fin: 19 }, // samedi
};

/** Pas entre deux créneaux, en minutes. */
const PAS = 30;

/**
 * Délai minimum entre maintenant et le début du soin, en heures.
 * Une praticienne doit pouvoir s'organiser : réserver pour dans dix
 * minutes n'a pas de sens, surtout à domicile.
 */
export const DELAI_MINIMUM_H = 4;

/** Horizon de réservation, en jours. */
export const HORIZON_JOURS = 60;

export type Creneau = {
  /** « 14:30 » */
  heure: string;
  /** Minutes depuis minuit — sert aux comparaisons. */
  minutes: number;
  disponible: boolean;
};

function versMinutes(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return (hh ?? 0) * 60 + (mm ?? 0);
}

function versHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** L'institut est-il ouvert ce jour-là ? */
export function jourOuvert(date: Date): boolean {
  return OUVERTURE[partiesLocales(date).jourSemaine] != null;
}

/**
 * Créneaux d'une journée pour un soin d'une durée donnée.
 *
 * Un créneau n'est proposé que si le soin se TERMINE avant la fermeture :
 * proposer 19 h 30 pour un soin de trois heures ferait travailler la
 * praticienne jusqu'à 22 h 30.
 *
 * `occupes` contient les heures déjà prises (« 14:30 »).
 */
export function creneauxDuJour(
  date: Date,
  dureeMinutes: number,
  occupes: readonly string[] = [],
  maintenant: Date = new Date(),
): Creneau[] {
  // Jour de la semaine À L'HEURE DE L'INSTITUT, pas à celle du runtime :
  // un serveur en UTC voit encore la veille pendant la première heure de
  // la journée marocaine.
  const horaires = OUVERTURE[partiesLocales(date).jourSemaine];
  if (!horaires) return [];

  const debut = horaires.debut * 60;
  const fin = horaires.fin * 60;
  const pris = new Set(occupes);

  // Seuil en dessous duquel on ne propose plus rien aujourd'hui.
  const memeJour = cleJourLocale(date) === cleJourLocale(maintenant);
  const seuil = memeJour ? minutesDansLaJournee(maintenant) + DELAI_MINIMUM_H * 60 : -1;

  const liste: Creneau[] = [];

  for (let m = debut; m + dureeMinutes <= fin; m += PAS) {
    const heure = versHeure(m);
    liste.push({
      heure,
      minutes: m,
      disponible: !pris.has(heure) && m >= seuil,
    });
  }

  return liste;
}

/**
 * Les `HORIZON_JOURS` prochains jours, avec leur disponibilité.
 * Sert à construire le sélecteur de date.
 */
export function joursReservables(depuis: Date = new Date()): {
  date: Date;
  cle: string;
  ouvert: boolean;
}[] {
  const jours: { date: Date; cle: string; ouvert: boolean }[] = [];

  const base = partiesLocales(depuis);

  for (let i = 0; i < HORIZON_JOURS; i += 1) {
    // On avance jour par jour EN HEURE INSTITUT : ajouter 24 h à un
    // instant décale d'une heure les jours de changement d'heure.
    const d = instantLocal(base.an, base.mois, base.jour + i);
    jours.push({ date: d, cle: cleJourLocale(d), ouvert: jourOuvert(d) });
  }

  return jours;
}

/**
 * Revalidation SERVEUR d'un couple (date, créneau).
 *
 * Renvoie la date de début, ou `null` si le créneau est invalide. Vérifie
 * dans l'ordre : format, jour d'ouverture, horaire réellement proposé,
 * fin avant fermeture, délai minimum, horizon.
 */
export function creneauValide(
  dateISO: string,
  heure: string,
  dureeMinutes: number,
  maintenant: Date = new Date(),
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  if (!/^\d{2}:\d{2}$/.test(heure)) return null;

  const [an, mois, jour] = dateISO.split('-').map(Number);
  const minutes = versMinutes(heure);

  // ⚠️  Construction à L'HEURE DE L'INSTITUT, jamais celle du runtime.
  //
  //     `new Date(an, mois - 1, jour, h, m)` interprète l'heure dans le
  //     fuseau de la machine. Le même « 15:00 » donnait 14:00 UTC depuis
  //     un navigateur marocain, 13:00 UTC depuis une machine en UTC+2 et
  //     15:00 UTC depuis Vercel — soit 16 h au Maroc. La cliente
  //     réservait 15 h et se voyait confirmer 16 h.
  const debut = instantLocal(an, mois, jour, Math.floor(minutes / 60), minutes % 60);
  if (Number.isNaN(debut.getTime())) return null;

  const horaires = OUVERTURE[partiesLocales(debut).jourSemaine];
  if (!horaires) return null;

  // Le créneau doit tomber sur le pas : ni 14:07, ni 14:15.
  if (minutes % PAS !== 0) return null;
  if (minutes < horaires.debut * 60) return null;
  if (minutes + dureeMinutes > horaires.fin * 60) return null;

  const ecartH = (debut.getTime() - maintenant.getTime()) / 3_600_000;
  if (ecartH < DELAI_MINIMUM_H) return null;
  if (ecartH > HORIZON_JOURS * 24) return null;

  return debut;
}

/** Libellé court d'un jour : « mar. 14 juil. ». */
export function libelleJour(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Nom du mois : « juillet 2026 ». */
export function libelleMois(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
