'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { requireDb } from '@/lib/firebase/client';
import { contientDonneeBancaire, nettoyer, nettoyerMultiligne } from '@/lib/validation';

// =====================================================================
//  Carnet d'adresses.
//
//  Une adresse sert à DEUX choses, et la distinction compte :
//    · FACTURATION — le nom et l'adresse qui figurent sur le reçu.
//    · SOIN — là où la praticienne se déplace, pour un soin à domicile.
//  Souvent les deux sont identiques : d'où le type `les-deux`.
//
//  ⚠️  AUCUNE DONNÉE BANCAIRE ICI. « Adresse de facturation » désigne une
//      adresse POSTALE. Le garde-fou est posé trois fois : dans ce
//      fichier, dans les routes API, et dans `firestore.rules`. Les trois
//      sont indépendants — c'est le but.
// =====================================================================

export type Adresse = {
  id: string;
  label: string;
  type: 'facturation' | 'soin' | 'les-deux';
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  isDefaultBilling: boolean;
  isDefaultService: boolean;
  notes: string;
};

export type NouvelleAdresse = Omit<Adresse, 'id'>;

/** Adresse vide — sert de valeur initiale aux formulaires. */
export function adresseVide(): NouvelleAdresse {
  return {
    label: '',
    type: 'les-deux',
    firstName: '',
    lastName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    region: '',
    country: 'Maroc',
    isDefaultBilling: false,
    isDefaultService: false,
    notes: '',
  };
}

function chemin(uid: string) {
  return collection(requireDb(), 'users', uid, 'addresses');
}

/**
 * Normalise avant écriture.
 *
 * Deux rôles : borner les longueurs pour coller aux règles Firestore (une
 * chaîne trop longue fait échouer l'écriture avec un message obscur), et
 * refuser tout champ bancaire qui se serait glissé dans l'objet.
 */
function preparer(a: NouvelleAdresse): Record<string, unknown> {
  if (contientDonneeBancaire(a)) {
    throw new Error(
      'Une adresse ne peut pas contenir de données bancaires. ' +
        'Aucun moyen de paiement n’est demandé ni conservé sur ce site.',
    );
  }

  return {
    label: nettoyer(a.label, 40),
    type: a.type,
    firstName: nettoyer(a.firstName, 60),
    lastName: nettoyer(a.lastName, 60),
    phone: nettoyer(a.phone, 24),
    line1: nettoyer(a.line1, 160),
    line2: nettoyer(a.line2, 160),
    city: nettoyer(a.city, 80),
    postalCode: nettoyer(a.postalCode, 16),
    region: nettoyer(a.region, 80),
    country: nettoyer(a.country, 60),
    isDefaultBilling: Boolean(a.isDefaultBilling),
    isDefaultService: Boolean(a.isDefaultService),
    notes: nettoyerMultiligne(a.notes, 400),
  };
}

export async function listerAdresses(uid: string): Promise<Adresse[]> {
  const snap = await getDocs(query(chemin(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => {
    const v = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      label: (v.label as string) ?? '',
      type: (v.type as Adresse['type']) ?? 'les-deux',
      firstName: (v.firstName as string) ?? '',
      lastName: (v.lastName as string) ?? '',
      phone: (v.phone as string) ?? '',
      line1: (v.line1 as string) ?? '',
      line2: (v.line2 as string) ?? '',
      city: (v.city as string) ?? '',
      postalCode: (v.postalCode as string) ?? '',
      region: (v.region as string) ?? '',
      country: (v.country as string) ?? '',
      isDefaultBilling: v.isDefaultBilling === true,
      isDefaultService: v.isDefaultService === true,
      notes: (v.notes as string) ?? '',
    };
  });
}

export async function ajouterAdresse(uid: string, a: NouvelleAdresse): Promise<string> {
  const ref = await addDoc(chemin(uid), { ...preparer(a), createdAt: serverTimestamp() });

  // Les drapeaux « par défaut » sont exclusifs : on les retire des autres
  // adresses APRÈS avoir écrit celle-ci, sinon un échec en cours de route
  // laisserait le carnet sans adresse par défaut du tout.
  if (a.isDefaultBilling) await rendreDefaut(uid, ref.id, 'facturation');
  if (a.isDefaultService) await rendreDefaut(uid, ref.id, 'soin');

  return ref.id;
}

export async function modifierAdresse(
  uid: string,
  id: string,
  a: NouvelleAdresse,
): Promise<void> {
  await updateDoc(doc(requireDb(), 'users', uid, 'addresses', id), {
    ...preparer(a),
    updatedAt: serverTimestamp(),
  });

  if (a.isDefaultBilling) await rendreDefaut(uid, id, 'facturation');
  if (a.isDefaultService) await rendreDefaut(uid, id, 'soin');
}

export async function supprimerAdresse(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'users', uid, 'addresses', id));
}

/**
 * Rend une adresse « par défaut » et retire le drapeau aux autres.
 *
 * En lot (`writeBatch`) : soit tout passe, soit rien. Sans ça, une coupure
 * réseau au milieu laisserait deux adresses marquées par défaut, et le
 * formulaire de réservation en choisirait une au hasard.
 */
export async function rendreDefaut(
  uid: string,
  id: string,
  usage: 'facturation' | 'soin',
): Promise<void> {
  const db = requireDb();
  const champ = usage === 'facturation' ? 'isDefaultBilling' : 'isDefaultService';

  const snap = await getDocs(chemin(uid));
  const lot = writeBatch(db);
  let modifie = false;

  snap.docs.forEach((d) => {
    const actuel = (d.data() as Record<string, unknown>)[champ] === true;
    const voulu = d.id === id;
    if (actuel !== voulu) {
      lot.update(doc(db, 'users', uid, 'addresses', d.id), {
        [champ]: voulu,
        updatedAt: serverTimestamp(),
      });
      modifie = true;
    }
  });

  if (modifie) await lot.commit();
}

/** Adresse de facturation par défaut, ou la première disponible. */
export function adresseFacturation(liste: readonly Adresse[]): Adresse | undefined {
  return (
    liste.find((a) => a.isDefaultBilling) ??
    liste.find((a) => a.type === 'facturation' || a.type === 'les-deux')
  );
}

/** Adresse d'intervention par défaut, ou la première disponible. */
export function adresseSoin(liste: readonly Adresse[]): Adresse | undefined {
  return (
    liste.find((a) => a.isDefaultService) ??
    liste.find((a) => a.type === 'soin' || a.type === 'les-deux')
  );
}

/** Rendu sur une ligne, pour les récapitulatifs. */
export function adresseEnLigne(a: Adresse): string {
  return [a.line1, a.line2, a.postalCode, a.city, a.country].filter(Boolean).join(', ');
}
