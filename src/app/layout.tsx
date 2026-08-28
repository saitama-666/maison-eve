import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost, Parisienne } from 'next/font/google';

import { Chrome } from '@/components/layout/Chrome';
import { Providers } from '@/components/layout/Providers';
import { contact, DEMONSTRATION, estAComplete, site } from '@/data/site';
import { getArticles, getCategories, getServices } from '@/lib/catalogue';

import './globals.css';

// =====================================================================
//  Typographies.
//
//  `next/font` télécharge les fichiers AU BUILD et les sert depuis notre
//  domaine. Conséquences : aucune requête vers Google au chargement,
//  aucun cookie tiers, et pas de saut de mise en page — Next calcule les
//  métriques de la police de repli pour qu'elle occupe la même place.
//
//  Trois familles, pas quatre. Chacune a un rôle :
//   · Cormorant Garamond — les titres. Serif fine, contrastée, féminine.
//   · Parisienne — le nom de la marque UNIQUEMENT. Jamais un paragraphe :
//     un script est illisible au-delà de quelques mots.
//   · Jost — l'interface et les textes courants. Géométrique et neutre.
// =====================================================================

// ⚠️  NE DECLARER QUE LES GRAISSES REELLEMENT RENDUES.
//
//     Chaque graisse x chaque style = un fichier .woff2 genere, et
//     `next/font` en PRECHARGE une partie a chaque page. On declarait
//     300/400/500/600 en normal ET italique pour Cormorant, plus un 200
//     pour Jost : 380 kB de polices en 15 fichiers, dont 126 kB
//     precharges au premier octet.
//
//     Releve dans le DOM rendu, sur toutes les pages : Cormorant ne sort
//     qu'en 300 (normal et italique) et 400 ; Jost en 300, 400 et 500.
//     Le 600 de Cormorant et le 200 de Jost n'apparaissaient nulle part —
//     aucune classe `font-semibold`, `font-bold` ni `font-extralight`
//     dans tout le depot.
//
//     Avant d'ajouter une graisse ici, verifier qu'une regle CSS la
//     demande vraiment. Sinon c'est un fichier telecharge pour rien.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const parisienne = Parisienne({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-parisienne',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.fullName} — Institut, hammam et spa à ${contact.city}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    'spa Témara',
    'hammam Témara',
    'institut de beauté Témara',
    'spa Rabat',
    'hammam Rabat',
    'massage Témara',
    'onglerie Témara',
    'coiffure Témara',
    'soin du visage',
    'épilation Témara',
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.fullName} — ${site.baseline}`,
    description: site.description,
    // Sans cette image, un lien partagé sur WhatsApp n'affiche qu'un
    // rectangle vide. C'est le canal principal de la clientèle, donc
    // c'est le premier contact avec la marque pour beaucoup de gens.
    // 1200×630 est le format qu'attendent WhatsApp, Facebook et LinkedIn.
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: `${site.fullName} — ${site.baseline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.fullName} — ${site.baseline}`,
    description: site.description,
    images: ['/og.jpg'],
  },
  /*
    ⚠️  C'EST CETTE BALISE QUI TIENT LA CONSIGNE, PAS `robots.txt`.

        `robots.txt` dit si on peut ENTRER. Cette balise dit si on peut
        INDEXER. Les deux sont pilotees par le meme `DEMONSTRATION`,
        parce qu'elles se sont deja contredites une fois.

        `follow: true` malgre le `noindex` : on VEUT que Google suive les
        liens. Il atteint ainsi chaque page et y lit son propre `noindex`.
        Avec `nofollow`, une page jamais visitee mais dont l'URL circule
        pourrait etre listee toute nue.

        `noimageindex` : nos photos sont des visuels generes presentes
        comme l'institut de Maison Eve. Elles n'ont rien a faire dans
        Google Images.
  */
  robots: DEMONSTRATION
    ? {
        index: false,
        follow: true,
        nocache: true,
        googleBot: { index: false, follow: true, noimageindex: true },
      }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
      },
  alternates: { canonical: '/' },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  themeColor: '#6f5f52',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Données structurées.
 *
 * `DaySpa` est le type schema.org exact pour un spa — plus précis que
 * `LocalBusiness`, ce qui aide Google à afficher les bons attributs.
 *
 * ⚠️  AUCUN `aggregateRating` ici, volontairement. Publier une note
 *     moyenne fabriquée revient à mentir directement à Google. Le champ
 *     ne sera ajouté que quand de vrais avis existeront, et il devra
 *     alors être calculé depuis la collection `reviews`.
 */
/**
 * N'inclut la valeur QUE si elle est reellement renseignee.
 *
 * ⚠️  Sans ce filtre, les donnees structurees partaient chez Google avec
 *     `streetAddress: "[adresse a completer]"` et le telephone de
 *     remplissage. Publier un gabarit dans du schema.org, c'est declarer
 *     a Google une coordonnee qui n'existe pas — la meme faute que les
 *     avis inventes, en moins visible.
 *
 *     Un champ absent est neutre. Un champ faux ne l'est pas.
 */
function siRenseigne<T extends Record<string, unknown>>(valeur: string, objet: T): T | undefined {
  return estAComplete(valeur) ? undefined : objet;
}

const adresseComplete = !estAComplete(contact.street) && !estAComplete(contact.postalCode);

const donneesStructurees = {
  '@context': 'https://schema.org',
  '@type': 'DaySpa',
  name: site.fullName,
  url: site.url,
  description: site.description,
  slogan: site.baseline,
  ...siRenseigne(contact.email, { email: contact.email }),
  ...siRenseigne(contact.phone, { telephone: contact.phone }),
  priceRange: '$$',
  currenciesAccepted: site.currency,
  // La ville et le pays sont vrais et utiles au referencement local ; on
  // les garde meme sans la rue, et on n'ajoute la rue que si elle existe.
  address: {
    '@type': 'PostalAddress',
    ...(adresseComplete
      ? { streetAddress: contact.street, postalCode: contact.postalCode }
      : {}),
    addressLocality: contact.city,
    addressCountry: contact.countryCode,
  },
  ...siRenseigne(contact.homeServiceArea, { areaServed: contact.homeServiceArea }),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Le catalogue est lu ICI, côté serveur, puis injecté dans toute
  // l'application. Un seul aller-retour Firestore par rendu, mis en cache
  // 60 s — au lieu d'une lecture par visiteur et par page.
  const [services, categories, articles] = await Promise.all([
    getServices(),
    getCategories(),
    getArticles(),
  ]);

  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${parisienne.variable} ${jost.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        {/*
          FILET DE SÉCURITÉ — à garder, même s'il ne sert presque plus.

          La vitrine n'utilise plus Framer Motion pour révéler du contenu :
          tout passe par `animation-timeline` en CSS, donc rien n'attend
          JavaScript pour être visible (voir `globals.css`).

          Il subsiste quelques `initial` Framer dans l'espace client et le
          back-office, où le JavaScript est de toute façon indispensable.
          Cette règle garantit que si l'un d'eux réapparaissait un jour sur
          une page publique, il ne rendrait pas le contenu invisible.

          `!important` est nécessaire : on écrase un style en ligne, et
          rien d'autre ne le peut.
        */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                [style*="opacity:0"] {
                  opacity: 1 !important;
                  transform: none !important;
                }
                [style*="clip-path:inset"] {
                  clip-path: none !important;
                }
              `,
            }}
          />
        </noscript>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
        />

        {/* Lien d'évitement — première chose atteinte à la tabulation.
            Il permet de sauter la navigation, qui est identique sur toutes
            les pages. Invisible tant qu'il n'a pas le focus. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:text-oncream"
        >
          Aller au contenu
        </a>

        {/*
          ⚠️  NI DÉFILEMENT LISSÉ (Lenis) NI CURSEUR PERSONNALISÉ. Retirés
              après un retour d'usage : « le responsive est vraiment
              merdique et lent ».

          · Lenis interceptait la molette pour réinterpoler la position à
            chaque image, sur le fil principal. Sur une machine ordinaire,
            ça ne rend pas le défilement plus doux — ça le rend en retard
            sur le doigt. Le défilement natif est déjà lissé par le
            système, et il est composé hors du fil principal.

          · Le curseur personnalisé écoutait chaque `mousemove`, faisait
            un `closest()` dans le DOM et pilotait quatre ressorts. Coût
            permanent, et strictement nul sur téléphone où il n'existe pas.
        */}
        <Providers services={services} categories={categories} articles={articles}>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
