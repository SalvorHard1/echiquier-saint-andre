# L’Échiquier de Saint-André

Application d'échecs de l'AS Échecs de Saint-André (de la 6ᵉ à la Terminale) : apprendre les règles, suivre des cours, jouer contre des bots de différents niveaux, résoudre des problèmes et analyser ses parties.

## Respect de la vie privée (RGPD)

- Aucun compte, aucun cookie, aucun traceur, aucune statistique de visite.
- Rien n'est envoyé sur Internet : parties, analyses et problèmes restent en mémoire et s'effacent à la fermeture de l'onglet.
- Seuls les **hauts faits** (avec les étoiles de « Pas à pas » et des « Cours », et les résultats du défi du jour) sont enregistrés, dans le stockage local du navigateur (`localStorage`), sur l'appareil de l'élève uniquement, sans nom ni identifiant. L'élève peut les exporter dans un fichier, les importer ou tout effacer depuis la page Hauts faits.
- Aucune ressource externe : tout est hébergé dans ce dépôt (une Content-Security-Policy l'impose dans `index.html`).
- Le moteur Stockfish tourne directement sur l'appareil de l'élève.

## Tester sur son ordinateur

Double-cliquer sur **`Lancer.bat`** : le navigateur s'ouvre sur `http://localhost:8080`. Fermer la fenêtre noire pour arrêter.
Aucune installation n'est nécessaire (le serveur utilise PowerShell, déjà présent sur Windows).

Pour voir le rendu sur téléphone : dans le navigateur, `F12` puis l'icône « appareil mobile ».

## Mettre en ligne (GitHub Pages)

1. Créer un dépôt sur GitHub et y envoyer tous les fichiers du dossier.
2. Dans le dépôt : **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. L'application est en ligne quelques minutes plus tard sur `https://<pseudo>.github.io/<dépôt>/`.

Il n'y a aucune étape de compilation : le site est servi tel quel.

## Hors ligne et installation

Après une première visite avec Internet, l'application **fonctionne sans connexion**, Stockfish et les problèmes compris (environ 8 Mo). Le fichier `sw.js` (service worker) garde une copie des fichiers du site sur l'appareil.
On peut aussi l'**installer** sur l'écran d'accueil, comme une vraie application : bouton « 📲 Installer l'application » en bas de page.

- Les élèves reçoivent la nouvelle version à leur visite suivante, avec un message « Mise à jour installée ».
- Si tu ajoutes un fichier au site, ajoute-le aussi à la liste `FICHIERS` de `sw.js`.
- Le hors-ligne marche sur `https://` (GitHub Pages) et sur `http://localhost` (`Lancer.bat`).

## Numéro de version

La version actuelle s'affiche en bas de page (par exemple `v0.10`). Un clic dessus montre le journal des nouveautés.

À chaque mise en ligne d'une nouvelle version :
1. dans `js/version.js` : augmenter `VERSION` (`'0.10'` → `'0.11'`) et ajouter une entrée en tête de `NOUVEAUTES` ;
2. dans `sw.js` : mettre **le même numéro** dans `VERSION` ;
3. envoyer sur GitHub les fichiers modifiés, sans oublier `js/version.js` et `sw.js`.

Numérotation conseillée : `0.11`, `0.12`… pour les ajouts, et `1.0` pour la première version « officielle » présentée à l'AS.

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `css/style.css` | Page et style |
| `js/app.js` | Écrans : accueil, choix du bot, partie |
| `js/analyse.js` | Analyse d'une partie PGN : correction des coups, barre d'évaluation, graphique |
| `js/cadences.js` | Cadences (Bullet, Blitz, Rapide) et pendules |
| `js/problemes.js` | Problèmes : entraînement par niveau et course contre la montre |
| `js/defi.js` | Défi du jour : le même problème pour tous, choisi d'après la date, plus dur au fil de la semaine |
| `js/modal.js` | Fenêtres modales |
| `js/succes.js` | Hauts faits : objectifs, médailles, rangs, sauvegarde locale |
| `js/lecons.js` | Parcours « Pas à pas » : carte des leçons et déroulé des étapes |
| `js/lecons-data.js` | Contenu des leçons (positions, consignes, quiz) : facile à compléter |
| `js/cours.js` | Cours : explications, démonstrations, exercices et finales contre Stockfish |
| `js/cours-data.js` | Contenu des cours, classés par chapitre et par niveau : facile à compléter |
| `data/problemes.json` | 2 100 problèmes (350 par niveau) issus de la base Lichess |
| `js/board.js` | Plateau interactif (clic ou glisser, souris ou doigt) |
| `js/engine.js` | Pilotage de Stockfish (Web Worker) |
| `js/bots.js` | Niveaux des bots (modifiables facilement) |
| `js/config.js` | Nom de l'application |
| `js/version.js` | Numéro de version et journal des nouveautés |
| `vendor/` | Bibliothèques libres : Stockfish 17.1 lite, chess.js 1.4 |
| `assets/pieces/` | Pièces « cburnett » (Lichess) |
| `sw.js`, `manifest.webmanifest`, `assets/icone-*.png` | Hors ligne et installation sur l'écran d'accueil |
| `outils/serveur.ps1`, `Lancer.bat` | Serveur de test local |

## Licences

- Application : **GPL-3.0** (voir `LICENSE`).
- Problèmes : [base de problèmes Lichess](https://database.lichess.org/#puzzles), domaine public (CC0). Sélection : problèmes populaires et beaucoup joués, difficulté fiable.
- [Stockfish](https://stockfishchess.org) : GPL-3.0 · [chess.js](https://github.com/jhlywa/chess.js) : BSD-2 · pièces cburnett (Colin M.L. Burnett) : GPL-2.0+.
