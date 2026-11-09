# 🗣️ FluentQuest — coach d’anglais & d’espagnol à l’oral

Application web autonome (PWA) : conversations orales avec un coach IA (Gemini **ou** Claude), support écrit en direct (« tableau »), cursus de 6 mois, gamification. Installable sur iPhone et PC, hébergée gratuitement sur GitHub Pages. **Aucun serveur, aucune base de données** : tout reste sur l’appareil.

## Fonctionnalités
- **Du grand débutant (A0, niveau 6e) jusqu’à C1.** Niveau A0 ou A1 : parcours « Premiers mots » avec salutations, nombres, couleurs, école, famille, corps, météo, maison, nourriture… Les explications sont en français, la traduction est affichée, il y a beaucoup de quiz et de « répète après moi ». Pour les niveaux A2 et plus : parcours Jeune ou Adulte.
- **Chaque leçon travaille le vocabulaire ET la grammaire** : 4 à 6 mots nouveaux (marqués NEW et ajoutés au carnet), la règle de la semaine au tableau, au moins 2 quiz (4 pour le Boss), des « répète après moi » notés sur la prononciation, puis de l’expression orale. L’IA connaît les mots déjà appris : elle les réutilise et ne les réenseigne pas.
- **Cursus 26 semaines × 5 leçons**, regroupées en 6 mondes : 🌱 Découverte → 🧩 Grammaire en action → 🎭 Jeu de rôle → 🎧 Écoute → 🐉 Défi du Boss. Semaines 13 et 26 = révisions. Test de niveau oral avec l’IA.
- **Gamification** :
  - XP, niveaux et titres, objectif quotidien, série de jours 🔥 avec gels 🧊 ;
  - **combos** pendant la leçon (XP x2 à 3 bonnes réponses d’affilée, x3 à 6) ;
  - **Boss** avec barre de points de vie à battre à chaque leçon 5 ;
  - **pièces 🪙** gagnées en leçon, avec les quêtes, les badges et les niveaux ;
  - **3 quêtes du jour** et un **coffre** 🎁 ;
  - **ligues hebdomadaires** (Bronze → Diamant) avec promotion et relégation ;
  - **boutique** : gels de série, boost XP x2, avatars, thèmes de couleur ;
  - 30 badges, duel familial et effets sonores.
- **Leçon orale** : le coach parle, on répond au micro. Il y a des corrections douces, une astuce en français, la réécoute lente 🐢, des suggestions de réponses et un mode mains libres.
- Fonctionne **hors-ligne** pour la révision des cartes et la prononciation. Les leçons IA nécessitent Internet.

## Publier sur GitHub Pages (5 minutes)
1. Crée un dépôt sur GitHub (ex. `fluentquest`), public.
2. Dépose **tout le contenu de ce dossier** à la racine du dépôt (bouton *Add file → Upload files*, ou `git push`).
3. Dépôt → **Settings → Pages** → *Source* : `Deploy from a branch`, branche `main`, dossier `/ (root)` → **Save**.
4. Après ~1 minute, l’app est en ligne sur `https://<ton-compte>.github.io/fluentquest/`.

Pour publier une mise à jour : remplace les fichiers, puis incrémente `CACHE = 'fluentquest-v3'` dans `sw.js` (v3, v4…).

### Mettre à jour l’app sur le téléphone
Les données (progression, XP, clé API) sont conservées : elles restent dans le stockage de l’app, pas dans les fichiers.
1. Attends 1 à 2 minutes après la publication, le temps que GitHub Pages se mette à jour.
2. Ouvre l’app **avec Internet**, puis **ferme-la complètement** : sur iPhone, balaie vers le haut depuis le bas de l’écran et fais glisser l’app vers le haut.
3. Rouvre-la : la nouvelle version est chargée. Vérifie le numéro de version en bas des Réglages.
4. Si l’ancienne version s’affiche encore, recommence une fois l’étape 2.

## Installer l’application
- **iPhone** : ouvrir l’URL dans **Safari** → Partager ⬆︎ → **Sur l’écran d’accueil**.
- **PC (Chrome/Edge)** : icône *Installer* dans la barre d’adresse.

## IA : comment l’utiliser gratuitement
Choix dans **Réglages** :

| Option | Coût | Où ça marche |
|---|---|---|
| **Gemini (clé AI Studio)** — recommandé | **Gratuit** si la clé n’est liée à aucun compte de facturation | Partout (GitHub Pages, iPhone, PC) |
| **Mon abonnement Claude** | Inclus dans l’abonnement claude.ai (dans ses limites d’usage) | Uniquement quand l’app est ouverte **dans Claude** (version « artifact ») |
| Claude API | Payant à l’usage | Partout |

**Gemini gratuit, pas à pas**
1. Avec un compte **Gmail personnel**, va sur https://aistudio.google.com/apikey → *Create API key*. Les comptes Google Workspace sont souvent bloqués par l’administrateur, et l’abonnement Workspace n’inclut pas l’API.
2. **N’active pas la facturation** (pas de carte bancaire) : le projet reste dans l’offre gratuite et rien ne peut être facturé.
3. Colle la clé dans Réglages → Gemini, laisse le modèle sur **`auto`** → **Tester**.

Le mode `auto` choisit le modèle gratuit le plus généreux (« Flash-Lite » d’abord). Si le quota gratuit du jour d’un modèle est épuisé, l’app passe automatiquement au suivant. Quand tout est épuisé, un message l’indique : les quotas se rechargent chaque jour vers 9 h (heure de Paris). La révision des cartes et la prononciation fonctionnent sans IA. Une leçon fait environ 12 à 15 requêtes : prévois **une clé par personne** (chacun son compte Gmail) pour ne pas partager le quota.

À savoir : sur l’offre gratuite, Google peut utiliser les échanges pour améliorer ses produits. Ne mets pas d’informations personnelles dans le champ « À propos ».

**Mode abonnement Claude** : la même application est publiée comme page dans Claude. Ouverte depuis Claude par une personne connectée, elle utilise son abonnement, sans clé ni coût supplémentaire. Limites : il faut être connecté à claude.ai, les comptes Claude sont réservés aux plus de 18 ans, et le micro dépend de ce que l’app Claude autorise. Sinon, utilise la dictée du clavier.

La clé API, quand il y en a une, est stockée **dans le navigateur de l’appareil** (localStorage), jamais dans le dépôt.

## Micro & voix — à savoir
- **PC (Chrome/Edge)** : reconnaissance vocale native, excellente.
- **iPhone** : la reconnaissance du navigateur fonctionne dans Safari (Siri/Dictée activés) mais peut être indisponible une fois l’app installée sur l’écran d’accueil. L’app bascule alors automatiquement sur **l’enregistrement + transcription Gemini** (nécessite une clé Gemini, même si le coach est Claude). Dernier recours : la dictée 🎤 du clavier iPhone.
- **Voix** : Réglages → profil → choisir la voix et la vitesse. Sur iPhone, télécharger des voix « Améliorées/Premium » (Réglages iOS → Accessibilité → Contenu énoncé → Voix) rend le coach beaucoup plus naturel.

## Synchroniser les appareils
Chaque appareil garde ses propres données. Écran **Famille** → *Exporter mon profil* (fichier .json) → *Importer* sur l’autre appareil pour voir le duel de la semaine ou changer d’appareil.

## Structure
```
index.html              page unique
manifest.webmanifest    installation (PWA)
sw.js                   cache hors-ligne
css/style.css           interface (clair/sombre)
js/app.js               écrans & logique des leçons
js/ai.js                appels Gemini / Claude + consignes pédagogiques
js/curriculum.js        cursus 26 semaines, thèmes, grammaire, phrases de départ
js/speech.js            synthèse & reconnaissance vocales, transcription
js/store.js             données locales, XP, séries, pièces, quêtes, ligues, boutique, badges, cartes
js/sfx.js               effets sonores
icons/                  icônes
```
Pour adapter le programme (thèmes, points de grammaire), il suffit d’éditer `js/curriculum.js`.
