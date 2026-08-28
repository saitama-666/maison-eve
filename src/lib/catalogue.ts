import 'server-only';

import { unstable_cache, revalidateTag } from 'next/cache';

import {
  categories as categoriesStatiques,
  services as servicesStatiques,
  type Categorie,
  type Service,
} from '@/data/services';
import { articles as articlesStatiques, type Article } from '@/data/journal';
import { adminDb, adminReady } from '@/lib/firebase/admin';

// =====================================================================
//  Lecture du catalogue — CÔTÉ SERVEUR.
//
//  Firestore fait autorité, mais le site ne doit JAMAIS tomber en panne de
//  contenu. D'où le repli automatique sur `src/data/*` : si Firestore est
//  absent, mal configuré ou en erreur, la vitrine continue de fonctionner
//  avec le catalogue versionné dans le dépôt.
//
//  Deux raisons de lire ici plutôt que depuis le navigateur :
//   1. Une seule lecture par rendu, mise en cache 60 s — au lieu d'une
//      lecture par visiteur, facturée à chaque fois.
//   2. Le HTML part rempli : le contenu est indexable, et il n'y a pas de
//      clignotement au chargement.
//
//  Toute écriture admin doit appeler `invaliderCatalogue()`, sinon la
//  modification n'apparaît qu'au bout de 60 secondes.
// =====================================================================

const TAG = 'catalogue';
const TTL = 60;

/** Convertit un document Firestore en `Service`, ou `null` s'il est inexploitable. */
function versService(id: string, d: Record<string, unknown>): Service | null {
  if (typeof d.nom !== 'string' || typeof d.slug !== 'string') return null;

  return {
    id,
    slug: d.slug,
    nom: d.nom,
    categorie: (d.categorie as Service['categorie']) ?? 'massages',
    resume: typeof d.resume === 'string' ? d.resume : '',
    description: Array.isArray(d.description) ? (d.description as string[]) : [],
    duree: typeof d.duree === 'number' ? d.duree : 60,
    prix: typeof d.prix === 'number' ? d.prix : 0,
    supplementDomicile: typeof d.supplementDomicile === 'number' ? d.supplementDomicile : 0,
    domicileDisponible: d.domicileDisponible !== false,
    image: typeof d.image === 'string' ? d.image : '/soins/defaut.jpg',
    bienfaits: Array.isArray(d.bienfaits) ? (d.bienfaits as string[]) : [],
    deroule: Array.isArray(d.deroule) ? (d.deroule as Service['deroule']) : [],
    populaire: d.populaire === true,
    actif: d.actif !== false,
    ordre: typeof d.ordre === 'number' ? d.ordre : 99,
  };
}

async function lireServices(): Promise<readonly Service[]> {
  if (!adminReady) return servicesStatiques;

  try {
    const snap = await adminDb().collection('services').get();
    if (snap.empty) return servicesStatiques;

    const liste = snap.docs
      .map((doc) => versService(doc.id, doc.data() as Record<string, unknown>))
      .filter((s): s is Service => s !== null)
      .sort((a, b) => a.ordre - b.ordre);

    return liste.length > 0 ? liste : servicesStatiques;
  } catch {
    // Panne Firestore : on sert le catalogue statique plutôt qu'une page
    // vide. Le visiteur ne voit pas la différence.
    return servicesStatiques;
  }
}

async function lireCategories(): Promise<readonly Categorie[]> {
  if (!adminReady) return categoriesStatiques;

  try {
    const snap = await adminDb().collection('categories').get();
    if (snap.empty) return categoriesStatiques;

    const liste = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: doc.id as Categorie['id'],
        nom: typeof d.nom === 'string' ? d.nom : doc.id,
        slug: typeof d.slug === 'string' ? d.slug : doc.id,
        resume: typeof d.resume === 'string' ? d.resume : '',
      };
    });

    return liste.length > 0 ? liste : categoriesStatiques;
  } catch {
    return categoriesStatiques;
  }
}

async function lireArticles(): Promise<readonly Article[]> {
  // Un article depublie ne doit JAMAIS quitter le serveur : sinon son texte
  // voyage dans la charge utile RSC de chaque page, meme s'il n'est affiche
  // nulle part. Le repli statique doit donc filtrer comme Firestore.
  const repli = articlesStatiques.filter((a) => a.publie);

  if (!adminReady) return repli;

  try {
    const snap = await adminDb().collection('journal').get();
    if (snap.empty) return repli;

    const liste = snap.docs
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        if (typeof d.titre !== 'string' || typeof d.slug !== 'string') return null;
        return {
          slug: d.slug,
          titre: d.titre,
          chapeau: typeof d.chapeau === 'string' ? d.chapeau : '',
          categorie: typeof d.categorie === 'string' ? d.categorie : 'Journal',
          publieLe: typeof d.publieLe === 'string' ? d.publieLe : new Date().toISOString(),
          auteur: typeof d.auteur === 'string' ? d.auteur : 'MAISON EVE',
          lecture: typeof d.lecture === 'number' ? d.lecture : 4,
          image: typeof d.image === 'string' ? d.image : '/journal/defaut.jpg',
          corps: Array.isArray(d.corps) ? (d.corps as Article['corps']) : [],
          publie: d.publie !== false,
        } satisfies Article;
      })
      .filter((a): a is Article => a !== null)
      // Un article depublie ne doit pas quitter le serveur : sinon son
      // texte voyage dans la charge utile RSC de CHAQUE page, meme s'il
      // n'est affiche nulle part.
      .filter((a) => a.publie);

    return liste.length > 0 ? liste : repli;
  } catch {
    return repli;
  }
}

// --- Versions mises en cache -------------------------------------------

export const getServices = unstable_cache(lireServices, ['services'], {
  revalidate: TTL,
  tags: [TAG],
});

export const getCategories = unstable_cache(lireCategories, ['categories'], {
  revalidate: TTL,
  tags: [TAG],
});

export const getArticles = unstable_cache(lireArticles, ['journal'], {
  revalidate: TTL,
  tags: [TAG],
});

/**
 * À appeler après TOUTE écriture admin sur le catalogue.
 * Sans ça, la modification n'apparaît qu'au bout de `TTL` secondes et
 * l'administrateur croit que son enregistrement a échoué.
 */
export function invaliderCatalogue(): void {
  revalidateTag(TAG);
}

// --- Sélecteurs serveur --------------------------------------------------

export async function getServiceParSlug(slug: string): Promise<Service | undefined> {
  const liste = await getServices();
  return liste.find((s) => s.slug === slug && s.actif);
}

export async function getArticleParSlug(slug: string): Promise<Article | undefined> {
  const liste = await getArticles();
  return liste.find((a) => a.slug === slug && a.publie);
}

/**
 * Le PRIX FAIT FOI ICI, et nulle part ailleurs.
 *
 * C'est cette fonction qu'appelle `POST /api/reservations` pour calculer
 * le montant. Le navigateur envoie un identifiant de soin et un lieu —
 * jamais un prix. Si le client pouvait envoyer un montant, il enverrait
 * zéro.
 */
export async function tarifDuSoin(
  serviceId: string,
  lieu: 'institut' | 'domicile',
): Promise<{ service: Service; total: number } | null> {
  const liste = await getServices();
  const service = liste.find((s) => s.id === serviceId && s.actif);
  if (!service) return null;

  if (lieu === 'domicile' && !service.domicileDisponible) return null;

  const total = service.prix + (lieu === 'domicile' ? service.supplementDomicile : 0);
  return { service, total };
}
