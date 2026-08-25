import { FUSEAU } from '@/lib/fuseau';
import clsx, { type ClassValue } from 'clsx';

import { site } from '@/data/site';

// =====================================================================
//  Petits utilitaires partagés. Rien de métier ici.
// =====================================================================

/** Concatène des classes conditionnelles. */
export function cn(...entrees: ClassValue[]): string {
  return clsx(entrees);
}

/**
 * Prix en dirhams.
 *
 * `Intl` avec la locale fr-MA affiche « 400,00 MAD » — trop long pour une
 * carte de soin. On formate le nombre nous-mêmes et on colle « DH »,
 * comme l'écrivent les instituts au Maroc.
 */
export function prix(montant: number): string {
  const arrondi = Math.round(montant);
  // `fr-FR` separe les milliers par une espace fine insecable (U+202F) ou
  // une insecable (U+00A0) selon le moteur. On normalise en espace simple :
  // sinon la meme page s'espace differemment d'un navigateur a l'autre.
  const nombre = arrondi.toLocaleString('fr-FR').replace(/[  \s]/g, ' ');
  return `${nombre} ${site.currencyLabel}`;
}

/** Durée en minutes → « 1 h 15 », « 45 min », « 3 h ». */
export function duree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Date ISO ou Date → « 14 juillet 2026 ». */
export function dateLongue(valeur: string | Date | number): string {
  const d = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    timeZone: FUSEAU, day: 'numeric', month: 'long', year: 'numeric' });
}

/** Date + heure → « mar. 14 juil., 15:30 ». */
export function dateHeure(valeur: string | Date | number): string {
  const d = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    timeZone: FUSEAU,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** « 14/07/2026 » — pour les tableaux du back-office. */
export function dateCourte(valeur: string | Date | number): string {
  const d = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    timeZone: FUSEAU, day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Heure seule → « 15:30 ». */
export function heure(valeur: string | Date | number): string {
  const d = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', {
    timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' });
}

/**
 * Clé de jour « 2026-07-14 » en heure LOCALE.
 *
 * `toISOString()` convertit en UTC : à Casablanca en été, un rendez-vous
 * de 00h30 basculerait au jour précédent. D'où le calcul manuel.
 */
export function cleJour(d: Date): string {
  const an = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${an}-${mois}-${jour}`;
}

/** Slug d'URL : minuscules, sans accent, tirets. */
export function slug(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // diacritiques combinants
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Coupe proprement à la fin d'un mot. */
export function extrait(texte: string, longueur = 160): string {
  if (texte.length <= longueur) return texte;
  const coupe = texte.slice(0, longueur);
  return `${coupe.slice(0, coupe.lastIndexOf(' '))}…`;
}

/** Initiales pour la pastille d'avatar. */
export function initiales(prenom?: string | null, nom?: string | null, repli = '?'): string {
  const a = prenom?.trim()?.[0] ?? '';
  const b = nom?.trim()?.[0] ?? '';
  const res = `${a}${b}`.toUpperCase();
  return res || repli;
}

/**
 * Référence de rendez-vous lisible : « ME-7K2M9 ».
 *
 * Volontairement courte et sans ambiguïté à l'oral : ni O ni 0, ni I ni 1.
 * Une cliente doit pouvoir la dicter au téléphone sans se tromper.
 */
export function referenceRdv(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ME-${out}`;
}

/** Limite une valeur à un intervalle. */
export function borne(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

/** Retarde l'exécution — utilisé pour les états de chargement simulés. */
export function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
