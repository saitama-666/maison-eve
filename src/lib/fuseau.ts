// =====================================================================
//  Le fuseau de l'institut.
//
//  ⚠️  POURQUOI CE FICHIER EXISTE
//
//      Les créneaux étaient construits avec `new Date(an, mois, jour, h, m)`,
//      qui interprète l'heure dans le fuseau de CELUI QUI EXÉCUTE LE CODE.
//      Le même « 15:00 » donnait donc trois instants différents :
//
//        navigateur au Maroc (UTC+1) → 14:00 UTC   ✔
//        machine de développement (UTC+2) → 13:00 UTC
//        serveur Vercel (UTC)             → 15:00 UTC, soit 16 h au Maroc
//
//      Une cliente réservait 15 h et se voyait confirmer 16 h. Les horaires
//      d'ouverture glissaient d'autant.
//
//      Un rendez-vous n'a qu'une seule heure : celle de l'institut. Tout
//      calcul d'horaire passe donc par ce fichier, jamais par l'heure
//      locale du runtime.
//
//  Le Maroc est à UTC+1 toute l'année, sauf pendant le ramadan où il
//  repasse à UTC+0. On ne code surtout pas cette règle à la main :
//  `Intl` connaît la base IANA et suit les changements.
// =====================================================================

export const FUSEAU = 'Africa/Casablanca';

const FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSEAU,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export type Parties = {
  an: number;
  mois: number;
  jour: number;
  heures: number;
  minutes: number;
  /** 0 = dimanche, comme `Date.getDay()`. */
  jourSemaine: number;
};

/** Les composants d'un instant, lus À L'HEURE DE L'INSTITUT. */
export function partiesLocales(instant: Date): Parties {
  const p = Object.fromEntries(
    FORMAT.formatToParts(instant).map((x) => [x.type, x.value]),
  ) as Record<string, string>;

  const an = Number(p.year);
  const mois = Number(p.month);
  const jour = Number(p.day);
  // `Intl` rend « 24 » pour minuit dans certaines implémentations.
  const heures = Number(p.hour) % 24;

  return {
    an,
    mois,
    jour,
    heures,
    minutes: Number(p.minute),
    // Un Date construit en UTC avec les composants locaux donne le bon
    // jour de la semaine sans dépendre du fuseau du runtime.
    jourSemaine: new Date(Date.UTC(an, mois - 1, jour)).getUTCDay(),
  };
}

/** Décalage du fuseau à cet instant, en millisecondes. */
function decalage(instant: Date): number {
  const p = partiesLocales(instant);
  const commeUTC = Date.UTC(p.an, p.mois - 1, p.jour, p.heures, p.minutes, 0);
  // On repart des secondes de l'instant : `partiesLocales` les ignore.
  return commeUTC - Math.floor(instant.getTime() / 60_000) * 60_000;
}

/**
 * L'instant correspondant à une date et une heure DE L'INSTITUT.
 *
 * On résout par approximations successives : le décalage dépend de
 * l'instant, et l'instant dépend du décalage. Deux passes suffisent, y
 * compris les jours de changement d'heure.
 */
export function instantLocal(
  an: number,
  mois: number,
  jour: number,
  heures = 0,
  minutes = 0,
): Date {
  const naif = Date.UTC(an, mois - 1, jour, heures, minutes, 0);
  let t = naif;

  for (let i = 0; i < 2; i += 1) {
    t = naif - decalage(new Date(t));
  }

  return new Date(t);
}

/** Minuit, à l'heure de l'institut, du jour qui contient cet instant. */
export function debutDeJournee(instant: Date): Date {
  const p = partiesLocales(instant);
  return instantLocal(p.an, p.mois, p.jour);
}

/** « 2026-09-04 » à l'heure de l'institut. */
export function cleJourLocale(instant: Date): string {
  const p = partiesLocales(instant);
  return `${p.an}-${String(p.mois).padStart(2, '0')}-${String(p.jour).padStart(2, '0')}`;
}

/** Minutes depuis minuit, à l'heure de l'institut. */
export function minutesDansLaJournee(instant: Date): number {
  const p = partiesLocales(instant);
  return p.heures * 60 + p.minutes;
}
