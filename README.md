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

Pour publier une mise à jour : remplace les fichiers, puis incrémente `CACHE = 'fluentquest-v2'` dans `sw.js` (v3, v4…).

### Mettre à jour l’app sur le téléphone
Les données (progression, XP, clé API) sont conservées : elles restent dans le stockage de l’app, pas dans les fichiers.
1. Attends 1 à 2 minutes après la publication, le temps que GitHub Pages se mette à jour.
2. Ouvre l’app **avec Internet**, puis **ferme-la complètement** : sur iPhone, balaie vers le haut depuis le bas de l’écran et fais glisser l’app vers le haut.
3. Rouvre-la : la nouvelle version est chargée. Vérifie le numéro de version en bas des Réglages.
4. Si l’ancienne version s’affiche encore, recommence une fois l’étape 2.

## Installer l’application
- **iPhone** : ouvrir l’URL dans **Safari** → Partager ⬆︎ → **Sur l’écran d’accueil**.
- **PC (Chrome/Edge)** : icône *Installer* dans la barre d’adresse.

## Clé d’IA
Au premier lancement : **Réglages** → choisir Gemini ou Claude → coller la clé → **Tester**.
- **Gemini** : clé sur https://aistudio.google.com/apikey (offre gratuite avec quotas). Modèle par défaut `gemini-3.5-flash` ; le bouton *Lister les modèles* affiche ceux disponibles sur ton compte.
- **Claude** : clé sur https://console.anthropic.com (payant à l’usage). Modèle par défaut `claude-haiku-5-5` (rapide et économique) ; `claude-sonnet-5-5` pour un coach plus fin.

⚠️ La clé est stockée **dans le navigateur de l’appareil** (localStorage), jamais dans le dépôt. Ne la mets pas dans le code. Fixe une limite de dépenses dans la console du fournisseur. Ne la saisis que sur les appareils de la famille.

Ordre de grandeur : une leçon ≈ 10 allers-retours ≈ 30–60 k tokens cumulés → quelques centimes avec un modèle « flash/haiku ».

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
