# L’Échiquier de Saint-André

Application d'échecs de l'AS Échecs de Saint-André (de la 6ᵉ à la Terminale) : apprendre les règles, suivre des cours, jouer contre des bots de différents niveaux, résoudre des problèmes et analyser ses parties.

## Respect de la vie privée (RGPD)

- Aucun compte, aucun cookie, aucun traceur, aucune statistique de visite.
- Rien n'est envoyé sur Internet : analyses et problèmes restent en mémoire et s'effacent à la fermeture de l'onglet. Les 50 dernières parties (contre les bots et à deux, terminées ou quittées après 3 coups) sont gardées dans le `localStorage` de l'appareil de l'élève, sans nom, pour la page « Mes parties » (`js/historique.js`) ; l'élève peut les supprimer une à une ou tout effacer, et marquer d'une ⭐ celles qui ne doivent pas s'effacer. La partie en cours est gardée dans le `sessionStorage` de l'onglet pour survivre à un rechargement de la page ; elle s'efface quand on quitte la partie ou qu'on ferme l'onglet.
- Seuls les **hauts faits** (avec les étoiles de « Pas à pas » et des « Cours », et les résultats du défi du jour) sont enregistrés, dans le stockage local du navigateur (`localStorage`), sur l'appareil de l'élève uniquement, sans nom ni identifiant. L'élève peut les exporter dans un fichier, les importer ou tout effacer depuis la page Hauts faits.
- **Anti-triche** : la sauvegarde des hauts faits est signée, et un *journal de contrôle* (dates et types d'alertes, sans nom) ainsi que le PGN des victoires contre les bots forts sont gardés avec elle, sur l'appareil de l'élève. Ils ne partent nulle part : c'est l'élève qui donne son fichier exporté au prof.
- Le mode tournoi (espace Prof-AS) garde les prénoms des élèves inscrits dans le `localStorage` de l'appareil du prof uniquement ; un bouton « Effacer le tournoi » les supprime.
- Le classement Elo (espace Prof-AS) garde la liste des élèves du club et le journal de leurs parties dans le `localStorage` de l'appareil du prof uniquement, d'une séance à l'autre. Il s'exporte dans un fichier (sauvegarde, changement de tablette) et un bouton « Tout effacer » le supprime.
- Une position partagée par QR code est écrite dans le lien lui-même (après le `#`) : elle ne passe par aucun serveur.
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
- **iPhone, iPad et Safari** : Safari efface tout ce que le site a enregistré (hauts faits, copie hors ligne) après **7 jours sans visite**. L'application installée sur l'écran d'accueil n'est pas concernée, mais elle a sa propre mémoire : il faut exporter la progression dans Safari, puis l'importer dans l'application. Sur ces appareils, tant que l'application n'est pas installée, un encart le rappelle à l'accueil et sur la page Hauts faits, et propose d'installer ou d'exporter (il disparaît 7 jours après un export). L'application demande aussi au navigateur un stockage « persistant » (`navigator.storage.persist()`).

## Espace Prof-AS

Onglet **🔒 Prof-AS**, protégé par un mot de passe : mode tournoi (système suisse), mode projection (grand échiquier, éditeur de position, plein écran) et partage d'une position par QR code. Le déverrouillage dure jusqu'à la fermeture de l'onglet, ou jusqu'à **30 min sans toucher l'appareil** (verrouillage automatique, réglable dans `INACTIVITE`, `js/prof.js`).

- **Changer le mot de passe** : double-cliquer sur **`Mot-de-passe-prof.bat`**, puis envoyer `js/config.js` sur GitHub. Seule une empreinte **PBKDF2** (sel aléatoire, 600 000 itérations) est enregistrée, jamais le mot de passe lui-même : chaque essai prend environ une seconde, ce qui freine fortement le cassage du mot de passe.
- L'onglet déverrouillé garde une clé tirée du mot de passe : recopier l'empreinte de `config.js` dans le navigateur ne permet pas d'entrer.
- Après **5 erreurs**, il faut attendre 30 s, puis deux fois plus à chaque nouvelle erreur (15 min au plus). Le nombre d'erreurs est gardé dans le `localStorage` de l'appareil (sans aucune autre donnée) et s'efface quand on entre le bon mot de passe.
- Ce verrou empêche les élèves d'y entrer facilement, mais ce n'est **pas une vraie sécurité** : le site est public et tout se passe dans le navigateur (un élève qui sait programmer peut modifier le code dans son navigateur). Choisis un mot de passe long, et ne mets rien de confidentiel dans cet espace.
- Les QR codes ne marchent que sur le site en ligne (pas sur `localhost`).
- **Classement Elo** (`js/elo.js`) : onglet « Liste des élèves » (classement, progression du jour, plein écran pour l'annoncer) et onglet « Matchs Elo » (qui a gagné contre qui). Tout le monde démarre à 800 ; K = 40 pendant les 10 premières parties, puis 20 (`K_DEBUT`, `PARTIES_DEBUT`, `K`). Seul le journal des parties est enregistré : les Elo sont recalculés en le relisant, donc supprimer ou corriger une partie remet tout juste. Les résultats du mode tournoi y entrent aussi. Sur iPad, installer l'application sur l'écran d'accueil et exporter régulièrement une sauvegarde (Safari efface les données après 7 jours sans visite).

## Anti-triche

Sans serveur ni compte, une triche très motivée reste possible : le but est que tricher coûte plus d'effort que jouer, et que le prof le voie.

- **Sauvegarde signée** (`js/succes.js`) : une progression retouchée dans le navigateur revient à la dernière sauvegarde valide (copie de secours signée), un fichier retouché est refusé à l'import. Les sauvegardes d'avant cette protection sont reprises telles quelles, une fois, à la mise à jour. Ne jamais changer `CLE_SIGNATURE`, sinon toutes les sauvegardes deviennent invalides.
- **Contrôle de cohérence** : compteurs cohérents entre eux, hauts faits gardés seulement s'ils sont justifiés.
- **Horloge** : si l'heure de l'appareil recule (date avancée pour jouer les défis à l'avance, puis remise), les défis et jours « du futur » sont retirés. Un défi ne compte que pour aujourd'hui.
- **Vigilance** (`js/vigilance.js`) : contre un bot, quitter la page pendant son tour (autre onglet, fenêtre, appli, rechargement) ou jouer à un rythme de moteur rend la victoire *non homologuée*. Seuils dans `SEUILS` : 3 sorties ou 30 s en tout, et 1 sortie ou 10 s contre Maître et Stockfish. Au défi du jour, quitter la page pendant l'essai le fait rater.
- **Alertes** : l'élève voit une fenêtre « Alerte anti-triche » à chaque détection, et tout est noté dans son journal de contrôle (page Hauts faits).
- **👁 L'Œil de Caïssa** (espace Prof-AS) : lit le fichier exporté par un élève et donne un **pourcentage de triche détectée**, avec le détail des éléments (poids réglables dans `POIDS`, `js/prof.js`). On y trouve aussi le journal, les parties gagnées à vérifier, et un bouton pour les analyser avec Stockfish. La précision de chaque partie peut entrer dans le score.
- Ce qui reste possible : utiliser le fichier d'un camarade, ou modifier le code de l'application. Pour un haut fait rare (Challenger…), le mieux reste de rejouer une position avec l'élève.

## Numéro de version

La version actuelle s'affiche en bas de page (par exemple `v0.10`). Un clic dessus montre le journal des nouveautés.

À chaque mise en ligne d'une nouvelle version, double-cliquer sur **`Publier.bat`** : il demande le nouveau numéro et les nouveautés, les écrit dans `js/version.js` **et** `sw.js`, puis vérifie que chaque fichier du site figure dans la liste `FICHIERS` de `sw.js` (sinon le hors-ligne casserait). Il ne reste qu'à envoyer sur GitHub les fichiers modifiés.

Sans rien saisir (Entrée directement), `Publier.bat` fait seulement la vérification. En ligne de commande :
`powershell -ExecutionPolicy Bypass -File outils\publier.ps1 -Version 0.12 -Nouveautes "Ajout 1|Ajout 2"`.

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
| `js/prof.js` | Espace Prof-AS : mot de passe, mode projection, partage de position, L'Œil de Caïssa (dossiers anti-triche) |
| `js/tournoi.js` | Mode tournoi : système suisse, résultats, classement |
| `js/historique.js` | « Mes parties » : les 50 dernières parties de l'élève, à revoir et analyser |
| `js/elo.js` | Classement Elo du club : liste des élèves, matchs, calcul des Elo |
| `js/qr.js` | Générateur de QR codes (sans bibliothèque externe) |
| `js/position.js` | Page d'une position partagée : la jouer contre un bot ou à deux |
| `js/succes.js` | Hauts faits : objectifs, médailles, rangs, sauvegarde locale signée, journal de contrôle |
| `js/vigilance.js` | Anti-triche : sorties de la page, rythme de jeu, alertes |
| `js/skins.js` | Skins de plateau : 26 plateaux (couleurs ou motifs CSS des cases) et 15 jeux de pièces, débloqués par rang ou haut fait |
| `js/plateaux.js` | Page « Plateaux » : choix du skin, déblocage par rang ou haut fait |
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
| `assets/pieces/` | Pièces « cburnett » (à la racine) et les autres jeux de pièces de Lichess (un dossier par jeu, voir `js/skins.js`) |
| `outils/planche/` | Planche de comparaison des jeux de pièces et des plateaux (outil de travail, pas dans l'application) |
| `sw.js`, `manifest.webmanifest`, `assets/icone-*.png` | Hors ligne et installation sur l'écran d'accueil |
| `outils/serveur.ps1`, `Lancer.bat` | Serveur de test local |
| `outils/publier.ps1`, `Publier.bat` | Changement de version et vérification avant mise en ligne |
| `outils/mot-de-passe-prof.ps1`, `Mot-de-passe-prof.bat` | Changement du mot de passe de l'espace Prof-AS |

## Licences

- Application : **GPL-3.0** (voir `LICENSE`).
- Problèmes : [base de problèmes Lichess](https://database.lichess.org/#puzzles), domaine public (CC0). Sélection : problèmes populaires et beaucoup joués, difficulté fiable.
- [Stockfish](https://stockfishchess.org) : GPL-3.0 · [chess.js](https://github.com/jhlywa/chess.js) : BSD-2 · pièces cburnett (Colin M.L. Burnett) : GPL-2.0+.
- Jeux de pièces de [Lichess](https://github.com/lichess-org/lila/blob/master/COPYING.md), utilisés tels quels dans `assets/pieces/` :
  - merida (Armando Hernandez Marroquin) : GPL-2.0+ · chessnut ([Alexis Luengas](https://github.com/LexLuengas/chessnut-pieces)) : Apache 2.0
  - celtic, fantasy, spatial ([Maurizio Monge](https://github.com/maurimo/chess-art)) : MIT
  - papercut ([Nikolay Anzarov](https://nikoichu.itch.io/)) : CC BY 4.0 · shapes ([flugsio](https://github.com/flugsio/chess_shapes)) : CC BY-SA 4.0
  - staunty, maestro, cardinal, tatiana (sadsnake1), california (Jerry S.), horsey (cham, michael1241), anarcandy ([caderek](https://github.com/caderek)) : [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), usage non commercial uniquement.
