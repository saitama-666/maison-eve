import { NextRequest } from 'next/server';

import { adminDb, adminReady } from '@/lib/firebase/admin';
import {
  contientDonneeBancaire,
  emailValide,
  nettoyer,
  nettoyerMultiligne,
  telValide,
} from '@/lib/validation';

// =====================================================================
//  POST /api/contact — message du formulaire de contact.
//
//  Les règles Firestore autorisent déjà l'écriture directe dans
//  `messages` par un visiteur non connecté, avec une forme verrouillée.
//  On passe quand même par une route API, pour trois raisons que les
//  règles ne peuvent pas couvrir :
//
//   1. LA LIMITATION DE DÉBIT. Les règles Firestore ne savent pas compter
//      les requêtes dans le temps.
//   2. LE POT DE MIEL. On veut répondre 200 à un robot sans rien écrire :
//      une règle Firestore ne peut que refuser, ce qui lui apprend qu'il
//      a été repéré.
//   3. L'ENVOI D'UN E-MAIL à l'institut, le jour où ce sera branché.
// =====================================================================

const RECENTS = new Map<string, number[]>();
const FENETRE_MS = 15 * 60 * 1000;
const MAX_PAR_FENETRE = 3;

function tropDeRequetes(ip: string): boolean {
  const maintenant = Date.now();
  const precedents = (RECENTS.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS);

  if (precedents.length >= MAX_PAR_FENETRE) {
    RECENTS.set(ip, precedents);
    return true;
  }

  precedents.push(maintenant);
  RECENTS.set(ip, precedents);

  if (RECENTS.size > 5000) {
    for (const [cle, valeurs] of RECENTS) {
      if (valeurs.every((t) => maintenant - t >= FENETRE_MS)) RECENTS.delete(cle);
    }
  }

  return false;
}

function ipDe(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'inconnue'
  );
}

export async function POST(request: NextRequest) {
  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  // --- Pot de miel ---
  // Rempli = robot. On répond « envoyé » sans rien écrire : lui dire non
  // lui apprendrait à contourner le piège au prochain essai.
  if (nettoyer(corps.entreprise, 100).length > 0) {
    return Response.json({ ok: true }, { status: 200 });
  }

  if (tropDeRequetes(ipDe(request))) {
    return Response.json(
      { error: 'Trop de messages envoyés. Patientez quelques minutes.' },
      { status: 429 },
    );
  }

  if (contientDonneeBancaire(corps)) {
    return Response.json(
      { error: 'N’envoyez jamais de données bancaires par ce formulaire.' },
      { status: 400 },
    );
  }

  const nom = nettoyer(corps.nom, 80);
  const email = nettoyer(corps.email, 254).toLowerCase();
  const telephone = nettoyer(corps.telephone, 24);
  const sujet = nettoyer(corps.sujet, 140);
  const message = nettoyerMultiligne(corps.message, 4000);

  if (nom.length < 2) return Response.json({ error: 'Nom manquant.' }, { status: 400 });
  if (!emailValide(email)) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (telephone && !telValide(telephone)) {
    return Response.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
  }
  if (message.length < 10) {
    return Response.json({ error: 'Le message est trop court.' }, { status: 400 });
  }

  if (!adminReady) {
    return Response.json(
      { error: 'La messagerie n’est pas encore active. Appelez-nous en attendant.' },
      { status: 503 },
    );
  }

  try {
    await adminDb()
      .collection('messages')
      .add({
        name: nom,
        email,
        phone: telephone || null,
        subject: sujet || null,
        message,
        status: 'nouveau',
        userId: null,
        createdAt: new Date(),
      });

    // TODO — PROGRESS.md §11 : aucune notification n'est envoyée à
    // l'institut. Un message n'existe donc que dans /admin/messages, et
    // il faut penser à y aller. À brancher avant la mise en ligne.

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: 'Le message n’a pas pu être envoyé. Réessayez.' },
      { status: 500 },
    );
  }
}
