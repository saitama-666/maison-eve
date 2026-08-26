# Audit du site — MAISON EVE

> **Une deuxieme passe a eu lieu le 20 aout 2026, apres un retour d'usage de
> Hamza** : « le responsive est vraiment merdique et lent ; les boutons ne
> menent vers aucune page ». Elle a trouve **la cause commune a ces trois
> reproches**, que le premier audit avait manquee. Voir la section 8 en fin
> de document — c'est elle qu'il faut lire en premier.

Réalisé le **20 août 2026**, sur le site complet, page par page.

Méthode : serveur de développement réel, inspection du DOM et du HTML rendu par le serveur,
calcul des contrastes sur les jetons de couleur, mesure du débordement à trois largeurs
d'écran, et appels directs aux routes API pour éprouver les protections.

**Tous les défauts listés en §2 ont été corrigés dans la foulée.** Le §3 liste ce qui reste
ouvert et pourquoi.

---

## 1. Ce qui a été vérifié

| Dimension | Méthode |
|---|---|
| Structure des titres | `h1` unique, aucun saut de niveau, sur les 17 pages |
| Métadonnées | titre, description, canonique, `robots` |
| Accessibilité | étiquettes de champs, `alt`, noms accessibles, `id` uniques, `lang` |
| Contraste | ratio WCAG calculé sur 18 paires de jetons, dans les deux thèmes |
| Responsive | débordement horizontal à 375, 768 et 1280 px |
| Sans JavaScript | contenu réellement visible dans le HTML du serveur |
| Sécurité | en-têtes HTTP, routes API, pot de miel, garde bancaire, limitation de débit |
| Référencement | `robots.txt`, `sitemap.xml`, données structurées |
| Visuels | les 32 fichiers référencés existent |
| Build | `tsc --noEmit`, `next lint`, `next build` |

---

## 2. Défauts trouvés et corrigés

### 🔴 Sans JavaScript, le site était presque vide — en-tête compris

**Constat.** Framer Motion écrit son état de départ dans le HTML rendu par le serveur :
`style="opacity:0"`, `translateY(26px)`, `clip-path:inset(100% 0 0 0)`. Mesuré : **57
éléments invisibles sur la page d'accueil**, 36 sur `/a-propos`, 25 sur `/soins`. Le premier
de la liste était `<header style="opacity:0;transform:translateY(-80px)">` — donc **aucune
navigation**.

**Pourquoi ça compte.** Ce n'est pas qu'une question de JavaScript désactivé : un bundle qui
échoue à charger sur une connexion instable produit le même résultat. Le visiteur voit une
page blanche.

**Correction.** Un bloc `<noscript>` dans `src/app/layout.tsx` rétablit l'état final :

```css
[style*="opacity:0"]      { opacity: 1 !important; transform: none !important; }
[style*="clip-path:inset"] { clip-path: none !important; }
```

L'arrivée du titre n'avait pas besoin d'être couverte : elle est écrite en CSS pur, et une
animation CSS se joue sans JavaScript.

---

### 🔴 Débordement horizontal sur `/reservation` en mobile

**Constat.** À 375 px, la page mesurait **690 px de large** — presque le double. Toute la
page, en-tête compris, défilait latéralement.

**Cause.** Un élément de grille a `min-width: auto` par défaut : il refuse de rétrécir sous
la largeur `min-content` de son contenu. La carte de récapitulatif et la liste des soins
imposaient 646 px dans un conteneur de 335 px.

**Correction.** `min-w-0` sur les deux enfants de la grille du tunnel. Vérifié après
correction : plus aucun défilement horizontal possible.

---

### 🔴 Le bouton « Réserver » ne se masquait pas en mobile

**Constat.** `<Button className="hidden sm:inline-flex">` restait visible : mesuré à 123 px
de large à 375 px d'écran, collé au bouton menu.

**Cause — deux problèmes empilés.**
1. `Button` enrobait son `<Link>` dans un `motion.div` portant `inline-flex` en dur. Le
   `className` de l'appelant n'atteignait donc jamais l'élément qui participe à la mise en
   page : `shrink-0`, une marge ou une largeur restaient sans effet.
2. La classe de base contient déjà `inline-flex`. Deux utilitaires `display` dans la même
   couche se départagent par l'ordre de la **feuille de style**, pas par l'ordre des classes.
   `hidden` perdait.

**Correction.** L'enveloppe est supprimée — le `<Link>` est animé directement via
`motion.create(Link)`. Et dans l'en-tête, la visibilité responsive est portée par un
`<span>` extérieur. Un avertissement en tête de `Button.tsx` explique pourquoi.

---

### 🟠 Aucun `<h1>` sur la page d'accueil ni sur `/reservation`

**Constat.** La page la plus importante du site n'avait aucun titre de premier niveau : le
logo du bandeau est un `<span>`. Idem pour le tunnel de réservation, qui n'affichait aucun
titre de page.

**Correction.**
- Accueil : le logo du bandeau devient le `<h1>`. Il reste enfant direct de `.arrivee`, sinon
  la cascade `:nth-child` se casse.
- `/reservation` : un `<h1>` « Réserver un soin » **stable** a été ajouté au-dessus de
  l'indicateur d'étapes. Stable et non pas dépendant de l'étape : un `h1` qui change à chaque
  clic donne un plan de document mouvant, illisible à la navigation par titres.

---

### 🟠 Sauts de niveau de titre

| Page | Saut | Correction |
|---|---|---|
| `/soins` | `h1` → `h3` | `CarteSoin` accepte désormais `niveau={2 \| 3}` et suit son contexte |
| `/soins/[slug]` | `h2` → `h4` | `LigneSoin` passe de `h4` à `h3` |

Une carte à niveau figé produit forcément un saut sur l'une des deux pages : sur `/soins` le
`h1` est « Nos soins », donc les cartes sont des `h2` ; sur l'accueil la section porte déjà un
`h2`, donc les cartes sont des `h3`.

---

### 🟠 Sept paires de couleurs sous le seuil WCAG AA

Mesures faites sur les jetons réels, pas à l'œil.

| Paire | Avant | Après | Correction |
|---|---|---|---|
| champagne sur `champagnepale` | **2,51** | 4,67 | `#a8834e` → `#7d5925` |
| champagne sur crème | 3,10 | 5,62 | idem |
| blanc sur aplat champagne | 3,49 | 6,31 | idem |
| `champagnesoft` sur moka | **2,72** | 4,53 | `#c9a877` → `#ffd89d` |
| `faint` sur crème | 2,89 | 4,94 | `#9c8c7c` → `#746658` |
| `warning` sur crème | 3,30 | 4,95 | `#b07a29` → `#8a6020` |
| `success` sur crème | 4,33 | 4,96 | `#4f7c4a` → `#487244` |
| texte secondaire, menu mobile | 3,81 | 5,32 | menu passé de `bg-shell` à `bg-shelldeep` |

**Le point important :** assombrir le champagne améliore ses **deux** usages à la fois — en
texte sur crème *et* comme fond portant du texte blanc. Il n'y avait donc aucun arbitrage à
faire, seulement une valeur mal choisie au départ. La saturation a été remontée en
compensation, pour garder un or chaud plutôt que de virer au brun.

Le thème sombre du back-office passait déjà AA partout, sans modification.

---

### 🟡 Descriptions trop longues (tronquées par Google)

`/` (180), `/reservation` (176), `/mot-de-passe-oublie` et la 404 (180, héritées).
Raccourcies à 121–156 caractères. Corriger `site.description` a réglé trois pages d'un coup.

---

### 🟡 Fuite d'information sur les routes d'administration

**Constat.** Un appelant anonyme recevait `« Serveur non configuré :
FIREBASE_SERVICE_ACCOUNT_KEY manquante »`. Ça révèle gratuitement la pile technique et ce qui
n'est pas configuré.

**Correction.** La réponse est devenue `« Service momentanément indisponible. »` ; le détail
part dans les journaux du serveur, où il est utile sans être public.

---

### 🟡 Identifiant SVG écrit en dur

`<path id="cercle-texte">` dans `Presentation.tsx`. Latent, mais deux instances du composant
sur une même page auraient fait pointer le `href="#…"` vers le mauvais tracé. Remplacé par
`useId()`.

---

## 3. Résultats page par page, après corrections

| Page | `h1` | Titres | Méta | Contraste | Mobile | Sans JS |
|---|---|---|---|---|---|---|
| `/` | Maison Eve — Beauty & Spa | ✅ | ✅ 137 car | ✅ | ✅ | ✅ |
| `/soins` | Nos soins | ✅ | ✅ 156 car | ✅ | ✅ | ✅ |
| `/soins/[slug]` | *nom du soin* | ✅ | ✅ 107 car | ✅ | ✅ | ✅ |
| `/a-propos` | Un lieu à taille humaine | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/galerie` | Nos instants | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/journal` | À lire avant de venir | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/journal/[slug]` | *titre de l'article* | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/contact` | On vous répond | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/faq` | Questions fréquentes | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/reservation` | Réserver un soin | ✅ | ✅ 121 car | ✅ | ✅ | ✅ |
| `/connexion` | Content de vous revoir | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inscription` | Créer un compte | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mot-de-passe-oublie` | Mot de passe oublié | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/cgv` | Conditions générales | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/confidentialite` | Politique de confidentialité | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mentions-legales` | Mentions légales | ✅ | ✅ | ✅ | ✅ | ✅ |
| 404 | Cette page n'existe pas | ✅ | ✅ | ✅ | ✅ | ✅ |

Sur l'ensemble : **aucun** champ de formulaire sans étiquette, **aucune** image sans `alt`,
**aucun** lien sans nom accessible, **aucun** `id` dupliqué, `lang="fr"` partout.

Les pages `/compte/*` et `/admin/*` n'ont pas pu être auditées visuellement : elles exigent
une session Firebase, absente. Leur garde de redirection a été vérifiée par lecture du code
et par les règles Firestore.

---

## 4. Sécurité — ce qui a été éprouvé pour de vrai

| Test | Résultat |
|---|---|
| Numéro de carte envoyé au formulaire de contact | **400** — rejeté |
| Adresse e-mail invalide | **400** — rejeté |
| Message trop court | **400** — rejeté |
| Pot de miel rempli (robot) | **200 « ok »**, rien écrit — le robot n'apprend rien |
| 4ᵉ message en 15 minutes | **429** — la limitation de débit fonctionne |
| Routes `/api/admin/*` sans jeton | refusées, sans fuite de détail |
| Mise en cadre du site par lui-même (iframe) | **bloquée** par `X-Frame-Options: DENY` |
| En-têtes HTTP | CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS — tous présents |
| `robots.txt` | `/admin`, `/api`, `/compte`, `/reservation/` exclus |
| `sitemap.xml` | 24 URL, aucune page privée |

**Non éprouvé faute de Firebase configuré**, à retester ensuite — la checklist est dans
`SECURITY.md` §7 :
- forger un `total` dans `POST /api/reservations` (protégé par `tarifDuSoin` côté serveur) ;
- lire le rendez-vous d'une autre personne (protégé par `firestore.rules`) ;
- accéder à `/admin` avec un compte ordinaire (protégé à trois niveaux).

---

## 5. Deux artefacts de l'environnement de test, pas des défauts

Notés ici pour que le prochain audit ne reparte pas sur une fausse piste.

**Les animations paraissent gelées.** Le panneau du navigateur n'était pas affiché, donc la
page était en `visibilityState: "hidden"` : le navigateur suspend l'horloge d'animation. Une
mesure directe montrait `animationName: "arrivee"`, `playState: "running"`, mais
`currentTime: 0`. Conséquence : 49 éléments semblaient bloqués à `opacity: 0`, et
`AnimatePresence mode="wait"` ne montait jamais le panneau suivant. **Le CSS et la logique
étaient corrects** — vérifié en interrogeant l'indicateur d'étapes, qui est rendu depuis
l'état React sans animation : il affichait bien « Étape 3 » après deux clics.

**Des éléments apparaissaient en double.** Le Fast Refresh, dans un onglet non composité,
laisse des nœuds périmés dans le DOM. Le HTML de production, lui, ne contient la section
qu'une fois. Toujours trancher sur le build de production, jamais sur le DOM du serveur de
développement après une modification à chaud.

---

## 6. Ce qui reste ouvert

Ces points ne sont pas des régressions : ce sont des choses non encore construites. Ils
figurent déjà dans `PROGRESS.md` §7 et `SECURITY.md` §6, rappelés ici pour que l'audit soit
complet.

### 🔴 Bloquant avant toute vraie réservation
- **Aucun e-mail n'est envoyé**, ni à la cliente ni à l'institut. Une réservation n'existe
  que dans le back-office : il faut penser à y aller.
- **Les créneaux déjà pris ne sont pas exclus.** Deux clientes peuvent demander le même
  horaire. Le statut « en attente » limite les dégâts, mais c'est à brancher.
- **`NEXT_PUBLIC_SITE_URL` non défini.** En l'état, toutes les URL canoniques, le sitemap et
  le `robots.txt` pointent vers `localhost:3000`.

### 🟠 Important
- **App Check n'est pas activé.** La limitation de débit actuelle vit dans la mémoire du
  processus : sur Vercel chaque instance a la sienne, et elle est vidée à chaque redémarrage.
  C'est un ralentisseur, pas une serrure.
- **Clé API non restreinte** par référent HTTP dans Google Cloud.
- **Tarifs non validés** — ceux du code sont des propositions.
- **Pages légales non relues par un juriste**, mentions obligatoires manquantes.
- **Visuels provisoires** : les 32 fichiers sont des illustrations générées, pas des photos.
  Un encart le dit au visiteur sur `/galerie`.

### 🟡 Connu et assumé
- `script-src` autorise `'unsafe-inline'` et `'unsafe-eval'` : Next l'exige pour
  l'hydratation. Le résoudre demande une CSP à nonces — chantier à part.
- Pas de journal d'audit consultable. Les changements de statut enregistrent qui et quand,
  mais rien ne permet de remonter loin.

---

## 7. État des vérifications automatiques

```
npx tsc --noEmit      → aucune erreur
npx next lint         → aucun avertissement
next build            → 23 pages, 7 routes API, aucune erreur
```


---

## 8. Deuxieme passe — ce que le premier audit avait manque

Le premier audit mesurait le **debordement horizontal** et appelait cela
« responsive ». C'est une mesure etroite : elle ne dit rien de la fluidite, ni
de ce qui se passe reellement quand on clique. Trois defauts majeurs sont
passes au travers.

### Rouge — la cause commune : 59 elements livres invisibles

**Constat, mesure.** Framer Motion ecrit son etat de depart dans le HTML rendu
par le serveur. Sur la page d'accueil : **59 elements a `opacity: 0`**, dont
`<header style="opacity:0;transform:translateY(-80px)">`.

**Ce que cela donnait a l'usage.** On clique « A propos ». La navigation
fonctionne — mais la page qui arrive est blanche, sans en-tete, le temps que
JavaScript demarre et que la librairie d'animation prenne la main. En
developpement, ou sur une machine ordinaire, c'est assez long pour qu'on
conclue que le site est casse. **Les trois reproches — lenteur, navigation
morte, mise en page ratee — sont les trois symptomes de ce seul defaut.**

**La correction est structurelle, pas cosmetique.** Le mouvement du site ne
passe plus par JavaScript :

| Avant | Apres |
|---|---|
| `whileInView` (Framer) sur chaque section | `animation-timeline: view()` en CSS |
| `useScroll` + ressort, cinq fois sur l'accueil | parallaxe CSS, sur le compositeur |
| Lenis (defilement lisse en JS) | defilement natif |
| Curseur personnalise (deux ressorts par `mousemove`) | supprime |
| `whileHover` sur `Button`, cartes, icones | transitions CSS |

**Regle posee dans le code, a ne jamais enfreindre :** une propriete qui masque
(`opacity: 0`, `clip-path`) n'apparait QUE dans un bloc `@supports`
garantissant que l'animation se jouera. L'arrivee du bandeau de titre, elle,
n'anime plus **que la position** — jamais l'opacite : si l'animation ne se joue
pas, le texte est lisible, simplement 14 px plus bas.

**Resultat mesure :** 0 element cache sur `/`, `/soins`, `/a-propos`,
`/galerie`, `/journal`, `/contact`, `/faq`, `/reservation`.

### Rouge — `h-13`, une classe Tailwind qui n'existe pas

`Button` declarait `h-13` pour sa taille `lg`. Cette classe n'est pas dans
l'echelle Tailwind : elle ne genere aucune regle, **silencieusement**. Les
boutons principaux — « Reserver un soin », « Voir les soins » — n'avaient donc
aucune hauteur et retombaient sur celle de leur texte : **26 px au lieu de 48**.

Un balayage de tout le code n'a trouve aucune autre classe hors echelle.

### Rouge — debordement mobile du tunnel de reservation

Deja decrit en section 2 : `min-width: auto` sur les enfants de grille, page a
690 px sur un ecran de 375. Corrige par `min-w-0`.

### Orange — mise en page mobile

- **160 px de vide entre chaque section** (80 en haut, 80 en bas). Un palier
  mobile a ete introduit partout : `py-14 sm:py-20 lg:py-28`.
- **Texte a 8 px** dans le bloc de marque, 11 px pour les surtitres. Plancher
  remonte a 10 px pour la marque et 12 px pour les surtitres, avec un
  interlettrage resserre sur petit ecran.

### Effet sur le poids envoye au navigateur

| Page | Avant | Apres |
|---|---|---|
| `/a-propos` | 168 kB | **111 kB** |
| `/journal` | 160 kB | **111 kB** |
| `/faq` | 161 kB | **156 kB** |
| `/soins` | 172 kB | **163 kB** |

Dix-huit composants de la vitrine sont repasses **serveur** : ils n'envoient
plus aucun JavaScript. `Button`, `CarteSoin`, `Hero`, `BandeauImage`, `Footer`,
`Presentation`, `Promesses`, `ADomicile`, `SoinsAccueil`, `JournalTeaser`,
`Reveal`, `Effets`, `Bits`, entre autres.

### Verification finale, sur le build de production

| Controle | Resultat |
|---|---|
| Navigation `/` puis `/a-propos`, `/soins`, `/galerie`, `/journal`, `/contact`, retour `/` | **6 / 6 OK** |
| Texte cache, sur chacune de ces pages | **0** |
| Opacite de l'en-tete | **1** |
| Images chargees | **42 / 42**, aucune cassee |
| Debordement horizontal a 375 px | **aucun** |
| Hauteur des boutons principaux, mobile | **44 a 48 px** |
| `tsc --noEmit`, `next lint`, `next build` | propres |

### Une erreur de methode, a ne pas repeter

Pendant cette passe, j'ai cru un moment que le CSS de developpement etait
incomplet, et j'ai ajoute un `@source` dans `globals.css` en croyant corriger
un incident. C'etait **faux** : mon script de comptage des regles CSS ne
descendait pas correctement dans les `@layer` de Tailwind v4. Le vrai coupable
etait `h-13`. Le `@source` a ete garde — il rend le projet insensible au
dossier de travail, ce qui reste utile — mais son commentaire a ete corrige
pour ne plus decrire un incident qui n'a pas eu lieu.

**Lecon :** avant de conclure qu'un outil est casse, verifier l'instrument de
mesure. Ici, le fichier CSS servi contenait bien tout ; c'est mon compteur qui
mentait.

---

## 9. Troisieme passe — les etats interactifs

Les deux premieres passes ne mesuraient que des pages **au repos**. Tout ce
qui apparait APRES un clic — menu ouvert, reponse de FAQ depliee, message
d'erreur, etape suivante du tunnel — n'avait jamais ete verifie. C'est la que
se trouvaient les defauts restants.

### Le declencheur

Un audit du menu mobile ouvert a donne dix echecs de contraste a 1,03 : du
texte clair (244,237,228) sur un fond mesure creme (246,241,234). Le panneau
portait pourtant bien `bg-shelldeep`.

L'inspection a montre autre chose que du contraste :

    clip-path : inset(0px 0px 100%)      <- le panneau, decoupe a zero
    opacity   : 0                        <- chaque lien de navigation

Trois secondes apres le clic, le menu etait toujours dans son etat de depart.

### La cause : `requestAnimationFrame`

    rafTicksEn1s : 0

Framer Motion avance toutes ses animations depuis `requestAnimationFrame`.
Quand rAF ne tourne pas, un element **reste fige sur son etat initial** — et
ces etats initiaux etaient `opacity: 0`.

Dans un navigateur reel, rAF peut effectivement s'arreter : onglet passe en
arriere-plan, appareil en economie d'energie, erreur levee dans un autre
sous-arbre anime. Le risque n'est pas theorique, et son cout est total : la
page ne s'affiche pas.

Vingt-et-un composants faisaient dependre la visibilite de leur contenu de
cette boucle, dont :

| Surface | Ce qu'on voyait si rAF ne tournait pas |
|---|---|
| Menu mobile | Menu ouvert, ecran vide — seule navigation du mobile |
| Etapes du tunnel | « Continuer », puis un panneau blanc |
| Creneaux horaires | Un jour selectionne, aucune heure a cliquer |
| Messages d'erreur | Le formulaire refuse d'avancer, sans dire pourquoi |
| Page de confirmation | La reference de reservation, invisible |
| Reponses de la FAQ | La question s'ouvre sur du vide |
| Visionneuse | Un ecran noir, sans photo |
| Ecran « message envoye » | Le formulaire disparait, rien ne le remplace |

### Ce qui a ete fait

Tout le mouvement client est passe en CSS, sauf deux exceptions assumees
(voir plus bas). `framer-motion` a disparu de 21 fichiers, dont `Header.tsx`
— donc du chemin critique de **chaque** page.

Nouveau vocabulaire dans `globals.css` : `.volet`, `.volet-liens`, `.tiroir`,
`.surgir`, `.surgir-cascade`, `.erreur-champ`, `.glisser`, `.pilule`,
`.surgir-coche`, `.trace-coche`, `.modal-contenu`, `.voile-modal`.

### Le meme piege, reecrit en CSS

Premiere version de `.volet` : un rideau `clip-path: inset(0 0 100%) -> 0`.
Mesure dans un moteur qui ne fait pas avancer les animations, le panneau
restait decoupe a zero. **J'avais reproduit le defaut Framer en CSS.**

Idem pour `.voile-modal` : le fondu portait sur le conteneur de la
visionneuse, dont l'image est un enfant. Un voile reste a `opacity: 0`
emportait la photo avec lui.

La regle ne portait donc jamais sur Framer. Elle porte sur les proprietes :

> **Une propriete qui MASQUE (`opacity`, `clip-path`, `visibility`,
> `scale(0)`, une translation hors ecran) n'a pas sa place dans l'image de
> DEPART d'une animation qui revele du contenu — quel que soit le langage.**
>
> Si l'animation ne se joue jamais, ce qu'on doit voir est le contenu.

Le panneau du menu n'a plus d'animation d'ouverture : le fond apparait d'un
coup, et le mouvement vient de la cascade des liens, qui ne decale que la
position. Le fondu du voile est passe sur `.voile-modal::before`, un
pseudo-element qui ne porte aucun contenu.

Un controle automatise (`audit_keyframes.py`) parcourt les 25 `@keyframes` du
projet et signale toute image de depart masquante non assumee. **Resultat :
aucune.**

### Framer Motion : retire du projet (26/08/2026)

La passe precedente avait garde `CatalogueSoins.tsx` sur Framer, au motif
qu'il n'animait que la disposition et qu'aucun equivalent CSS propre
n'existait pour une pastille de largeur variable.

Le chiffre a tranche. `next build` :

| Page | JS de page, avant | apres |
|---|---|---|
| `/soins` | **46,2 kB** | **2,69 kB** |
| `/soins` — premier chargement | 162 kB | 121 kB |
| toutes les autres pages vitrine | ~3 kB | inchange |

Quarante-trois kilo-octets de JavaScript, sur la page qui vend, pour trois
ornements — et pour une clientele majoritairement sur mobile.

Les trois ornements sont remplaces, sans librairie :

| Ornement | Avant | Maintenant |
|---|---|---|
| Pastille du filtre actif | `layoutId` partage | L'onglet actif porte son fond. Pas de glissement, et on ne perd rien d'utile. |
| Curseur de la bascule « a domicile » | `motion.span layout` | `transition: left` en CSS |
| Replacement des cartes au filtrage | `layout` + `AnimatePresence` | **API View Transitions** (`document.startViewTransition`), quand le navigateur l'a. Meme effet FLIP, en natif, pour zero octet. |

`framer-motion` a ete desinstalle, et `src/lib/motion.ts` supprime : il
n'exportait plus que des constantes deja dupliquees en variables CSS.

La regle du projet vaut aussi pour ce remplacement : **l'animation est un
ornement, jamais un prerequis**. Sans l'API View Transitions, le filtre
s'applique instantanement ; rien ne part masque, rien n'attend une
librairie pour devenir visible.

Le back-office avait deja ete converti a la passe precedente.

### Ce que le volet de previsualisation permet, et ne permet pas

Dans ce moteur, **ni** les animations CSS **ni** les transitions n'avancent :
le temps ne s'ecoule pas. J'ai d'abord affirme le contraire — a tort.

Ce n'est pas une preuve sur la production, ou les animations CSS se jouent
normalement. C'est mieux : un **simulateur du pire cas**, celui ou aucune
animation ne se joue jamais. C'est exactement l'angle sous lequel il fallait
relire tout le site.

Consequence de methode : pour auditer un etat interactif, on neutralise
d'abord le mouvement —

    *,*::before,*::after { transition:none !important; animation:none !important; }

— puis on mesure **l'etat d'arrivee**, seul etat qui compte. Sans cette
precaution, on mesure une image figee et on croit a un defaut qui n'existe
pas. C'est ce qui est arrive avec l'accordeon : bloque a `0px` dans le volet,
il donne bien 145,875 px des la transition neutralisee. La logique etait
juste.

### Registre : le site vouvoie, les erreurs tutoyaient

Decouvert en verifiant les messages d'erreur du formulaire de contact :

    « Indique ton nom. »   alors que tout le site dit « Connectez-vous »

**42 chaines** corrigees dans `validation.ts`, `firebase/errors.ts`,
`auth-context.tsx`, `admin.ts` et `firebase/admin.ts`. Le changement de ton
tombait au pire moment : celui ou quelque chose vient de rater et ou le
message est lu avec attention.

### Verification finale

| Controle | Portee | Resultat |
|---|---|---|
| Contraste WCAG AA, bureau | 17 pages | **1 013 textes, 0 echec** |
| Contraste WCAG AA, 375 px | 17 pages | **974 textes, 0 echec** |
| Texte reellement invisible (opacite cumulee, decoupe cumulee) | 17 pages | **0** |
| Images de depart masquantes non assumees | 25 `@keyframes` | **0** |
| Menu mobile ouvert | contraste + navigation | **151 textes, 0 echec** ; clic sur `/soins` -> page chargee, menu demonte, defilement rendu |
| Accordeon FAQ | ouverture / fermeture | 146 px ouvert, 0 px ferme, `inert` correct |
| Erreurs du formulaire de contact | visibilite + liaison ARIA | **3 / 3 visibles**, `aria-describedby` valide, 0 echec de contraste |
| Tunnel de reservation | etapes 1 a 4 | chaque etape peinte (29 a 47 textes), indicateur suivi, **19 creneaux** proposes, 4 erreurs visibles |
| Contraste, tunnel etape 4 en erreur | etat jamais mesure avant | **38 textes, 0 echec** |
| `tsc --noEmit`, `next lint`, `next build` | — | propres |

### Un faux positif a connaitre

L'auditeur d'invisibilite signale 14 elements a `opacity: 0` sur `/` et
`/galerie`. Ce sont les legendes de galerie revelees au survol
(`group-hover:opacity-100`), un choix de design : l'information reste portee
par l'attribut `alt` de l'image et par la visionneuse. Ce ne sont pas des
animations bloquees.

### Lecon de cette passe

Les deux passes precedentes mesuraient un site **au repos** et le declaraient
sain. Un site de reservation ne vit pas au repos : il vit dans ses etats
ouverts. Un audit qui ne clique sur rien ne verifie pas le produit, il en
verifie la page d'accueil.

---

## 10. Le back-office, meme traitement

La passe precedente avait laisse `src/components/admin/*` sur Framer, au motif
que c'est une interface de personnel derriere authentification. Le raisonnement
etait faible : le personnel travaille dessus tous les jours, et un tableau de
bord vide n'est pas moins bloquant qu'une vitrine vide.

Cinq fichiers convertis : `CadreAdmin`, `BoiteMessages`, `GestionReservations`,
`GestionSoins`, `Graphiques`.

### Ce qui etait en jeu

| Surface | Si la boucle d'animation ne tournait pas |
|---|---|
| `CadreAdmin` — `<motion.main>` | **Tout** le back-office arrivait invisible |
| Tiroirs messages / rendez-vous | La ligne s'ouvrait sur du vide — adresse et telephone du client inaccessibles |
| Confirmation de suppression | On clique sur la poubelle, rien n'apparait, on reclique |
| Champs repetables (edition d'un soin) | On ajoute une ligne, rien n'apparait |
| **Graphiques** | Courbe, points, barres et anneau **vides** |

### Le cas des graphiques, a part

Sur une vitrine, une animation qui ne se joue pas coute un effet. Sur un
tableau de bord, elle coute la **donnee** — et une donnee absente se lit comme
un zero. Ce n'est pas un defaut d'affichage, c'est une information fausse.

La courbe, son aire et ses points n'ont donc plus aucune animation d'entree :
ils sont peints tels quels. Les barres et l'anneau posent leur valeur en style
inline et la **transitionnent** au lieu de l'animer depuis zero — au premier
rendu la valeur est deja juste, et le mouvement ne sert plus qu'a montrer un
changement de donnee.

Aucune de ces animations ne servait l'un des quatre roles definis dans
`motion.ts`. Elles ont simplement ete retirees.

### Verification, sans authentification possible

Firebase n'etant pas configure, `/admin` redirige vers `/connexion` — la garde
fonctionne, mais l'interface ne peut pas etre ouverte. Les composants de
graphique ont donc ete montes sur une page d'essai temporaire, avec des
donnees connues, puis la page a ete supprimee.

Mesure dans le volet, **ou aucune animation ne tourne** :

| Controle | Attendu | Mesure |
|---|---|---|
| Courbe : `stroke-dashoffset` | `0` (trace complet) | **0px** |
| Courbe : longueur du trace | > 0 | **1 967 px** |
| Courbe : opacite de l'aire | 1 | **1** |
| Courbe : points de donnees | 25 | **25**, sans transformation |
| Barres 24 / 18 / 12 / 6 (max 24) | 1 / 0,75 / 0,5 / 0,25 | **1 / 0,75 / 0,5 / 0,25** |
| Anneau, 22 domicile sur 60 | offset 215 | **215** |
| Contraste, theme **clair** | — | 55 textes, **0 echec** |
| Contraste, theme **sombre** | — | 55 textes, **0 echec** |

C'est la premiere fois que le theme sombre du back-office est mesure **en
rendu** et non en simples paires de jetons.

### `motion.ts` reduit

Le fichier exportait dix-neuf helpers Framer pour deux reellement consommes. Le
reste etait du code mort — dont des variantes toutes pretes du genre :

    monteeFondu = { cache: { opacity: 0, y: 26 }, vu: { opacity: 1, y: 0 } }

C'est-a-dire le piege exact qu'on vient de retirer partout, laisse bien en
evidence dans le fichier presente comme « la source unique du mouvement ».
Il ne reste que les courbes, les durees et `ressort`.

### Etat final de Framer

| Endroit | Statut |
|---|---|
| `CatalogueSoins.tsx` | **Conserve** — n'anime que la disposition, ne masque rien |
| `lib/motion.ts` | Un `import type` seulement |
| Tout le reste (vitrine, compte, auth, back-office) | **Retire** |

`framer-motion` n'est plus dans le bundle partage (102 ko, inchange) : il ne
pese plus que sur la seule route `/soins`. Les cinq pages du back-office
tournent entre 237 et 247 ko, dont l'essentiel est Firebase.
