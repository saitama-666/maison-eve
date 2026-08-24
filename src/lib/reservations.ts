'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireDb } from '@/lib/firebase/client';

// =====================================================================
//  Réservations — côté client.
//
//  Ce fichier ne sait que LIRE et ANNULER. La CRÉATION passe
//  obligatoirement par `POST /api/reservations`, côté serveur, qui
//  recalcule le prix depuis le catalogue. Les règles Firestore posent
//  `allow create: if false` pour rendre l'autre chemin impossible.
//
//  Ce n'est pas de la prudence excessive : si le navigateur pouvait créer
//  le document, il choisirait le montant écrit sur le reçu.
// =====================================================================

export type StatutReservation =
  | 'en-attente'
  | 'confirmee'
  | 'terminee'
  | 'annulee'
  | 'absente';

export const LIBELLE_STATUT: Record<StatutReservation, string> = {
  'en-attente': 'En attente de confirmation',
  confirmee: 'Confirmé',
  terminee: 'Terminé',
  annulee: 'Annulé',
  absente: 'Non honoré',
};

/** Couleur de la pastille de statut. Jetons uniquement, pas de valeur brute. */
export const TON_STATUT: Record<StatutReservation, string> = {
  'en-attente': 'bg-warning/12 text-warning ring-warning/25',
  confirmee: 'bg-success/12 text-success ring-success/25',
  terminee: 'bg-muted/12 text-muted ring-muted/25',
  annulee: 'bg-danger/10 text-danger ring-danger/25',
  absente: 'bg-danger/10 text-danger ring-danger/25',
};

export type Reservation = {
  id: string;
  reference: string;
  userId: string | null;
  serviceId: string;
  serviceNom: string;
  serviceSlug: string;
  duree: number;
  lieu: 'institut' | 'domicile';
  /** Tarif du soin, hors supplément. */
  prix: number;
  supplementDomicile: number;
  /** Ce que la cliente paiera. Calculé par le SERVEUR. */
  total: number;
  /** ISO. */
  startAt: string;
  endAt: string;
  status: StatutReservation;
  client: {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
  /** Où la praticienne se déplace. Absent si le soin a lieu en institut. */
  adresseSoin: string | null;
  /** Adresse POSTALE de facturation. Jamais de donnée bancaire. */
  adresseFacturation: string | null;
  notes: string;
  createdAt: string | null;
  cancelledAt: string | null;
};

/** Convertit un Timestamp Firestore (ou une chaîne) en ISO. */
function versISO(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function versReservation(id: string, d: Record<string, unknown>): Reservation {
  const client = (d.client as Record<string, unknown> | undefined) ?? {};

  return {
    id,
    reference: (d.reference as string) ?? id.slice(0, 6).toUpperCase(),
    userId: (d.userId as string) ?? null,
    serviceId: (d.serviceId as string) ?? '',
    serviceNom: (d.serviceNom as string) ?? 'Soin',
    serviceSlug: (d.serviceSlug as string) ?? '',
    duree: typeof d.duree === 'number' ? d.duree : 60,
    lieu: d.lieu === 'domicile' ? 'domicile' : 'institut',
    prix: typeof d.prix === 'number' ? d.prix : 0,
    supplementDomicile: typeof d.supplementDomicile === 'number' ? d.supplementDomicile : 0,
    total: typeof d.total === 'number' ? d.total : 0,
    startAt: versISO(d.startAt) ?? '',
    endAt: versISO(d.endAt) ?? '',
    status: (d.status as StatutReservation) ?? 'en-attente',
    client: {
      prenom: (client.prenom as string) ?? '',
      nom: (client.nom as string) ?? '',
      email: (client.email as string) ?? '',
      telephone: (client.telephone as string) ?? '',
    },
    adresseSoin: (d.adresseSoin as string) ?? null,
    adresseFacturation: (d.adresseFacturation as string) ?? null,
    notes: (d.notes as string) ?? '',
    createdAt: versISO(d.createdAt),
    cancelledAt: versISO(d.cancelledAt),
  };
}

/** Les rendez-vous d'une cliente, du plus récent au plus ancien. */
export async function listerMesReservations(uid: string): Promise<Reservation[]> {
  const snap = await getDocs(
    query(
      collection(requireDb(), 'reservations'),
      where('userId', '==', uid),
      orderBy('startAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => versReservation(d.id, d.data() as Record<string, unknown>));
}

/**
 * Un rendez-vous précis.
 *
 * Les règles Firestore refusent la lecture d'un document appartenant à
 * quelqu'un d'autre : inutile de revérifier l'uid ici, ce serait un
 * contrôle de confort, pas de sécurité.
 */
export async function lireReservation(id: string): Promise<Reservation | null> {
  const snap = await getDoc(doc(requireDb(), 'reservations', id));
  if (!snap.exists()) return null;
  return versReservation(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Annulation par la cliente.
 *
 * Les règles n'autorisent que deux champs (`status`, `cancelledAt`), et
 * seulement depuis « en-attente » ou « confirmée ». Un rendez-vous déjà
 * terminé ne peut donc pas être réécrit après coup.
 */
export async function annulerReservation(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'reservations', id), {
    status: 'annulee',
    cancelledAt: serverTimestamp(),
  });
}

/** Un rendez-vous encore annulable ? */
export function annulable(r: Reservation): boolean {
  if (r.status !== 'en-attente' && r.status !== 'confirmee') return false;
  const debut = new Date(r.startAt).getTime();
  if (Number.isNaN(debut)) return false;
  // Passé le rendez-vous, on n'annule plus — on constate.
  return debut > Date.now();
}

/**
 * Fenêtre de courtoisie : au-delà, l'annulation reste possible mais on
 * prévient que c'est tardif. La praticienne a déjà bloqué son créneau.
 */
export function annulationTardive(r: Reservation): boolean {
  const debut = new Date(r.startAt).getTime();
  if (Number.isNaN(debut)) return false;
  return debut - Date.now() < 24 * 3_600_000;
}

/** À venir vs passés — sert à séparer les deux listes de l'espace client. */
export function separerReservations(liste: readonly Reservation[]) {
  const maintenant = Date.now();
  const aVenir: Reservation[] = [];
  const passees: Reservation[] = [];

  liste.forEach((r) => {
    const debut = new Date(r.startAt).getTime();
    const estPasse = Number.isNaN(debut) || debut < maintenant;
    if (estPasse || r.status === 'terminee' || r.status === 'annulee' || r.status === 'absente') {
      passees.push(r);
    } else {
      aVenir.push(r);
    }
  });

  aVenir.sort((a, b) => a.startAt.localeCompare(b.startAt));
  return { aVenir, passees };
}
