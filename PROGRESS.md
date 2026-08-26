# MAISON EVE — Beauty & Spa · état d'avancement

Site vitrine et réservation. Institut à Casablanca + soins à domicile.
Dernière mise à jour : **20 août 2026**.

Deux autres fichiers font autorité et doivent être lus avant toute reprise :

- **`SECURITY.md`** — modèle de menace, décisions de sécurité, checklist de mise en ligne.
- **`README.md`** — comment lancer, construire, déployer.
- **`AUDIT.md`** — audit page par page du 20 août 2026 : ce qui a été trouvé, corrigé, et
  ce qui reste ouvert. À relire avant de « corriger » quelque chose qui a l'air bizarre : sa
  §5 explique deux artefacts de test qui font perdre du temps si on repart dessus, et sa
  §8 raconte la refonte du mouvement.

---

## 1. En un coup d'œil

| | |
|---|---|
| **Stack** | Next.js 15 (App Router) · TypeScript strict · Tailwind v4 (CSS-first) · Firebase (Auth + Firestore) |
| **Mouvement** | CSS (`animation-timeline`). Framer Motion seulement dans les zones interactives — voir §4 |
| **Langue** | Français |
| **Ville / devise** | Casablanca · dirham (MAD) |
| **Pages publiques** | 13 |
| **Pages espace client** | 5 |
| **Pages back-office** | 5 |
| **Routes API** | 6 |
| **Typecheck** | ✅ propre (`npx tsc --noEmit`) |
| **Firebase** | ⛔ **non configuré** — `.env.local` à remplir |

---

## 2. Ce qui est fait

### Vitrine

| Page | Route | État |
|---|---|---|
| Accueil | `/` | ✅ 10 sections |
| Nos soins | `/soins` | ✅ filtrable par catégorie et par « à domicile » |
| Fiche de soin | `/soins/[slug]` | ✅ pré-générée par soin |
| À propos | `/a-propos` | ⚠️ contient des `[placeholder]` (voir §11) |
| Galerie | `/galerie` | ⚠️ visuels provisoires |
| Journal | `/journal` | ✅ 4 articles rédigés |
| Article | `/journal/[slug]` | ✅ + barre de progression de lecture |
| Contact | `/contact` | ✅ formulaire + coordonnées |
| Questions fréquentes | `/faq` | ✅ 10 questions, groupées |
| Réservation | `/reservation` | ✅ tunnel en 5 étapes |
| Confirmation | `/reservation/[id]` | ✅ |
| CGV | `/cgv` | ⚠️ à faire valider juridiquement |
| Confidentialité | `/confidentialite` | ⚠️ idem |
| Mentions légales | `/mentions-legales` | ⚠️ mentions obligatoires manquantes |

### Comptes

| | Route | État |
|---|---|---|
| Connexion | `/connexion` | ✅ e-mail + Google |
| Inscription | `/inscription` | ✅ avec jauge de force du mot de passe |
| Mot de passe oublié | `/mot-de-passe-oublie` | ✅ réponse indifférenciée (anti-énumération) |
| Tableau de bord | `/compte` | ✅ |
| Mes rendez-vous | `/compte/reservations` | ✅ avec annulation |
| **Mes adresses** | `/compte/adresses` | ✅ facturation + soin, CRUD complet |
| Mes favoris | `/compte/favoris` | ✅ |
| Paramètres | `/compte/parametres` | ✅ profil, mot de passe, suppression |

### Back-office `/admin`

| | État |
|---|---|
| Tableau de bord | ✅ graphiques SVG faits main, aucune librairie |
| Rendez-vous | ✅ filtres, dépliage, changement de statut optimiste |
| Soins | ✅ CRUD complet avec aperçu en direct |
| Clientes | ✅ liste + recherche |
| Messages | ✅ boîte de réception, marquage, suppression |
| Bascule clair / sombre | ✅ via View Transitions |

### Routes API

| Route | Méthodes | Protection |
|---|---|---|
| `/api/reservations` | POST | limitation de débit + revalidation serveur complète |
| `/api/contact` | POST | limitation de débit + pot de miel |
| `/api/admin/apercu` | GET | `requireAdmin()` |
| `/api/admin/reservations` | GET, PATCH | `requireAdmin()` |
| `/api/admin/soins` | GET, POST, PATCH, DELETE | `requireAdmin()` |
| `/api/admin/clients` | GET | `requireAdmin()` |
| `/api/admin/messages` | GET, PATCH, DELETE | `requireAdmin()` |

---

## 3. Décisions d'architecture à ne pas défaire

Chacune corrige un problème réel. Les annuler les fait revenir.

1. **Les réservations sont créées uniquement par `POST /api/reservations`** (Admin SDK), qui
   **recalcule le prix depuis le catalogue serveur**. Les règles Firestore posent
   `allow create: if false` sur `reservations`. C'est volontaire : si le navigateur pouvait
   créer le document, il choisirait le montant écrit sur le reçu.

2. **Le navigateur n'envoie jamais de prix.** Il envoie un `serviceId` et un `lieu`. Le
   montant affiché dans le tunnel est informatif.

3. **Aucune donnée bancaire nulle part.** Le garde-fou est posé **trois fois, de façon
   indépendante** : `noPaymentData()` dans `firestore.rules`, `contientDonneeBancaire()` dans
   les routes API, et `preparer()` dans `src/lib/addresses.ts`. L'« adresse de facturation »
   est une adresse **postale**.

4. **Le créneau est revalidé côté serveur** par `creneauValide()` : jour d'ouverture, horaire
   sur le pas de 30 min, fin avant fermeture, délai minimum de 4 h, horizon de 60 jours.
   Masquer un bouton dans le calendrier n'empêche personne d'envoyer la requête à la main.

5. **Le catalogue est lu côté serveur** (`src/lib/catalogue.ts`) via `unstable_cache`, TTL
   60 s, tag `catalogue`. **Repli automatique sur `src/data/services.ts`** si Firestore est
   absent ou en panne : le site ne tombe jamais en panne de contenu. Toute écriture admin
   appelle `invaliderCatalogue()`.

6. **Le client ne refait pas de requête** : le serveur injecte le catalogue via
   `src/lib/catalogue-context.tsx`. Une lecture Firestore par rendu, pas par visiteur.

7. **Le rôle admin est un custom claim**, posé par `scripts/set-admin.mjs`. Vérifié à trois
   niveaux indépendants : garde d'interface, `requireAdmin()` dans chaque route, règles
   Firestore. Forcer `isAdmin` dans la console ne donne accès à aucune donnée.

8. **On peut réserver sans compte.** Exiger une inscription avant un premier rendez-vous fait
   perdre des clientes. La page de confirmation est donc une « URL-capacité » : l'identifiant
   Firestore (20 caractères aléatoires) fait office de secret, et la page est `noindex`.

9. **Le fournisseur de thème admin se monte dans `admin/layout.tsx`, jamais dans
   `CadreAdmin`.** `CadreAdmin` renvoie un écran de chargement tant que les droits ne sont pas
   vérifiés ; s'il portait le fournisseur, chaque rotation de jeton effacerait le thème.

10. **`chargementDroits` ne repasse à `true` qu'à la première vérification**
    (`src/lib/auth-context.tsx`). Le remettre à chaque changement d'identité de `user` viderait
    l'écran à chaque appel de `getIdToken()`.

11. **La bascule de thème passe par l'API View Transitions**, pas par une transition CSS sur
    `*`. Mesuré sur l'autre projet : 341–449 ms de recalcul bloquant contre ~43 ms.

12. **`distDir` est configurable.** Tout build de vérification passe par
    `NEXT_DIST_DIR=.next-verif npx next build`, sinon il écrase le `.next` du serveur de dev
    et le site se met à répondre sans feuille de style.

---

## 4. Le mouvement — EN CSS, JAMAIS EN JAVASCRIPT

**Regle absolue, nee d'un incident. Ne pas la defaire.**

Aucun contenu ne doit attendre JavaScript pour etre visible. La premiere
version utilisait Framer Motion (`whileInView`) partout : 59 elements de la
page d'accueil arrivaient a `opacity: 0`, **en-tete compris**. Le site
paraissait casse — navigation morte, pages blanches, lenteur.

Tout le mouvement de la vitrine passe desormais par le CSS :

| Role | Mecanisme |
|---|---|
| Revelation au defilement | `animation-timeline: view()`, dans `globals.css` |
| Parallaxe des bandeaux | `.parallaxe-fond`, meme mecanisme |
| Progression de lecture | `animation-timeline: scroll()` |
| Survols, pressions | transitions CSS, 140 ms |
| Arrivee du bandeau de titre | `.arrivee` — **anime la position seulement** |

### La regle, dans sa forme definitive

> **Une propriete qui MASQUE — `opacity: 0`, `clip-path` decoupant, `visibility:
> hidden`, `scale(0)`, une translation hors ecran — n'a pas sa place dans
> l'image de DEPART d'une animation qui revele du contenu. Quel que soit le
> langage.**
>
> Si l'animation ne se joue jamais, ce qu'on doit voir est le contenu.

Elle a ete apprise trois fois, ce qui suffit :

1. **Framer, au premier rendu.** `whileInView` ecrivait `opacity: 0` dans le
   HTML du serveur — 59 elements de la page d'accueil, en-tete compris.
2. **Framer, apres un clic.** Framer avance depuis `requestAnimationFrame`.
   Quand rAF ne tourne pas (onglet en arriere-plan, economie d'energie, erreur
   levee ailleurs dans l'arbre anime), l'element reste sur son etat initial.
   Mesure : menu mobile ouvert, `clip-path: inset(0 0 100%)` et liens a
   `opacity: 0`, trois secondes apres le clic. **21 composants** faisaient
   dependre leur visibilite de cette boucle, dont le tunnel de reservation
   entier.
3. **En CSS, en croyant corriger.** La premiere reecriture du menu utilisait un
   rideau `clip-path: inset(0 0 100%) -> 0` : le meme defaut, dans un autre
   langage. La regle ne portait jamais sur Framer — elle porte sur les
   proprietes.

Deux garde-fous concrets :

- `.arrivee`, `.surgir`, `.volet-liens`, `.glisser`, `.erreur-champ` n'animent
  **que `transform`**. Animation non jouee = contenu lisible, decale de
  quelques pixels.
- Une propriete masquante n'apparait que dans un bloc `@supports` garantissant
  que l'animation se jouera (`.reveler`), ou sur un element **decoratif** qui
  ne porte aucun contenu (`.voile-modal::before`), ou dans une animation de
  SORTIE suivie d'un demontage (`.volet[data-sortie]`).

Un controle automatise parcourt les 25 `@keyframes` du projet et signale toute
image de depart masquante non assumee.

### Ou Framer subsiste encore

| Fichier | Raison |
|---|---|
| `CatalogueSoins.tsx` | N'anime que la DISPOSITION (`layout`, `layoutId`). Rien n'y est masque : sans animation, les cartes sont deja a leur place et la pastille sur le bon onglet. Pas d'equivalent CSS propre pour une pastille de largeur variable. |
| `lib/motion.ts` | Un `import type { Transition }`, rien de plus. |

Partout ailleurs — vitrine, espace client, authentification, **et le
back-office** — `framer-motion` a ete retire. Y compris `Header.tsx`, donc le
chemin critique de **chaque** page.

`framer-motion` n'est plus dans le bundle partage : il ne pese que sur la seule
route `/soins`.

**Le cas des graphiques du back-office.** Ils sont peints tels quels, sans
animation d'entree, et leurs valeurs sont posees en style inline puis
*transitionnees*. Raison : sur une vitrine, une animation qui ne se joue pas
coute un effet ; sur un tableau de bord, elle coute la donnee — et une donnee
absente se lit comme un zero, c'est-a-dire une information fausse. Ne pas leur
remettre d'animation d'entree.

**`motion.ts` a ete reduit a ce qui est consomme.** Il exportait dix-neuf
helpers pour deux utilises, dont des variantes toutes pretes en `opacity: 0` —
le piege bien en evidence dans le fichier cense etre la reference du mouvement.

**Retires et a ne pas reintroduire :** Lenis (defilement lisse), le curseur
personnalise, la parallaxe en `useScroll`, `useScroll`/`useMotionValueEvent`
dans l'en-tete (remplaces par un ecouteur passif), `whileHover` sur les
composants repetes.

### Auditer un etat interactif

Le volet de previsualisation ne fait avancer **ni** les animations CSS **ni**
les transitions. Pour mesurer un menu ouvert, un accordeon deplie ou une etape
de tunnel, neutraliser d'abord le mouvement :

```js
*,*::before,*::after { transition:none !important; animation:none !important; }
```

puis mesurer l'**etat d'arrivee**. Sans cette precaution on mesure une image
figee et on conclut a un defaut qui n'existe pas.

## 4 bis. Les quatre roles du mouvement

Les durées sont dans `src/lib/motion.ts`, **source unique**. Avant d'ajouter une animation, il
faut pouvoir dire lequel de ces quatre rôles elle sert. Si aucun ne correspond, elle ne doit
pas exister.

| Rôle | Durée | Où |
|---|---|---|
| **Arrivée** | 620 ms | Une seule par page, sur le bandeau de titre. Écrite en **CSS pur** (`.arrivee`) — le titre ne doit pas attendre que JavaScript démarre. |
| **Réponse** | 140 ms | Survol, clic, focus. Au-delà de ~150 ms, l'interface paraît molle. |
| **Continuité** | 260 ms | Ce qui explique un changement d'état : panneaux, `layoutId`, onglets qui glissent. |
| **Révélation** | 520 ms | Apparition au défilement. `once: true` **toujours**, et `transform` + `opacity` **uniquement**. |

Deux exceptions assumées à la règle « transform et opacity seulement » : l'accordéon FAQ et les
messages d'erreur de formulaire animent une **hauteur**. C'est voulu — il faut que le décalage
du contenu situé en dessous soit perçu comme un mouvement, pas comme un saut.

`prefers-reduced-motion` est géré globalement dans `globals.css` : toutes les durées tombent à
0,01 ms, et Lenis **ne démarre pas du tout**.

---

## 5. Design

Palette : moka (`#6f5f52`) en encadrement, crème (`#f6f1ea`) pour les sections, blanc pour les
cartes, champagne (`#a8834e`) en accent, espresso (`#33291f`) pour le texte.

Typographies : **Cormorant Garamond** (titres), **Parisienne** (nom de la marque uniquement,
jamais un paragraphe), **Jost** (interface et texte courant).

Le site est **clair par principe**. Le mode sombre existe uniquement dans `/admin`.

Aucune couleur n'est écrite en dur dans un composant : tout passe par les variables `--color-*`
de `globals.css`. C'est ce qui permet au thème sombre du back-office de fonctionner sans une
seule classe conditionnelle.

---

## 6. Honnêteté du contenu — décisions volontaires

Trois choses que le site **n'affiche pas**, et qui doivent le rester tant que les vraies
données n'existent pas :

1. **Aucun avis client.** `src/data/galerie.ts` exporte une liste `avis` **vide**, et le
   composant `Temoignages` sait l'afficher : il propose de laisser le premier avis au lieu
   d'un carrousel truqué. Inventer des témoignages est un mensonge commercial.

2. **Aucun `aggregateRating` dans les données structurées.** Publier une note moyenne
   fabriquée revient à mentir directement à Google, qui l'affiche en étoiles dans ses
   résultats. Le champ ne sera ajouté que quand de vrais avis existeront, et devra être
   **calculé** depuis la collection `reviews`.

3. **Aucun bandeau de chiffres** (« 500 clientes », « 8 ans d'expérience »). Les valeurs de
   `chiffres` dans `src/data/site.ts` sont à zéro. La section est prête, il manque les vrais
   nombres.

Les avis clients arrivent par la collection Firestore `reviews`, et ne s'affichent **qu'une
fois modérés** (`published: true`, drapeau que seul l'admin peut poser).

---

## 7. Ce qui manque avant une vraie mise en ligne

Classé par ce que ça coûte si on l'oublie.

### 🔴 Bloquant — de l'argent perdu dès la première vraie réservation

- **Aucun e-mail n'est envoyé.** Ni à la cliente, ni à l'institut. Une réservation n'existe que
  dans `/admin/reservations` : il faut penser à y aller. Aucune dépendance d'envoi n'est
  installée. C'est **la fuite la plus coûteuse du site en l'état**.
  → `src/app/api/reservations/route.ts` et `src/app/api/contact/route.ts` portent un `TODO`.

- **Les créneaux déjà pris ne sont pas exclus.** `Calendrier` accepte un `occupes` mais
  personne ne le remplit : deux clientes peuvent demander le même horaire. Le statut « en
  attente » limite les dégâts (un humain confirme), mais c'est à brancher.

- **Firebase n'est pas configuré.** `.env.local` est absent. Sans lui : pas de compte, pas de
  réservation en ligne, pas de back-office. Le site vitrine, lui, fonctionne.

### 🟠 Important

- **Les règles Firestore ne sont pas déployées** (`node scripts/deploy-rules.mjs`).
- **Aucun administrateur n'existe** (`node scripts/set-admin.mjs <email>`).
- **App Check n'est pas activé.** La limitation de débit actuelle vit en mémoire du processus :
  sur Vercel, chaque instance a la sienne et elle est vidée à chaque redémarrage. C'est un
  ralentisseur, pas une serrure.
- **Aucune mesure d'audience.** On ne saura pas ce qui marche.

### 🟡 À faire quand le reste tourne

- Paiement en ligne (aucun prestataire branché — assumé, le paiement est sur place).
- Rappel automatique la veille du rendez-vous.
- Notes internes par cliente dans le back-office.
- Gestion des congés / fermetures exceptionnelles.
- Darija en latin pour les réseaux sociaux (le site reste en français).

---

## 8. Poste Windows de Hamza — à retenir

L'exécution de scripts PowerShell est **désactivée** (`ExecutionPolicy` à `Restricted`). Donc
`npm run <script>` échoue avec `PSSecurityException` : PowerShell résout `npm` vers `npm.ps1`.

**Toujours utiliser `npm.cmd run <script>`**, ou les lanceurs à la racine :

- `dev.cmd` — serveur de développement
- `build.cmd` — build de **vérification** (écrit dans `.next-verif`)
- `start.cmd` — serveur de production

Ne pas changer la policy à sa place : c'est un réglage de sécurité. S'il la veut :
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**Piège neutralisé mais à connaître :** lancer `next build` pendant que le serveur de dev
tourne écrase son `.next` par un build de production — le serveur répond alors sans feuille de
style, ou en 500. D'où `NEXT_DIST_DIR`.

---

## 9. Arborescence

```
site 2/
├── firestore.rules          ← LE fichier de sécurité. À lire avant de toucher aux données.
├── storage.rules            ← écrit d'avance ; Storage exige le plan Blaze, non activé
├── firestore.indexes.json
├── scripts/
│   ├── env.mjs              ← lecture de .env.local, partagée
│   ├── seed.mjs             ← remplit Firestore depuis src/data/
│   ├── set-admin.mjs        ← pose le custom claim admin
│   ├── deploy-rules.mjs     ← contourne le 403 de `firebase deploy`
│   └── visuels.mjs          ← régénère les illustrations de remplacement
├── public/                  ← 32 SVG provisoires (soins, journal, galerie, bandeaux)
└── src/
    ├── app/                 ← routes (App Router)
    ├── components/
    │   ├── admin/           ← back-office
    │   ├── auth/            ← connexion, inscription, réinitialisation
    │   ├── compte/          ← espace client
    │   ├── contact/
    │   ├── galerie/
    │   ├── home/            ← les 10 sections de l'accueil
    │   ├── layout/          ← Header, Footer, Chrome, EnTetePage
    │   ├── motion/          ← SmoothScroll, Reveal, Effets, Cursor
    │   ├── reservation/     ← le tunnel
    │   ├── soins/
    │   └── ui/              ← Button, Field, Icon, Logo, Accordion, Lightbox…
    ├── data/                ← catalogue de repli, FAQ, journal, identité
    └── lib/                 ← motion, validation, firebase, catalogue, créneaux…
```

---

## 10. Comment reprendre

```bash
cd "C:\Users\hamza\Desktop\projects\site 2"
```

1. Copier `.env.local.example` en `.env.local` et remplir les clés Firebase.
2. `dev.cmd` (ou `npm.cmd run dev`).
3. `node scripts/deploy-rules.mjs` — déployer les règles.
4. S'inscrire sur le site, puis `node scripts/set-admin.mjs <votre-email>`.
5. Se déconnecter / reconnecter, puis ouvrir `/admin`.
6. Facultatif : `node scripts/seed.mjs` pour rendre le catalogue modifiable depuis `/admin`.

---

## 11. Les `[placeholder]` — à remplacer avant la mise en ligne

**Rien de ce qui suit n'a été inventé.** Chaque valeur manquante est marquée dans le code, pas
comblée par une invention plausible. C'est délibéré : un « depuis 2015 » faux se vérifie en
trente secondes et coûte plus cher qu'un blanc assumé.

### 🔴 `NEXT_PUBLIC_SITE_URL` — le plus facile à oublier, le plus coûteux

Sans cette variable, `site.url` retombe sur `http://localhost:3000`. Conséquence en
production : **toutes** les URL canoniques, le `sitemap.xml`, le `robots.txt` et les données
`openGraph` pointent vers localhost. Google indexerait alors un site qui n'existe pas.

À définir chez l'hébergeur **avant le premier déploiement**, à l'URL de production exacte
(avec `https://`, sans barre oblique finale).

### Coordonnées — `src/data/site.ts`

| Champ | Valeur actuelle |
|---|---|
| `contact.street` | `[adresse à compléter]` |
| `contact.postalCode` | `[code postal]` |
| `contact.phone` | `+212 6 00 00 00 00` — **faux numéro** |
| `contact.whatsapp` | `212600000000` — **faux numéro** |
| `contact.email` | `contact@maison-eve.ma` — à confirmer |
| `contact.hours` | horaires proposés, à confirmer |
| `contact.homeServiceArea` | quartiers proposés, à confirmer |
| `social.instagram` / `facebook` / `tiktok` | `[url …]` |
| `site.foundedYear` | `2024` — à confirmer |
| `chiffres` | tous à **0** — voir §6 |

### Tarifs et durées — `src/data/services.ts`

⚠️ **Les 10 tarifs et les 10 durées sont des PROPOSITIONS.** Aucun n'a été validé. Ils servent
à ce que la mise en page soit juste et testable. **À confirmer un par un avant la mise en
ligne** — ce sont des engagements commerciaux.

### Histoire de la maison — `src/data/galerie.ts`

Les trois étapes (`histoire`) sont vides : `[année]`, `[à compléter par Hamza]`. Elles
s'affichent telles quelles sur `/a-propos`, avec un encart qui l'explique honnêtement.

### Visuels — `public/` — ✅ FAIT le 26/08/2026

Les 32 placeholders SVG ont été remplacés par **34 photographies** générées par Hamza.
Le générateur `scripts/visuels.mjs` a été retiré (il aurait réécrit des SVG par-dessus)
et les anciens fichiers archivés dans `projects/_svg_placeholders_maison_eve/`.

Ce sont des visuels **générés**, pas des photos de l'institut : l'encart de `/galerie` reste
donc valable jusqu'à une vraie séance photo.

⚠️ **PIÈGE : FIRESTORE FAIT AUTORITÉ SUR LES CHEMINS D'IMAGE.**
Corriger un chemin dans `src/data/services.ts` ne corrige **rien** en ligne : `catalogue.ts`
ne se rabat sur le code que si la base est vide. Le jour du remplacement, les 44 références
du code étaient passées en `.jpg` mais Firestore servait toujours les `.svg` supprimés — le
HTML de production **préchargeait trois fichiers absents**. Une migration ciblée a réécrit
les 14 champs `image` concernés (sans toucher aux tarifs).

`npm run audit:catalogue` compare désormais la base au disque et refuse de passer si un
chemin ne correspond à aucun fichier.

### Icônes d'application — ✅ FAIT le 26/08/2026

Le lotus de `Logo.tsx` a été rastérisé avec `sharp` :
`src/app/icon.svg` (favicon), `src/app/apple-icon.png` (180×180),
et `public/icones/icone-{192,512}.png` plus une version *maskable* déclarées dans le
manifeste. La version maskable porte une marge : Android rogne l'icône dans un cercle de
80 %, et sans marge il mangeait les pétales.

### Images de partage — ✅ FAIT le 26/08/2026

Le site n'avait **aucune** `og:image` : un lien partagé sur WhatsApp — le canal principal de
la clientèle — n'affichait qu'un rectangle vide. Il y a désormais `public/og.jpg` pour la
marque et `public/og/<slug>.jpg` pour chacun des 10 soins, en 1200×630, avec le nom du soin
écrit dessus. Le voile combine un dégradé vertical **et** horizontal pour que le contraste
ne dépende pas de la photo : mesuré entre 5,00 et 10,55 sur les onze images.

Régénérer après un changement de photo : `python scratchpad/og.py`.

### Pages légales

- `/mentions-legales` — forme juridique, capital, registre du commerce, identifiant fiscal,
  ICE, directeur de la publication, hébergeur. **Toutes obligatoires, toutes manquantes.**
- `/cgv` et `/confidentialite` — rédigées pour être claires et honnêtes, **non relues par un
  juriste**. Un encart le signale sur la page elle-même.

---

## 12. Journal des sessions

### 20 août 2026 — création complète

Site créé de zéro d'après une maquette de spa fournie par Hamza (palette moka / crème,
typographie script + serif). Adapté à MAISON EVE : institut + soins à domicile, Casablanca,
français, dirham.

Livré : 23 pages, 6 routes API, back-office complet, tunnel de réservation en 5 étapes avec
adresse de facturation, règles Firestore écrites avant le code, système de mouvement à quatre
rôles, 32 visuels de remplacement.

Typecheck propre. Firebase **non configuré** — le site tourne en mode vitrine.

### 20 aout 2026 — refonte du mouvement, apres retour d'usage

Hamza a ouvert le site en local : « le responsive est vraiment merdique et
lent ; les boutons ne menent vers aucune page ». Il avait raison, et les trois
reproches avaient **une seule cause** : 59 elements livres a `opacity: 0`, en
attente de Framer Motion — dont l'en-tete entier.

Corrige en profondeur : tout le mouvement de la vitrine est passe en CSS
(`animation-timeline`), Lenis et le curseur personnalise ont ete retires, et
18 composants sont repasses serveur. Aussi corrige : `h-13`, une classe
Tailwind inexistante qui laissait les boutons principaux a 26 px de haut ; le
debordement mobile du tunnel ; 160 px de vide entre les sections sur telephone ;
du texte a 8 px.

`/a-propos` et `/journal` sont passes de 168 et 160 kB a **111 kB** de
JavaScript. Navigation verifiee sur les six pages principales : 0 texte cache.

Les 32 illustrations ont ete refaites : ce ne sont plus des degrades abstraits
mais des scenes composees (bougies, serviettes, theiere, lanterne, zellige),
avec profondeur de champ, grain et vignettage. Elles restent des
**illustrations** — a remplacer par de vraies photos avant mise en ligne.

Detail complet dans `AUDIT.md` section 8.

### 20 août 2026 — audit complet, page par page

Audit des 17 pages publiques sur serveur réel. **Neuf défauts trouvés, tous corrigés.** Les
trois qui comptaient :

1. **Sans JavaScript, le site était presque vide.** Framer Motion écrit `opacity:0` dans le
   HTML du serveur — 57 éléments invisibles sur l'accueil, dont l'en-tête. Corrigé par un
   bloc `<noscript>` dans `layout.tsx`. Ne pas le retirer.
2. **`/reservation` débordait à 690 px sur un écran de 375.** Cause : `min-width: auto` sur
   les enfants de grille. Corrigé par `min-w-0`.
3. **Sept paires de couleurs sous le seuil WCAG AA**, dont le champagne à 2,51 sur
   `champagnepale`. Les jetons ont été recalculés : tout passe AA dans les deux thèmes.

Aussi corrigé : `<h1>` absent sur l'accueil et sur `/reservation`, deux sauts de niveau de
titre, quatre descriptions trop longues, une fuite du nom d'une variable d'environnement dans
une réponse d'API, un `id` SVG en dur, et un bug d'API du composant `Button` (le `className`
de l'appelant n'atteignait pas l'élément de mise en page).

Détail complet dans `AUDIT.md`.
