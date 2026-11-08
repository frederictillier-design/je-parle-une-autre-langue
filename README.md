# 🗣️ FluentQuest — coach d’anglais & d’espagnol à l’oral

Application web autonome (PWA) : conversations orales avec un coach IA (Gemini **ou** Claude), support écrit en direct (« tableau »), cursus de 6 mois, gamification. Installable sur iPhone et PC, hébergée gratuitement sur GitHub Pages. **Aucun serveur, aucune base de données** : tout reste sur l’appareil.

## Fonctionnalités
- **2 profils types** : 🎒 Ado (thèmes collège/lycée, sport, séries, orientation…) et 💼 Adulte (réunions, négociation, tech, entretien…). Plusieurs profils par appareil.
- **Cursus 26 semaines × 5 leçons** (anglais et espagnol séparés) : Découverte 🌱, Grammaire en action 🧩, Jeu de rôle 🎭, Écoute 🎧, Défi « boss » 🏆. Semaines 13 et 26 = révisions / grand défi final. Le week-end : révision des cartes et prononciation.
- Progression **du niveau de départ au niveau cible** (CECRL A1→C1, ex. A2→B2) ; **test de niveau oral** par l’IA.
- **Leçon orale** : le coach parle (synthèse vocale), on répond au micro ; corrections douces, astuces en français, traduction à la demande, réécoute lente 🐢, suggestions de réponses, mode mains libres.
- **Tableau** : vocabulaire, règles, phrases modèles — ajoutés automatiquement au **carnet de révision** (répétition espacée, 5 boîtes).
- **Gamification** : XP, niveaux & titres, objectif quotidien, série de jours 🔥 avec « gels » 🧊, étoiles par leçon, 17 badges, duel familial de la semaine, indicateur avance/retard sur le planning 6 mois.
- Fonctionne **hors-ligne** pour la révision des cartes et la prononciation (les leçons IA nécessitent Internet).

## Publier sur GitHub Pages (5 minutes)
1. Crée un dépôt sur GitHub (ex. `fluentquest`), public.
2. Dépose **tout le contenu de ce dossier** à la racine du dépôt (bouton *Add file → Upload files*, ou `git push`).
3. Dépôt → **Settings → Pages** → *Source* : `Deploy from a branch`, branche `main`, dossier `/ (root)` → **Save**.
4. Après ~1 minute, l’app est en ligne sur `https://<ton-compte>.github.io/fluentquest/`.

Pour une mise à jour : remplace les fichiers, puis incrémente `CACHE = 'fluentquest-v1'` dans `sw.js` (v2, v3…) pour forcer le rafraîchissement sur les appareils installés.

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
js/store.js             données locales, XP, séries, badges, cartes
icons/                  icônes
```
Pour adapter le programme (thèmes, points de grammaire), il suffit d’éditer `js/curriculum.js`.
