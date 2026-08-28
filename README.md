# MAISON EVE — Beauty & Spa

Site de l'institut : vitrine, catalogue de soins, réservation en ligne, espace client et
back-office. Institut de beauté, hammam et spa à **Témara**.

- **État d'avancement et `[placeholder]` à remplir** → [`PROGRESS.md`](./PROGRESS.md)
- **Sécurité, modèle de menace, checklist de mise en ligne** → [`SECURITY.md`](./SECURITY.md)

---

## Démarrer

> **Sur le poste de Hamza**, l'exécution de scripts PowerShell est désactivée : `npm run dev`
> échoue avec `PSSecurityException`. Utiliser les fichiers `.cmd` ci-dessous, ou préfixer par
> `npm.cmd`.

```bash
dev.cmd
```

Le site démarre sur `http://localhost:3000`.

**Sans Firebase, le site fonctionne quand même** : accueil, catalogue, fiches de soin, journal,
galerie, FAQ et pages légales s'affichent normalement. Seuls les comptes, la réservation en
ligne et le back-office sont indisponibles. C'est volontaire — un site qui refuse de démarrer
parce qu'une variable manque est un site qu'on ne peut pas déboguer.

---

## Configurer Firebase

1. Créer un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Activer **Authentication** → méthodes **E-mail/Mot de passe** et **Google**.
3. Créer une base **Firestore** (région `europe-west1`).
4. Copier `.env.local.example` en `.env.local` et remplir les valeurs.
5. Déployer les règles de sécurité :

```bash
node scripts/deploy-rules.mjs
```

6. S'inscrire sur le site, puis se donner les droits d'administration :

```bash
node scripts/set-admin.mjs votre@email.com
```

7. **Se déconnecter puis se reconnecter** — le rôle vit dans le jeton, il faut un jeton neuf.
8. Ouvrir `/admin`.

### Facultatif : passer le catalogue en base

```bash
node scripts/seed.mjs
```

Écrit les soins, catégories et articles dans Firestore. À partir de là, le catalogue se
modifie depuis `/admin/soins` sans toucher au code. Sans ce script, le site utilise le
catalogue de repli inscrit dans `src/data/`.

---

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `dev.cmd` | Serveur de développement |
| `build.cmd` | **Build de vérification** — écrit dans `.next-verif` |
| `start.cmd` | Serveur de production (après un build) |
| `npx tsc --noEmit` | Vérification des types |
| `npx next lint` | Analyse statique |
| `node scripts/deploy-rules.mjs` | Déploie `firestore.rules` |
| `node scripts/set-admin.mjs <email>` | Donne le rôle admin (`--retirer` pour l'enlever) |
| `node scripts/seed.mjs` | Remplit Firestore depuis `src/data/` |
| `node scripts/visuels.mjs` | Régénère les 32 illustrations de remplacement |

> ⚠️ **Ne jamais lancer `next build` nu pendant que le serveur de dev tourne.** Il écraserait
> son dossier `.next` par un build de production, et le serveur se mettrait à répondre sans
> feuille de style ou en 500. C'est pour ça que `build.cmd` passe par `NEXT_DIST_DIR`.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15, App Router, React 19 |
| Langage | TypeScript, mode strict |
| Styles | Tailwind v4, configuration CSS-first (`@theme` dans `globals.css`) |
| Animation | Framer Motion + Lenis (défilement lissé) |
| Données | Firebase Auth + Firestore |
| Graphiques | SVG écrits à la main, aucune librairie |

---

## Organisation du code

```
src/
├── app/            routes (App Router) — une page = un dossier
├── components/
│   ├── admin/      back-office
│   ├── auth/       connexion, inscription, mot de passe oublié
│   ├── compte/     espace client
│   ├── home/       les 10 sections de la page d'accueil
│   ├── layout/     Header, Footer, Chrome, EnTetePage
│   ├── motion/     SmoothScroll, Reveal, Effets, Cursor
│   ├── reservation/ le tunnel en 5 étapes
│   └── ui/         Button, Field, Icon, Logo, Accordion, Lightbox…
├── data/           catalogue de repli, FAQ, journal, identité de marque
└── lib/            motion, validation, firebase, catalogue, créneaux, adresses
```

### Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Un numéro, une adresse, les horaires | `src/data/site.ts` |
| Les soins, les prix, les durées | `src/data/services.ts` (ou `/admin/soins` après le seed) |
| Les questions fréquentes | `src/data/faq.ts` |
| Les articles du journal | `src/data/journal.ts` |
| Les couleurs, les polices, les rayons | `src/app/globals.css` (bloc `@theme`) |
| Les durées d'animation | `src/lib/motion.ts` |
| Les horaires d'ouverture réservables | `src/lib/creneaux.ts` |
| Les règles d'accès aux données | `firestore.rules` |

---

## Trois choses à savoir avant de modifier

**1. Le prix est décidé par le serveur, jamais par le navigateur.**
`POST /api/reservations` reçoit un `serviceId` et un `lieu`, puis relit le tarif dans le
catalogue. Les règles Firestore posent `allow create: if false` sur `reservations` pour rendre
tout autre chemin impossible. Ne pas « réparer » cette règle.

**2. Aucune donnée bancaire n'entre dans la base.**
L'« adresse de facturation » est une adresse **postale**. Le garde-fou est posé trois fois, de
façon indépendante : règles Firestore, routes API, et couche client. Le paiement se fait sur
place, après le soin.

**3. Aucune couleur n'est écrite en dur.**
Tout passe par les variables `--color-*`. C'est ce qui permet au thème sombre du back-office de
fonctionner sans une seule classe conditionnelle. Une valeur en dur échappe au thème et devient
impossible à corriger d'un seul endroit.

---

## Déploiement

Prévu pour Vercel.

1. Connecter le dépôt.
2. Reporter **toutes** les variables de `.env.local` dans les réglages du projet.
   Pour `FIREBASE_SERVICE_ACCOUNT_KEY`, coller le JSON **brut**, sans guillemets autour.
3. Mettre `NEXT_PUBLIC_SITE_URL` à l'URL de production.
4. **Ne pas** définir `NEXT_DIST_DIR` : Vercel doit construire dans `.next`.

Puis, dans la console Google Cloud, **restreindre la clé API par référent HTTP** au domaine de
production. Sans cette restriction, la clé publique peut être réutilisée depuis n'importe quel
site.

Voir [`SECURITY.md`](./SECURITY.md) pour la checklist complète avant ouverture au public.
