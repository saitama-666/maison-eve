import type { NextConfig } from 'next';

/**
 * En-têtes de sécurité appliqués à toutes les routes.
 *
 * La CSP n'autorise que ce dont Firebase (Auth + Firestore) a besoin.
 * Toute origine ajoutée ici doit être justifiée : c'est la dernière
 * barrière si un script tiers se retrouve injecté dans une page.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injecte ses scripts d'hydratation en inline, et Firebase Auth
      // charge un helper depuis gstatic pour la connexion Google.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
      "media-src 'self' blob:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  /**
   * Dossier de sortie.
   *
   * Lancer `next build` pendant que le serveur de dev tourne écrase son
   * `.next` par un build de production : le serveur répond alors sans
   * feuille de style, ou en 500. C'est un piège déjà vécu sur l'autre
   * projet — d'où cette variable.
   *
   * Tout build de vérification doit passer par
   * `NEXT_DIST_DIR=.next-verif npx next build`.
   * Vercel n'a pas la variable et construit dans `.next` normalement.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    /**
     * AVIF d'abord, WebP ensuite, JPEG en dernier recours.
     *
     * Le navigateur annonce ce qu'il accepte, Next sert le meilleur des
     * trois. Sur nos photos de spa — beaucoup de tons chair et de
     * degrades doux — l'AVIF pese environ moitie moins que le JPEG a
     * qualite egale. Ca ne coute qu'un peu de calcul au PREMIER appel :
     * le resultat est ensuite mis en cache.
     */
    formats: ['image/avif', 'image/webp'],

    /**
     * Duree de vie du cache d'optimisation : 30 jours.
     *
     * ⚠️  NOS FICHIERS NE SONT PAS VERSIONNES PAR LEUR NOM.
     *     `/soins/massage-argan.jpg` reste `/soins/massage-argan.jpg`
     *     apres remplacement. Deposer une nouvelle photo SOUS LE MEME NOM
     *     ne se verra donc pas avant l'expiration.
     *     Pour changer une photo : soit lui donner un nom neuf et mettre
     *     a jour le champ `image` dans /admin, soit redeployer.
     */
    minimumCacheTTL: 2592000,

    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
