# Sécurité — MAISON EVE

Ce que le site protège, comment, et ce qui reste à faire avant de l'ouvrir au public.

---

## 1. Ce qu'il y a à protéger

Le site ne manipule **aucun moyen de paiement**. Ce qu'il détient malgré tout mérite attention :

| Donnée | Pourquoi ça compte |
|---|---|
| Nom, e-mail, téléphone | Identifiants directs d'une personne. |
| **Adresse du domicile** | Une praticienne s'y déplace. C'est la donnée la plus sensible du site : elle dit où quelqu'un habite, et à quelle heure il ou elle sera seul·e chez soi. |
| Remarques de santé | Grossesse, opération récente, allergie. Non médicales au sens légal, mais intimes. |
| Historique des rendez-vous | Révèle des habitudes et une fréquentation. |

**Le fait d'être cliente d'un spa n'est pas une information anodine.** C'est la raison d'être de
plusieurs choix ci-dessous, notamment la réponse indifférenciée du mot de passe oublié.

---

## 2. Les quatre barrières

Elles sont **indépendantes**. Franchir l'une ne donne rien.

### Barrière 1 — Règles Firestore (`firestore.rules`)

C'est la seule qui compte vraiment, parce qu'elle s'applique quoi qu'il arrive côté navigateur.

- **Tout est refusé par défaut.** La règle finale `match /{document=**} { allow read, write: if false; }` fait qu'une collection ajoutée sans être ouverte reste inaccessible.
- Chaque écriture valide **la forme** des données, pas seulement le droit d'écrire : liste blanche de clés, types, longueurs bornées, horodatage serveur imposé.
- Un client ne lit et n'écrit que **ses propres** documents.
- `allow create: if false` sur `reservations` — voir §3.

### Barrière 2 — Routes API (`src/lib/firebase/admin.ts`)

`requireAdmin()` revérifie le **custom claim** dans le jeton signé par Firebase, avec
`checkRevoked: true` (une session révoquée est refusée immédiatement, sans attendre l'heure
d'expiration).

### Barrière 3 — Validation serveur (`src/lib/validation.ts`)

Le même fichier sert au navigateur et au serveur. Côté navigateur c'est du confort ; côté
serveur c'est la sécurité. Une validation qui n'existe que dans le formulaire se contourne avec
un `curl`.

### Barrière 4 — Gardes d'interface

`CadreCompte` et `CadreAdmin` évitent d'afficher une page vide à qui n'a pas les droits.
**Ce ne sont PAS des protections** : elles se contournent en dix secondes avec les outils de
développement. Elles ne sont là que pour l'expérience.

---

## 3. Le prix est décidé par le serveur

**Décision structurante, à ne pas défaire.**

Les règles Firestore posent `allow create: if false` sur `reservations`. Personne ne peut créer
une réservation depuis le navigateur. Le seul chemin est `POST /api/reservations`, qui tourne
avec l'Admin SDK et :

1. relit le tarif dans le catalogue serveur (`tarifDuSoin`) ;
2. revalide le créneau (`creneauValide`) — jour d'ouverture, pas de 30 min, fin avant
   fermeture, délai minimum de 4 h, horizon de 60 jours ;
3. vérifie que le soin est bien proposé à l'endroit demandé ;
4. refuse toute requête contenant un champ bancaire.

Le navigateur envoie un `serviceId` et un `lieu`. **Jamais un montant.**

Si quelqu'un « répare » la règle Firestore pour autoriser la création côté client, il devient
possible de réserver à 0 dirham. C'est pour ça que la règle porte un commentaire explicite.

---

## 4. Aucune donnée bancaire — garde-fou triple

L'expression « adresse de facturation » fait spontanément penser à une carte. Elle désigne ici
une adresse **postale**, celle qui figure sur le reçu.

Le refus est posé **trois fois, indépendamment** :

| Où | Fonction |
|---|---|
| `firestore.rules` | `noPaymentData()` — appelée sur toute écriture client |
| Routes API | `contientDonneeBancaire()` — rejette la requête entière en 400 |
| `src/lib/addresses.ts` | `preparer()` — lève avant même l'appel réseau |

Les trois listes de champs interdits (`cardNumber`, `cvv`, `iban`, `rib`, `paymentToken`…)
**doivent rester synchronisées**. Ajouter une clé à l'une, c'est l'ajouter aux trois.

---

## 5. Décisions notables

### Réponse indifférenciée sur « mot de passe oublié »

`FormulaireReinitialisation` affiche le **même message de succès** que le compte existe ou non,
y compris quand Firebase renvoie `auth/user-not-found`.

Sans cela, la page devient un oracle : on y teste des adresses une par une pour savoir
lesquelles sont inscrites. Sur un site de soins, c'est une information personnelle.

### Redirection ouverte — bloquée

`/connexion?suite=…` n'accepte qu'un chemin interne (`destinationSure()`) : commençant par `/`
et **pas** par `//`. Sans ce filtre, `?suite=//site-malveillant.tld` produirait un lien qui a
l'air d'aller sur MAISON EVE et qui envoie ailleurs juste après la saisie du mot de passe.

### Page de confirmation — modèle « URL-capacité »

On peut réserver **sans compte**. Une visiteuse non connectée ne peut donc pas lire son propre
document via les règles Firestore. La page `/reservation/[id]` est lue côté serveur avec
l'Admin SDK.

Ce qui la protège, c'est **l'identifiant** : 20 caractères aléatoires générés par Firestore,
soit un espace de l'ordre de 10³⁵. La page est marquée `noindex, nofollow` et `/reservation/`
est interdit dans `robots.txt`.

Conséquences assumées :
- quiconque a le lien voit le rendez-vous — c'est le principe, le lien va à la cliente ;
- la page n'affiche **que** ce que la cliente a elle-même saisi. Aucune note interne.

### Erreurs jamais exposées brutes

`messageErreur()` traduit les codes Firebase en français. Une erreur inconnue reçoit un message
générique : `error.message` peut contenir un chemin de fichier, un nom de collection ou une
requête. Sur la page `error.tsx`, seul `error.digest` (identifiant court produit par Next)
est affiché — il permet de relier ce que voit la cliente au journal du serveur sans rien
révéler d'interne.

### Rôle admin dans le jeton, pas dans un document

Custom claim posé par `scripts/set-admin.mjs`. Un champ `isAdmin` dans Firestore serait
modifiable par celui qu'il désigne ; un claim est signé par Firebase.

### En-têtes HTTP (`next.config.ts`)

CSP restrictive limitée aux origines Firebase, `frame-ancestors 'none'`, `X-Frame-Options:
DENY`, HSTS avec `preload`, `Permissions-Policy` qui coupe caméra, micro, géolocalisation et
paiement.

> `script-src` autorise `'unsafe-inline'` et `'unsafe-eval'` : Next l'exige pour l'hydratation.
> C'est un affaiblissement réel et connu. Le résoudre demande une CSP à nonces, chantier à part.

---

## 6. Limites connues

À lire avant de croire le site protégé.

### 🔴 La limitation de débit ne tient pas en production

`/api/reservations` et `/api/contact` comptent les requêtes **dans la mémoire du processus**.

Sur Vercel, chaque instance a son propre compteur, et il est vidé à chaque redémarrage.
**C'est un ralentisseur, pas une serrure.** La vraie protection est **App Check**, qui n'est
pas activé.

### 🔴 Aucun e-mail n'est envoyé

Ni confirmation à la cliente, ni notification à l'institut. Ce n'est pas une faille, mais c'est
le défaut le plus coûteux du site : une réservation n'existe que dans le back-office.

### 🟠 App Check n'est pas activé

Sans lui, n'importe qui peut appeler l'API Firebase avec la clé publique du projet — depuis
n'importe quel site. Les règles Firestore limitent les dégâts, mais rien n'empêche d'essayer
en boucle.

### 🟠 La clé API n'est pas restreinte

À faire dans Google Cloud Console : restriction par **référent HTTP** sur le domaine de
production.

### 🟠 Les créneaux déjà pris ne sont pas exclus

`Calendrier` accepte un paramètre `occupes` que personne ne remplit. Deux clientes peuvent
demander le même horaire. Le statut « en attente » limite les dégâts — un humain confirme —
mais c'est à brancher.

### 🟡 Storage non activé

`storage.rules` est écrit d'avance mais non déployé : Cloud Storage exige le plan Blaze. Les
visuels vivent dans `public/`. **Si Storage est activé un jour, déployer les règles AVANT de
téléverser quoi que ce soit.**

### 🟡 Pas de journal d'audit

Les changements de statut enregistrent `statusModifiePar` et `statusModifieLe`, mais il n'y a
pas de journal consultable. Sur un désaccord ancien, on ne pourra pas remonter loin.

---

## 7. Checklist avant ouverture au public

### Firebase
- [ ] `.env.local` rempli, et variables reportées chez l'hébergeur
- [ ] **`NEXT_PUBLIC_SITE_URL` défini à l'URL de production.** Sans lui, canoniques,
      sitemap et robots.txt pointent tous vers `localhost:3000`
- [ ] Règles déployées — `node scripts/deploy-rules.mjs`
- [ ] Au moins un administrateur — `node scripts/set-admin.mjs <email>`
- [ ] **App Check activé** (reCAPTCHA v3) et `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` renseignée
- [ ] Clé API restreinte par référent HTTP dans Google Cloud Console
- [ ] Domaines autorisés pour Auth limités au domaine de production
- [ ] Sauvegarde Firestore programmée

### Fonctionnel
- [ ] **E-mails branchés** — confirmation cliente + notification institut
- [ ] Créneaux occupés réellement exclus du calendrier
- [ ] Vrai numéro de téléphone et vraie adresse (§11 de `PROGRESS.md`)
- [ ] Tarifs **validés** — ceux du code sont des propositions
- [ ] Liens de réseaux sociaux réels

### Juridique
- [ ] Mentions légales complètes : forme juridique, RC, IF, ICE, directeur de publication, hébergeur
- [ ] CGV et politique de confidentialité **relues par un juriste**
- [ ] Durées de conservation vérifiées avec le comptable

### Vérifications
- [ ] `npx tsc --noEmit` propre
- [ ] `build.cmd` passe
- [ ] Tenter d'ouvrir `/admin` avec un compte non-admin → refus
- [ ] Tenter de lire le rendez-vous d'une autre personne → refus
- [ ] Envoyer un `POST /api/reservations` avec un `total` forcé → le serveur l'ignore
- [ ] Envoyer un champ `cardNumber` dans une adresse → rejet en 400

---

## 8. Signaler un problème

Écrire à l'adresse de contact du site. Ne pas ouvrir d'issue publique décrivant une faille
exploitable avant qu'elle soit corrigée.
