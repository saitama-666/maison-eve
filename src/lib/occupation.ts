import 'server-only';

import { adminDb } from '@/lib/firebase/admin';
import { creneauxDuJour } from '@/lib/creneaux';

import type { Query, Transaction } from 'firebase-admin/firestore';

// =====================================================================
//  Occupation de l'agenda.
//
//  Répond à une seule question : « ce créneau est-il déjà pris ? »
//
//  ⚠️  POURQUOI CE FICHIER EXISTE
//
//      La route de réservation vérifiait que l'heure demandée tombait
//      bien dans les horaires d'ouverture, puis écrivait directement en
//      base. Elle ne regardait JAMAIS si quelqu'un avait déjà réservé.
//      Deux clientes pouvaient donc réserver 15 h le même jour, et
//      l'institut n'en découvrait qu'une trop tard.
//
//  ⚠️  UN CRÉNEAU LIBRE N'EST PAS UNE HEURE LIBRE
//
//      Un massage de 90 min à 14 h occupe jusqu'à 15 h 30. Comparer les
//      heures de DÉBUT ne suffit donc pas : il faut comparer les
//      INTERVALLES. Deux rendez-vous se chevauchent si chacun commence
//      avant que l'autre finisse.
// =====================================================================

/**
 * Nombre de rendez-vous possibles EN MÊME TEMPS.
 *
 * À 1, l'agenda se comporte comme une praticienne unique : un seul soin
 * à la fois, où qu'il ait lieu. C'est volontairement l'hypothèse la plus
 * prudente — et la bonne pour un institut qui démarre.
 *
 * Si MAISON EVE ouvre une deuxième cabine avec une deuxième praticienne,
 * passer cette valeur à 2. Ne pas la monter « au cas où » : une place de
 * trop, c'est une cliente qu'on renvoie à son arrivée.
 *
 * Note : les soins à domicile comptent dans le même total. La praticienne
 * qui se déplace n'est pas à l'institut au même moment.
 */
export const PLACES_SIMULTANEES = 1;

/**
 * Durée du soin le plus long, avec marge.
 *
 * Sert à borner la requête : un rendez-vous qui a commencé plus tôt que
 * ça ne peut plus déborder sur le créneau demandé. Sans cette borne il
 * faudrait lire toute la collection.
 *
 * Le soin le plus long du catalogue dure 180 min. La marge absorbe l'ajout
 * d'un soin plus long sans rendre le contrôle faux — au pire elle lit
 * quelques documents de plus.
 */
const AMPLITUDE_MAX_MIN = 300;

/** Un rendez-vous annulé ne bloque plus rien. */
const STATUTS_QUI_BLOQUENT = ['en-attente', 'confirmee', 'terminee'] as const;

type Intervalle = { debut: Date; fin: Date };

/** Deux intervalles se chevauchent-ils ? Bornes de fin exclues. */
export function seChevauchent(a: Intervalle, b: Intervalle): boolean {
  return a.debut < b.fin && b.debut < a.fin;
}

/** Requête bornée sur les rendez-vous susceptibles de gêner. */
function requeteVoisins(debut: Date, fin: Date): Query {
  const borneBasse = new Date(debut.getTime() - AMPLITUDE_MAX_MIN * 60_000);

  // Une seule inégalité, sur un seul champ : Firestore l'indexe tout
  // seul. Le filtre par statut et le vrai test de chevauchement se font
  // en mémoire, sur une poignée de documents.
  return adminDb()
    .collection('reservations')
    .where('startAt', '>=', borneBasse)
    .where('startAt', '<', fin);
}

function versDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  return null;
}

/** Les rendez-vous qui occupent réellement l'intervalle demandé. */
function filtrerConflits(
  docs: readonly FirebaseFirestore.QueryDocumentSnapshot[],
  vise: Intervalle,
): number {
  let n = 0;
  for (const d of docs) {
    const r = d.data();
    if (!(STATUTS_QUI_BLOQUENT as readonly string[]).includes(String(r.status))) continue;

    const debut = versDate(r.startAt);
    const fin = versDate(r.endAt);
    if (!debut || !fin) continue;

    if (seChevauchent({ debut, fin }, vise)) n += 1;
  }
  return n;
}

/**
 * Le créneau est-il encore libre ? À appeler DANS une transaction.
 *
 * La transaction est indispensable : sans elle, deux requêtes simultanées
 * liraient toutes les deux « c'est libre » avant que l'une n'écrive. Le
 * contrôle passerait, et on aurait quand même deux rendez-vous.
 */
export async function creneauLibreDansTransaction(
  tx: Transaction,
  debut: Date,
  fin: Date,
): Promise<boolean> {
  const snap = await tx.get(requeteVoisins(debut, fin));
  return filtrerConflits(snap.docs, { debut, fin }) < PLACES_SIMULTANEES;
}

/**
 * Heures de début qu'on ne peut PAS proposer ce jour-là, pour un soin de
 * cette durée. Alimente le calendrier.
 *
 * Ne renvoie que des heures — jamais un nom, un téléphone ou un montant.
 * Cette route est publique : le calendrier doit fonctionner avant toute
 * connexion.
 */
export async function heuresOccupees(jour: Date, dureeMinutes: number): Promise<string[]> {
  const debutJour = new Date(jour);
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date(debutJour);
  finJour.setDate(finJour.getDate() + 1);

  const snap = await requeteVoisins(debutJour, finJour).get();
  if (snap.empty) return [];

  const occupees: string[] = [];

  for (const creneau of creneauxDuJour(debutJour, dureeMinutes)) {
    const debut = new Date(debutJour);
    debut.setMinutes(creneau.minutes);
    const fin = new Date(debut.getTime() + dureeMinutes * 60_000);

    if (filtrerConflits(snap.docs, { debut, fin }) >= PLACES_SIMULTANEES) {
      occupees.push(creneau.heure);
    }
  }

  return occupees;
}
