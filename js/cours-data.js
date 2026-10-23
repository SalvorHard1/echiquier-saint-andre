// Contenu des « Cours » : bien jouer, après avoir appris les règles (voir « Pas à pas »).
// Types d'étapes :
//  - explication : un texte, une position, des flèches et des cases colorées.
//                  Avec « coups » (en notation SAN), l'élève fait défiler une petite démonstration.
//                  Une note par coup est possible (« notes »). Ces étapes ne rapportent pas d'étoiles.
//  - exercice    : trouver le bon coup, ou une suite de coups. « solution » alterne les coups de l'élève et
//                  les réponses de l'adversaire. Dans « accepte », d'autres coups gagnants qui terminent l'exercice.
//                  « accepteFin » : d'autres coups acceptés pour le dernier coup de la solution.
//                  « erreurs » donne un message pour une erreur précise, et « aide » un indice.
//                  Avec but: 'mat', tout coup qui fait mat est accepté à la fin.
//  - finale      : jouer contre Stockfish jusqu'au but (mat, promotion, capture) ; « limite » = coups pour ★★★.
//  - quiz        : question à choix multiple.
// Au lieu d'une FEN, « apres » donne les coups joués depuis la position de départ.
// Dans un exercice, « notes » commente chaque coup de la solution, et ligne: true sert à rejouer une ouverture de mémoire.
// Le camp qui a le trait dans la position (FEN) est celui de l'élève.
// Couleurs des flèches et des cases : vert, rouge, bleu, orange.

export const NIVEAUX_COURS = {
  debutant: { nom: 'Débutant', couleur: '#16a34a' },
  intermediaire: { nom: 'Intermédiaire', couleur: '#d97706' },
  avance: { nom: 'Avancé', couleur: '#dc2626' },
};

export const CHAPITRES_COURS = [
  { id: 'ouverture', nom: 'Bien commencer', desc: 'Les principes de l’ouverture et les pièges à connaître.', couleur: '#2563eb' },
  { id: 'repertoire', nom: 'Les ouvertures', desc: 'Apprends de vraies ouvertures et rejoue-les de mémoire.', couleur: '#0891b2' },
  { id: 'tactique', nom: 'Les tactiques', desc: 'Les coups qui gagnent du matériel.', couleur: '#9333ea' },
  { id: 'mats', nom: 'Les mats types', desc: 'Des schémas de mat à connaître par cœur.', couleur: '#dc2626' },
  { id: 'finales', nom: 'Les finales', desc: 'Gagner quand il reste peu de pièces, contre Stockfish !', couleur: '#0d9488' },
  { id: 'strategie', nom: 'La stratégie', desc: 'Placer ses pièces sur les bonnes cases.', couleur: '#ea580c' },
];

const DEPART = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Ouvertures : la ligne jouée et un commentaire pour chaque coup.
const OUVERTURES = {
  italienne: [
    ['e4', 'Les Blancs prennent le centre.'],
    ['e5', 'Les Noirs aussi.'],
    ['Nf3', 'Le cavalier sort et attaque e5.'],
    ['Nc6', 'Le cavalier noir défend e5.'],
    ['Bc4', 'C’est l’Italienne : le fou vise f7, le point faible.'],
    ['Bc5', 'Les Noirs copient : leur fou vise f2.'],
    ['c3', 'Prépare d4 pour prendre le centre.'],
    ['Nf6', 'Les Noirs attaquent le pion e4.'],
    ['d3', 'Ce pion protège e4 calmement : c’est le « Giuoco Pianissimo », le jeu très tranquille.'],
    ['d6', 'Les Noirs protègent e5.'],
    ['O-O', 'Le roi est à l’abri. Ensuite : Re1, Nbd2, puis Nf1-g3 pour attaquer.'],
  ],
  londres: [
    ['d4', 'Le pion de la dame prend le centre.'],
    ['d5', 'Les Noirs bloquent.'],
    ['Bf4', 'Le fou sort AVANT de jouer e3. Sinon, il serait enfermé derrière ses pions.'],
    ['Nf6', ''],
    ['e3', 'Ce pion soutient d4 et ouvre la route au fou f1.'],
    ['e6', ''],
    ['Nf3', ''],
    ['c5', 'Les Noirs attaquent le centre.'],
    ['c3', 'La « pyramide » c3-d4-e3 : un centre très solide.'],
    ['Nc6', ''],
    ['Nbd2', 'Le cavalier va en d2 pour ne pas gêner le pion c3.'],
    ['Bd6', 'Les Noirs proposent d’échanger les fous.'],
    ['Bg3', 'Le fou recule mais reste sur sa diagonale. Ensuite : Bd3 et O-O.'],
  ],
  scandinave: [
    ['e4', ''],
    ['d5', 'La Scandinave : les Noirs attaquent tout de suite le pion e4.'],
    ['exd5', ''],
    ['Qxd5', 'La dame reprend le pion… mais elle sort tôt.'],
    ['Nc3', 'Le cavalier attaque la dame en se développant.'],
    ['Qa5', 'La dame se met à l’abri sur le côté, d’où elle cloue le cavalier c3.'],
    ['d4', ''],
    ['Nf6', ''],
    ['Nf3', ''],
    ['c6', 'Un pion solide, et une case de repli (c7) pour la dame.'],
    ['Bc4', ''],
    ['Bf5', 'Le fou sort AVANT e6, sinon il serait enfermé.'],
  ],
  espagnole: [
    ['e4', ''],
    ['e5', ''],
    ['Nf3', ''],
    ['Nc6', ''],
    ['Bb5', 'L’Espagnole : le fou attaque le cavalier qui défend e5.'],
    ['a6', 'Les Noirs demandent au fou ce qu’il compte faire.'],
    ['Ba4', 'Le fou garde la pression sur le cavalier.'],
    ['Nf6', 'Contre-attaque sur e4.'],
    ['O-O', 'Les Blancs roquent sans craindre pour e4.'],
    ['Be7', ''],
    ['Re1', 'La tour protège e4.'],
    ['b5', 'Les Noirs chassent enfin le fou.'],
    ['Bb3', 'De b3, le fou vise f7.'],
    ['d6', ''],
    ['c3', 'Prépare d4, et donne une case de repli (c2) au fou.'],
  ],
  gambitDame: [
    ['d4', ''],
    ['d5', ''],
    ['c4', 'Le Gambit dame : le pion c4 attaque d5. Si les Noirs le prennent, les Blancs le récupèrent presque toujours.'],
    ['e6', 'Les Noirs refusent le gambit et défendent d5 solidement.'],
    ['Nc3', 'Encore une attaque sur d5.'],
    ['Nf6', 'Et une défense de plus.'],
    ['Bg5', 'Le fou cloue le cavalier f6 : d5 est moins bien défendu.'],
    ['Be7', 'Les Noirs déclouent leur cavalier.'],
    ['e3', ''],
    ['O-O', ''],
    ['Nf3', 'Tout est développé. Les Blancs vont roquer à leur tour.'],
  ],
  sicilienne: [
    ['e4', ''],
    ['c5', 'La Sicilienne ! Les Noirs ne copient pas : ils attaquent la case d4 par le côté.'],
    ['Nf3', ''],
    ['d6', 'Contrôle e5 et prépare Nf6.'],
    ['d4', 'Les Blancs ouvrent le centre.'],
    ['cxd4', 'Un pion du bord contre un pion du centre : bonne affaire pour les Noirs.'],
    ['Nxd4', ''],
    ['Nf6', 'Attaque e4.'],
    ['Nc3', 'Défend e4.'],
    ['a6', 'La Najdorf, l’arme préférée de Fischer et de Kasparov. Ce petit coup contrôle b5 et prépare e5 ou b5.'],
  ],
};
const coupsDe = (o, depuis = 0) => OUVERTURES[o].slice(depuis).map(([c]) => c);
const notesDe = (o, depuis = 0) => OUVERTURES[o].slice(depuis).map(([, n]) => n);
const demo = (o, texte, orientation = 'w') => ({ type: 'explication', fen: DEPART, coups: coupsDe(o), notes: notesDe(o), texte, orientation });
// Rejouer l'ouverture de mémoire : les Blancs jouent depuis le départ, les Noirs après le premier coup blanc.
const memoire = (o, camp, texte) => ({
  type: 'exercice', ligne: true, texte,
  ...(camp === 'w' ? { fen: DEPART } : { apres: coupsDe(o).slice(0, 1) }),
  solution: coupsDe(o, camp === 'w' ? 0 : 1),
  notes: notesDe(o, camp === 'w' ? 0 : 1),
  bravo: 'Tu connais cette ouverture par cœur !',
});

export const COURS = [
  /* ---------- L'ouverture ---------- */
  {
    id: 'regles-or', chapitre: 'ouverture', niveau: 'debutant', piece: 'P', titre: 'Les 3 règles d’or',
    resume: 'Le centre, le développement et le roque.',
    etapes: [
      { type: 'explication', fen: DEPART, cases: [['d4', 'vert'], ['e4', 'vert'], ['d5', 'vert'], ['e5', 'vert']], fleches: [['e2', 'e4', 'vert'], ['d2', 'd4', 'vert']],
        texte: '<b>Règle n° 1 : prends le centre.</b> Les 4 cases du milieu sont les plus importantes. Une pièce au centre contrôle beaucoup de cases. Commence par avancer un pion du centre (e4 ou d4).' },
      { type: 'explication', fen: DEPART, fleches: [['g1', 'f3', 'bleu'], ['b1', 'c3', 'bleu'], ['f1', 'c4', 'bleu'], ['c1', 'f4', 'bleu']],
        texte: '<b>Règle n° 2 : sors tes pièces.</b> C’est le « développement ». Fais sortir tes cavaliers et tes fous dès le début. Évite de jouer deux fois la même pièce sans raison.' },
      { type: 'explication', fen: DEPART, coups: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3', 'O-O'],
        notes: ['Un pion prend le centre. Il libère aussi la dame et le fou.', 'Les Noirs font pareil.', 'Le cavalier sort et attaque le pion e5.', 'Les Noirs défendent e5 en sortant aussi un cavalier.', 'Le fou sort et vise f7, le point faible des Noirs.', 'Les Noirs sortent leur fou.', '<b>Règle n° 3 : roque !</b> Le roi est à l’abri et la tour entre en jeu.', 'Les Noirs continuent leur développement.', 'Ce pion protège e4 et ouvre la route au fou c1.', 'Les deux camps ont bien commencé.'],
        texte: 'Regarde une ouverture modèle. Avance coup par coup avec les flèches.' },
      { type: 'quiz', fen: DEPART, question: 'Quel est le meilleur premier coup ?', choix: ['a4 (pion du bord)', 'e4 (pion du centre)', 'h4 (pion du bord)'], bonne: 1, explication: 'e4 prend le centre et libère le fou et la dame. Les pions du bord ne servent presque à rien au début.' },
      { type: 'exercice', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', solution: ['Nf3'],
        erreurs: { Qh5: 'La dame sort trop tôt : elle va se faire chasser. Sors plutôt un cavalier !', Qg4: 'La dame sort trop tôt. Sors plutôt un cavalier !', Qf3: 'La dame sort trop tôt. Sors plutôt un cavalier !' },
        aide: 'Un cavalier peut attaquer e5 en un seul coup.', texte: 'Développe un cavalier qui attaque le pion e5.', bravo: 'Nf3 sort une pièce ET attaque un pion : deux bonnes choses en un coup !' },
      { type: 'exercice', fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['O-O'],
        aide: 'Déplace ton roi de deux cases vers la tour de droite.', texte: 'Ton cavalier et ton fou sont sortis. Mets maintenant ton roi à l’abri.', bravo: 'Le roque met le roi à l’abri et active la tour.' },
      { type: 'quiz', question: 'Faut-il sortir sa dame dès le début de la partie ?', choix: ['Oui, c’est la pièce la plus forte', 'Non, elle risque de se faire chasser'], bonne: 1, explication: 'Les pièces adverses attaquent la dame en se développant. Elle doit bouger sans arrêt et on perd du temps.' },
    ],
  },
  {
    id: 'pieges', chapitre: 'ouverture', niveau: 'debutant', piece: 'Q', titre: 'Les pièges d’ouverture',
    resume: 'Le coup du berger, le mat du sot et le piège de Légal.',
    etapes: [
      { type: 'quiz', fen: DEPART, cases: [['f7', 'rouge'], ['f2', 'rouge']], question: 'Au début de la partie, quel pion noir est le plus faible ?', choix: ['Le pion e7', 'Le pion f7', 'Le pion h7'], bonne: 1, explication: 'Le pion f7 n’est défendu que par le roi. Beaucoup de pièges visent cette case.' },
      { type: 'explication', fen: DEPART, coups: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'],
        notes: ['', '', 'Le fou vise f7…', '', '… et la dame aussi ! Elle menace Qxf7 mat.', 'Erreur ! Ce cavalier attaque la dame mais ne défend pas f7.', 'Échec et mat : c’est le coup du berger.'],
        texte: 'Le <b>coup du berger</b> : la dame et le fou attaquent ensemble le pion f7.' },
      { type: 'exercice', fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', solution: ['g6'], accepte: ['Qe7', 'Qf6'],
        erreurs: { Nf6: 'Non ! Qxf7 est mat. C’est le coup du berger !', Nh6: 'Le pion e5 tombe avec échec : Qxe5+.' },
        aide: 'Un pion peut chasser la dame.', texte: 'Tu as les Noirs. La dame et le fou visent f7 : défends-toi !', bravo: 'Bien défendu ! Le coup du berger ne marche plus. Avec g6, tu chasses même la dame blanche.' },
      { type: 'exercice', fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2', but: 'mat', solution: ['Qh4#'],
        aide: 'La dame noire peut viser le roi blanc par la diagonale e1-h4.', texte: 'Tu as les Noirs. Les Blancs ont avancé n’importe comment leurs pions f et g. Fais mat en un coup !', bravo: 'C’est le mat le plus rapide possible : 2 coups seulement ! On l’appelle le « mat du sot ».' },
      { type: 'explication', fen: DEPART, coups: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
        notes: ['', '', '', '', '', 'Le fou noir cloue le cavalier contre la dame.', '', 'Les Noirs jouent trop lentement.', 'Surprise : le cavalier se « décloue » et offre la dame !', 'Les Noirs prennent la dame…', 'Échec !', 'Le roi doit avancer.', 'Échec et mat avec 3 petites pièces : c’est le <b>piège de Légal</b>.'],
        texte: 'Le <b>piège de Légal</b> (1750) : un sacrifice de dame pour faire mat. Avance coup par coup.' },
    ],
  },

  /* ---------- Les ouvertures ---------- */
  {
    id: 'italienne', chapitre: 'repertoire', niveau: 'debutant', piece: 'B', titre: 'L’Italienne',
    resume: 'Avec les Blancs : l’ouverture la plus classique.',
    etapes: [
      demo('italienne', 'L’<b>Italienne</b> est jouée depuis plus de 400 ans. Elle suit les 3 règles d’or : centre, développement, roque. Regarde-la coup par coup.'),
      { type: 'quiz', apres: coupsDe('italienne').slice(0, 5), fleches: [['c4', 'f7', 'rouge']], question: 'Dans l’Italienne, que vise le fou c4 ?', choix: ['Le pion f7', 'La tour h8', 'Le cavalier c6'], bonne: 0, explication: 'f7 n’est défendu que par le roi : c’est la cible préférée du fou c4.' },
      memoire('italienne', 'w', 'À toi ! Joue l’Italienne avec les Blancs, de mémoire. L’adversaire répond comme dans la démonstration.'),
      { type: 'exercice', apres: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5'], solution: ['d5'],
        erreurs: { h6: 'Trop lent : Nxf7 attaque ta dame et ta tour !', Be7: 'Trop lent : Nxf7 attaque ta dame et ta tour !', d6: 'Trop lent : Nxf7 attaque ta dame et ta tour !', Qe7: 'Ta dame défend f7, mais elle bloque ton fou. Il y a mieux !', Bc5: 'C’est le gambit Traxler, très risqué ! Cherche plutôt à fermer la diagonale du fou c4.' },
        aide: 'Un pion peut se mettre entre le fou c4 et la case f7.', texte: 'Tu as les Noirs. Le cavalier g5 et le fou c4 attaquent tous les deux f7 ! Coupe la route du fou.',
        bravo: 'd5 bloque le fou blanc. C’est la meilleure défense contre cette attaque.' },
    ],
  },
  {
    id: 'londres', chapitre: 'repertoire', niveau: 'debutant', piece: 'B', titre: 'Le système de Londres',
    resume: 'Avec les Blancs : un plan simple, presque toujours le même.',
    etapes: [
      demo('londres', 'Le <b>système de Londres</b> commence par d4 et Bf4. Son avantage : on joue presque toujours les mêmes coups, quelle que soit la défense adverse.'),
      memoire('londres', 'w', 'Joue le système de Londres de mémoire. Souviens-toi : le fou sort AVANT e3 !'),
      { type: 'exercice', apres: ['d4', 'd5', 'Bf4', 'c5', 'e3', 'Qb6'], solution: ['Nc3'], accepte: ['Qc1', 'b3'],
        erreurs: { c3: 'Qxb2 : le pion b2 tombe gratuitement !', Bd3: 'Qxb2 : le pion b2 tombe et la tour a1 est menacée !' },
        aide: 'Un cavalier peut sortir et rendre la prise en b2 très dangereuse pour la dame noire.', texte: 'La dame noire attaque le pion b2, qui n’est plus défendu depuis que ton fou est sorti. Trouve le meilleur coup !',
        bravo: 'Bien vu. Après Nc3, si Qxb2, le cavalier saute en b5 et menace Nc7+ : la dame noire est en danger !' },
      { type: 'quiz', question: 'Pourquoi le système de Londres plaît-il aux joueurs de club ?', choix: ['On joue presque toujours les mêmes coups', 'Il fait mat en quelques coups', 'On sacrifie la dame'], bonne: 0, explication: 'Un plan simple et solide, avec peu de théorie à apprendre.' },
    ],
  },
  {
    id: 'scandinave', chapitre: 'repertoire', niveau: 'debutant', piece: 'Q', titre: 'La Scandinave',
    resume: 'Avec les Noirs contre 1.e4 : attaquer tout de suite.',
    etapes: [
      demo('scandinave', 'Contre 1.e4, la <b>Scandinave</b> (1…d5) attaque le pion e4 dès le premier coup. Une défense simple, idéale pour bien débuter avec les Noirs.', 'b'),
      { type: 'quiz', apres: coupsDe('scandinave').slice(0, 5), fleches: [['c3', 'd5', 'rouge']], question: 'Pourquoi la dame noire doit-elle bouger ?', choix: ['Le cavalier c3 l’attaque', 'Elle est en échec', 'Elle bloque le fou c8'], bonne: 0, explication: 'Le cavalier attaque la dame en se développant : les Blancs gagnent du temps. C’est le prix de la Scandinave.' },
      memoire('scandinave', 'b', 'Tu as les Noirs. Joue la Scandinave de mémoire !'),
    ],
  },
  {
    id: 'espagnole', chapitre: 'repertoire', niveau: 'intermediaire', piece: 'B', titre: 'L’Espagnole',
    resume: 'Avec les Blancs : la reine des ouvertures.',
    etapes: [
      demo('espagnole', 'L’<b>Espagnole</b> (ou « Ruy Lopez ») est jouée par tous les champions du monde. Le fou b5 met la pression sur le cavalier qui défend e5.'),
      { type: 'quiz', question: 'D’où vient le nom « Ruy Lopez » ?', choix: ['D’un prêtre espagnol qui l’a étudiée au XVIᵉ siècle', 'D’un champion du monde récent', 'D’une ville d’Espagne'], bonne: 0, explication: 'Ruy López de Segura l’a décrite dans un livre en 1561.' },
      memoire('espagnole', 'w', 'Joue l’Espagnole de mémoire. C’est long : 8 coups à retenir !'),
      { type: 'exercice', apres: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'Nxe5'], solution: ['Qd4', 'Nf3', 'Qxe4+'], accepte: ['Qg5'],
        aide: 'Ta dame peut attaquer le cavalier e5 et le pion e4 en même temps.', texte: 'Tu as les Noirs. Le cavalier blanc vient de prendre le pion e5… Erreur ! Trouve la fourchette de dame.',
        notes: ['La dame attaque le cavalier ET le pion e4.', 'Le cavalier se sauve…', ''],
        bravo: 'Tu récupères ton pion, et ta paire de fous sera très forte.' },
    ],
  },
  {
    id: 'gambit-dame', chapitre: 'repertoire', niveau: 'intermediaire', piece: 'P', titre: 'Le Gambit dame',
    resume: 'Avec les Blancs : attaquer le centre avec c4.',
    etapes: [
      demo('gambitDame', 'Le <b>Gambit dame</b> : après 1.d4 d5, le pion c4 attaque d5. C’est l’ouverture de la série « Le Jeu de la dame » !'),
      memoire('gambitDame', 'w', 'Joue le Gambit dame de mémoire.'),
      { type: 'exercice', apres: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5'], solution: ['Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'],
        notes: ['Le cavalier f6 n’était pas vraiment cloué !', 'Les Blancs prennent ta dame…', 'Échec !', 'La seule parade.', 'Tu reprends la dame, avec échec.', '', 'Bilan : tu as gagné une pièce !'],
        erreurs: { Kxd8: 'Bien vu, mais reprends d’abord la dame avec échec : le roi ira en d8 juste après !' },
        aide: 'Prends le cavalier d5 avec ton cavalier, même si ta dame est en prise.', texte: 'Le <b>piège de l’éléphant</b> ! Tu as les Noirs. Les Blancs croient gagner un pion, car ton cavalier f6 semble cloué. Punis-les !',
        bravo: 'Tu as gagné une pièce. Ce piège a fait tomber de très bons joueurs.' },
    ],
  },
  {
    id: 'sicilienne', chapitre: 'repertoire', niveau: 'avance', piece: 'N', titre: 'La Sicilienne',
    resume: 'Avec les Noirs contre 1.e4 : jouer pour gagner.',
    etapes: [
      demo('sicilienne', 'La <b>Sicilienne</b> (1…c5) est la défense la plus jouée contre 1.e4. Le jeu est déséquilibré : chaque camp joue pour gagner.', 'b'),
      { type: 'quiz', apres: coupsDe('sicilienne').slice(0, 7), cases: ['c8', 'c7', 'c6', 'c5', 'c4', 'c3', 'c2'].map((sq) => [sq, 'vert']), question: 'Après l’échange en d4, quelle colonne devient utile pour les Noirs ?', choix: ['La colonne c, sans pion noir', 'La colonne h', 'La colonne e'], bonne: 0, explication: 'Les Noirs placeront une tour sur la colonne c pour attaquer le côté dame des Blancs.' },
      memoire('sicilienne', 'b', 'Tu as les Noirs. Joue la Sicilienne Najdorf de mémoire !'),
      { type: 'quiz', question: 'Quel est l’avantage des Noirs après l’échange cxd4 ?', choix: ['Ils ont gardé leurs deux pions du centre (d et e)', 'Ils ont une pièce de plus', 'Le roi blanc ne peut plus roquer'], bonne: 0, explication: 'Les Noirs ont échangé un pion du bord contre un pion du centre : ils gardent d6 et e7 pour contrôler le centre.' },
    ],
  },

  /* ---------- Les tactiques ---------- */
  {
    id: 'en-prise', chapitre: 'tactique', niveau: 'debutant', piece: 'B', titre: 'Pièce en prise',
    resume: 'Compter les attaquants et les défenseurs.',
    etapes: [
      { type: 'explication', fen: '6k1/1p3ppp/2n5/4b3/8/5N2/5PPP/4R1K1 w - - 0 1', cases: [['e5', 'orange']], fleches: [['e1', 'e5', 'vert'], ['f3', 'e5', 'vert'], ['c6', 'e5', 'rouge']],
        texte: 'Une pièce est <b>en prise</b> quand elle est attaquée plus de fois qu’elle n’est défendue. Ici, le fou e5 est attaqué 2 fois (tour et cavalier) et défendu 1 seule fois (cavalier c6).' },
      { type: 'exercice', fen: '6k1/1p3ppp/2n5/4b3/8/5N2/5PPP/4R1K1 w - - 0 1', solution: ['Nxe5', 'Nxe5', 'Rxe5'],
        erreurs: { Rxe5: 'Tu gagnes le fou, mais tu perds ta tour (5) contre un cavalier (3). Prends d’abord avec la pièce qui vaut le moins !' },
        aide: 'Prends d’abord avec la pièce qui vaut le moins.', texte: 'Gagne une pièce ! Choisis bien avec quoi tu prends en premier.', bravo: 'Tu as gagné un fou. Règle : on prend d’abord avec la pièce la moins chère.' },
      { type: 'quiz', question: 'Un pion adverse attaque ton cavalier. Que fais-tu ?', choix: ['Rien, ce n’est qu’un pion', 'Je déplace mon cavalier ou je le défends'], bonne: 1, explication: 'Un pion qui prend un cavalier fait gagner 2 points à l’adversaire (3 − 1). Il faut réagir !' },
    ],
  },
  {
    id: 'fourchette', chapitre: 'tactique', niveau: 'debutant', piece: 'N', titre: 'La fourchette',
    resume: 'Attaquer deux pièces en même temps.',
    etapes: [
      { type: 'explication', fen: 'r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1', fleches: [['c7', 'e8', 'rouge'], ['c7', 'a8', 'rouge']],
        texte: 'Une <b>fourchette</b>, c’est une pièce qui en attaque deux en même temps. L’adversaire ne peut en sauver qu’une ! Le cavalier est le roi des fourchettes.' },
      { type: 'exercice', fen: 'r3k3/8/8/1N6/8/8/5PPP/6K1 w - - 0 1', solution: ['Nc7+', 'Kd7', 'Nxa8'],
        aide: 'Cherche une case d’où ton cavalier attaque le roi ET la tour.', texte: 'Gagne la tour noire avec une fourchette de cavalier.', bravo: 'Échec au roi et attaque sur la tour : la tour est perdue !' },
      { type: 'exercice', fen: '6k1/8/8/3n1n2/8/4P3/5PPP/R5K1 w - - 0 1', solution: ['e4', 'Nb6', 'exf5'],
        aide: 'Même un pion peut faire une fourchette.', texte: 'Les deux cavaliers noirs sont côte à côte. Un petit pion peut les attaquer tous les deux !', bravo: 'La fourchette de pion : un pion (1 point) attaque deux cavaliers (3 points chacun) !' },
      { type: 'exercice', fen: 'r5k1/8/8/8/8/8/8/3Q2K1 w - - 0 1', solution: ['Qd5+', 'Kh8', 'Qxa8+'],
        aide: 'La dame peut attaquer sur deux diagonales en même temps.', texte: 'La dame aussi fait des fourchettes. Gagne la tour !', bravo: 'Échec au roi par une diagonale, attaque de la tour par l’autre.' },
    ],
  },
  {
    id: 'clouage', chapitre: 'tactique', niveau: 'intermediaire', piece: 'B', titre: 'Le clouage',
    resume: 'Une pièce qui ne peut plus bouger.',
    etapes: [
      { type: 'explication', fen: '4k3/8/2n5/1B6/8/8/8/4K3 w - - 0 1', fleches: [['b5', 'e8', 'rouge']], cases: [['c6', 'orange']],
        texte: 'Le fou attaque le cavalier, et derrière le cavalier il y a le roi. Le cavalier est <b>cloué</b> : s’il bouge, son roi serait en échec. C’est interdit !' },
      { type: 'quiz', fen: '4k3/8/2n5/1B6/8/8/8/4K3 b - - 0 1', question: 'Les Noirs ont le droit de jouer leur cavalier c6 ?', choix: ['Oui', 'Non'], bonne: 1, explication: 'Une pièce clouée contre le roi ne peut pas bouger : cela mettrait son propre roi en échec.' },
      { type: 'exercice', fen: '6k1/6pp/4q3/8/8/1P6/5PPP/5BK1 w - - 0 1', solution: ['Bc4', 'Qxc4', 'bxc4'],
        erreurs: { Bd3: 'Ce fou n’attaque rien.' },
        aide: 'Mets ton fou sur la même diagonale que la dame et le roi noirs.', texte: 'La dame et le roi noirs sont sur la même diagonale. Cloue la dame !', bravo: 'La dame est clouée : elle ne peut pas fuir et tu la gagnes contre un fou !' },
      { type: 'exercice', fen: '4k3/3r4/8/8/8/8/8/3R1BK1 w - - 0 1', solution: ['Bb5', 'Ke7', 'Bxd7'], accepteFin: ['Rxd7+'],
        erreurs: { Rxd7: 'Tu échanges simplement les tours : le roi reprend. Cloue d’abord la tour noire !' },
        aide: 'La tour d7 et le roi e8 sont sur la même diagonale.', texte: 'Ta tour attaque la tour noire, mais le roi la défend. Cloue-la avec ton fou pour la gagner !',
        bravo: 'La tour clouée ne peut ni bouger ni prendre ta tour : elle est perdue !' },
    ],
  },
  {
    id: 'enfilade', chapitre: 'tactique', niveau: 'intermediaire', piece: 'R', titre: 'Enfilade et découverte',
    resume: 'Les attaques qui se cachent derrière une pièce.',
    etapes: [
      { type: 'explication', fen: '8/8/8/8/R2k3q/8/8/1K6 b - - 0 1', fleches: [['a4', 'd4', 'rouge'], ['d4', 'h4', 'orange']],
        texte: 'L’<b>enfilade</b>, c’est le contraire du clouage : la pièce la plus forte est devant. Le roi doit fuir… et la dame derrière lui est perdue.' },
      { type: 'exercice', fen: '8/8/8/8/3k3q/8/8/RK6 w - - 0 1', solution: ['Ra4+', 'Ke5', 'Rxh4'],
        aide: 'Mets ta tour sur la même rangée que le roi et la dame.', texte: 'Le roi et la dame noirs sont sur la même rangée. Gagne la dame !', bravo: 'Le roi doit s’écarter, et ta tour prend la dame.' },
      { type: 'explication', fen: '3q3k/8/8/4N3/8/8/1B6/6K1 w - - 0 1', fleches: [['b2', 'h8', 'bleu']], cases: [['e5', 'orange']],
        texte: 'L’<b>attaque à la découverte</b> : le cavalier est devant le fou. S’il bouge, le fou fait échec au roi noir… et le cavalier peut attaquer autre chose en même temps !' },
      { type: 'exercice', fen: '3q3k/8/8/4N3/8/8/1B6/6K1 w - - 0 1', solution: ['Nf7+', 'Kg8', 'Nxd8'], accepte: ['Nc6+'],
        aide: 'Déplace le cavalier sur une case d’où il attaque la dame.', texte: 'Déplace ton cavalier pour faire échec avec le fou… et gagne la dame !',
        bravo: 'Le roi noir doit parer l’échec : la dame est perdue. Nf7 fait même un « double échec » !' },
    ],
  },

  /* ---------- Les mats types ---------- */
  {
    id: 'couloir', chapitre: 'mats', niveau: 'debutant', piece: 'R', titre: 'Le mat du couloir',
    resume: 'Le roi est enfermé derrière ses pions.',
    etapes: [
      { type: 'explication', fen: '3R2k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', fleches: [['d8', 'g8', 'rouge']], cases: [['f7', 'orange'], ['g7', 'orange'], ['h7', 'orange']],
        texte: 'Le roi a roqué et ses trois pions sont restés devant lui. Ils l’enferment ! Une tour ou une dame sur la dernière rangée fait mat.' },
      { type: 'exercice', fen: '6k1/2q2ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', but: 'mat', solution: ['Re8#'],
        texte: 'Fais mat en un coup.', bravo: 'Le mat du couloir !' },
      { type: 'exercice', fen: '2rr2k1/5ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1', but: 'mat', solution: ['Rxd8+', 'Rxd8', 'Rxd8#'],
        aide: 'Tes deux tours sont l’une derrière l’autre : la deuxième finit le travail.', texte: 'Mat en 2 coups ! Les Noirs ont deux tours pour défendre, toi aussi.', bravo: 'La première tour se sacrifie, la deuxième fait mat.' },
      { type: 'quiz', question: 'Comment éviter le mat du couloir ?', choix: ['Avancer un pion devant le roi (h3 ou g3) pour lui faire une « fenêtre »', 'Ne jamais roquer', 'Avancer tous ses pions'], bonne: 0, explication: 'Une « fenêtre » (ou « luft ») donne une case de fuite au roi.' },
    ],
  },
  {
    id: 'mats-dame', chapitre: 'mats', niveau: 'debutant', piece: 'Q', titre: 'Le baiser de la mort',
    resume: 'La dame collée au roi, protégée par une autre pièce.',
    etapes: [
      { type: 'explication', fen: '6k1/5pQp/6P1/8/8/8/8/6K1 b - - 0 1', fleches: [['g6', 'g7', 'vert']], cases: [['g7', 'rouge']],
        texte: 'Le <b>baiser de la mort</b> : la dame se colle au roi. Il ne peut pas la prendre, car elle est protégée.' },
      { type: 'exercice', fen: '6k1/5p1p/8/8/3Q4/8/1B6/6K1 w - - 0 1', but: 'mat', solution: ['Qg7#'],
        aide: 'Ton fou b2 et ta dame sont sur la même grande diagonale.', texte: 'Fais mat en un coup avec l’aide du fou.', bravo: 'La dame est protégée par le fou : mat !' },
      { type: 'exercice', fen: '5rk1/5ppp/8/6NQ/8/8/8/6K1 w - - 0 1', but: 'mat', solution: ['Qxh7#'],
        aide: 'Le cavalier g5 attaque la case h7.', texte: 'Ta dame et ton cavalier visent la même case. Fais mat !', bravo: 'La dame est protégée par le cavalier : mat !' },
    ],
  },
  {
    id: 'etouffe', chapitre: 'mats', niveau: 'intermediaire', piece: 'N', titre: 'Le mat à l’étouffée',
    resume: 'Le roi étouffé par ses propres pièces.',
    etapes: [
      { type: 'explication', fen: '6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1', fleches: [['f7', 'h8', 'rouge']],
        texte: 'Le roi est entouré de ses propres pièces : il « étouffe ». Un seul cavalier suffit pour faire mat !' },
      { type: 'quiz', question: 'Pourquoi ce mat s’appelle-t-il « à l’étouffée » ?', choix: ['Le roi est entouré de ses propres pièces', 'Le roi est attaqué par la dame', 'La partie a duré trop longtemps'], bonne: 0, explication: 'Ses propres pièces lui prennent toutes les cases de fuite.' },
      { type: 'exercice', fen: '3r3k/6pp/7N/8/2Q5/8/6PP/6K1 w - - 0 1', but: 'mat', solution: ['Qg8+', 'Rxg8', 'Nf7#'],
        erreurs: { Nf7: 'Échec, mais le roi s’échappe en g8.' },
        aide: 'Sacrifie ta dame sur g8 : la tour devra la prendre et bouchera la dernière case du roi.', texte: 'Mat en 2 coups. Il faut oser !', bravo: 'Le sacrifice de dame de Philidor : la tour bouche la case g8, et le cavalier fait mat.' },
    ],
  },

  /* ---------- Les finales ---------- */
  {
    id: 'escalier', chapitre: 'finales', niveau: 'debutant', piece: 'R', titre: 'Le mat de l’escalier',
    resume: 'Deux tours contre un roi seul.',
    etapes: [
      { type: 'explication', fen: '4k2R/R7/8/8/8/8/8/4K3 b - - 0 1', fleches: [['a7', 'h7', 'bleu'], ['h8', 'e8', 'rouge']],
        texte: 'Une tour coupe le roi (il ne peut pas traverser sa rangée), l’autre fait échec. Puis elles montent chacune leur tour, comme un <b>escalier</b>, jusqu’au bord.' },
      { type: 'finale', fen: '8/8/8/4k3/8/8/8/R3K2R w - - 0 1', but: 'mat', limite: 8,
        texte: 'À toi contre Stockfish ! Fais mat avec tes deux tours. Attention : si le roi noir s’approche d’une tour, éloigne-la !' },
    ],
  },
  {
    id: 'roi-dame', chapitre: 'finales', niveau: 'intermediaire', piece: 'Q', titre: 'Mat roi et dame',
    resume: 'La dame fait la boîte, le roi vient aider.',
    etapes: [
      { type: 'explication', fen: '8/8/8/2k5/8/3Q4/8/4K3 w - - 0 1', cases: [['a6', 'bleu'], ['b6', 'bleu'], ['c6', 'bleu'], ['d6', 'bleu'], ['a5', 'bleu'], ['b5', 'bleu'], ['a4', 'bleu'], ['b4', 'bleu'], ['c4', 'bleu']],
        texte: 'Joue ta dame à un saut de cavalier du roi noir : elle l’enferme dans une <b>boîte</b> qui rétrécit à chaque coup. Quand il est au bord, amène ton roi pour protéger la dame.' },
      { type: 'quiz', fen: '7k/8/5QK1/8/8/8/8/8 w - - 0 1', question: 'Les Blancs jouent Qf7. Que se passe-t-il ?', choix: ['Échec et mat', 'Pat : partie nulle !', 'Le roi noir s’échappe'], bonne: 1, explication: 'Le roi noir n’est pas en échec mais ne peut plus bouger : pat ! Il fallait jouer Qf8# ou Qd8#.' },
      { type: 'finale', fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1', but: 'mat', limite: 11,
        texte: 'Fais mat contre Stockfish avec ton roi et ta dame. Attention au pat !' },
    ],
  },
  {
    id: 'roi-tour', chapitre: 'finales', niveau: 'intermediaire', piece: 'R', titre: 'Mat roi et tour',
    resume: 'Plus long : il faut l’opposition des rois.',
    etapes: [
      { type: 'explication', fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1', fleches: [['a1', 'a8', 'rouge']], cases: [['e6', 'vert'], ['e8', 'vert']],
        texte: 'Avec une seule tour, le roi doit aider : pousse le roi noir vers le bord. Quand les deux rois sont face à face (c’est l’<b>opposition</b>), la tour fait échec sur la rangée : mat !' },
      { type: 'exercice', fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1', but: 'mat', solution: ['Ra8#'], texte: 'Les rois sont face à face. Fais mat !', bravo: 'Le roi blanc garde les cases d7, e7 et f7, la tour s’occupe de la dernière rangée.' },
      { type: 'finale', fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', but: 'mat', limite: 20,
        texte: 'À toi contre Stockfish ! Mat avec roi et tour. C’est long : sois patient et ne laisse pas ta tour se faire prendre.' },
    ],
  },
  {
    id: 'carre', chapitre: 'finales', niveau: 'avance', piece: 'P', titre: 'La règle du carré',
    resume: 'Le roi peut-il rattraper le pion ?',
    etapes: [
      { type: 'explication', fen: '8/8/8/8/P4k2/8/8/7K b - - 0 1',
        cases: ['a8', 'b8', 'c8', 'd8', 'e8', 'a7', 'b7', 'c7', 'd7', 'e7', 'a6', 'b6', 'c6', 'd6', 'e6', 'a5', 'b5', 'c5', 'd5', 'e5', 'a4', 'b4', 'c4', 'd4', 'e4'].map((sq) => [sq, 'bleu']),
        texte: 'Trace un <b>carré</b> du pion jusqu’à sa case de promotion. Si le roi peut entrer dans le carré, il rattrape le pion. Sinon, le pion va à dame !' },
      { type: 'quiz', fen: '8/8/8/8/P4k2/8/8/7K w - - 0 1', question: 'Cette fois, ce sont les Blancs qui jouent. Le roi noir peut-il rattraper le pion ?', choix: ['Oui', 'Non'], bonne: 1, explication: 'Après a5, le carré devient a5-d5-d8-a8 : le roi f4 ne peut plus y entrer. Le pion ira à dame.' },
      { type: 'finale', fen: '8/8/8/8/P4k2/8/8/7K b - - 0 1', but: 'capture', limite: 5,
        texte: 'Tu as les Noirs et c’est à toi. Entre dans le carré et prends le pion blanc !' },
    ],
  },
  {
    id: 'opposition', chapitre: 'finales', niveau: 'avance', piece: 'K', titre: 'Roi et pion : l’opposition',
    resume: 'Mener son pion à dame sans faire pat.',
    etapes: [
      { type: 'explication', fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 0 1', cases: [['e6', 'vert'], ['e8', 'vert']],
        texte: 'Les deux rois sont face à face, avec une case entre eux : c’est l’<b>opposition</b>. Celui qui doit jouer doit céder le passage. Ici, le roi noir doit s’écarter et le roi blanc avance.' },
      { type: 'quiz', fen: '4k3/4P3/4K3/8/8/8/8/8 b - - 0 1', question: 'Les Noirs doivent jouer. Que se passe-t-il ?', choix: ['Échec et mat', 'Pat : partie nulle', 'Les Noirs prennent le pion'], bonne: 1, explication: 'Le roi noir n’est pas en échec mais ne peut aller nulle part : pat ! Le pion a avancé trop vite. Le roi blanc doit passer DEVANT son pion.' },
      { type: 'finale', fen: '4k3/8/3K4/4P3/8/8/8/8 w - - 0 1', but: 'promotion', limite: 6,
        texte: 'Mène ton pion à dame contre Stockfish. Indice : mets ton roi DEVANT ton pion, ne pousse pas le pion trop vite !' },
    ],
  },

  /* ---------- La stratégie ---------- */
  {
    id: 'tours', chapitre: 'strategie', niveau: 'avance', piece: 'R', titre: 'Bien placer ses tours',
    resume: 'Colonnes ouvertes et 7ᵉ rangée.',
    etapes: [
      { type: 'explication', fen: 'r4rk1/pp3ppp/2p5/4p3/4P3/2P5/PP3PPP/R4RK1 w - - 0 1', cases: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'].map((sq) => [sq, 'vert']),
        texte: 'Une <b>colonne ouverte</b> n’a plus aucun pion. C’est une autoroute pour les tours ! Ici, la colonne d est ouverte.' },
      { type: 'exercice', fen: 'r4rk1/pp3ppp/2p5/4p3/4P3/2P5/PP3PPP/R4RK1 w - - 0 1', solution: ['Rfd1'], accepte: ['Rad1'],
        aide: 'Une de tes tours peut aller sur la colonne d en un coup.', texte: 'Place une tour sur la colonne ouverte avant les Noirs.', bravo: 'Ta tour contrôle toute la colonne. Bientôt, elle entrera dans le camp adverse.' },
      { type: 'exercice', fen: 'r5k1/pp3ppp/2p5/4p3/4P3/2P5/PP3PPP/3R2K1 w - - 0 1', solution: ['Rd7'],
        erreurs: { 'Rd8+': 'La tour noire te prend : Rxd8.' },
        aide: 'Les pions noirs sont sur la 7ᵉ rangée…', texte: 'Ta tour est maîtresse de la colonne d. Entre dans le camp adverse !', bravo: 'Une tour sur la 7ᵉ rangée attaque tous les pions qui n’ont pas encore avancé (ici b7 et f7).' },
      { type: 'quiz', question: 'Où une tour est-elle la plus forte ?', choix: ['Dans un coin, derrière ses pions', 'Sur une colonne ouverte ou sur la 7ᵉ rangée', 'Au milieu de ses propres pions'], bonne: 1, explication: 'La tour a besoin de lignes ouvertes. Enfermée derrière ses pions, elle ne sert à rien.' },
    ],
  },
  {
    id: 'pieces-actives', chapitre: 'strategie', niveau: 'avance', piece: 'N', titre: 'Bons et mauvais cavaliers',
    resume: 'Un cavalier au centre vaut plus qu’au bord.',
    etapes: [
      { type: 'explication', fen: '8/8/8/3N4/8/8/8/N7 w - - 0 1',
        fleches: [['d5', 'c7', 'vert'], ['d5', 'e7', 'vert'], ['d5', 'f6', 'vert'], ['d5', 'f4', 'vert'], ['d5', 'e3', 'vert'], ['d5', 'c3', 'vert'], ['d5', 'b4', 'vert'], ['d5', 'b6', 'vert'], ['a1', 'b3', 'rouge'], ['a1', 'c2', 'rouge']],
        texte: '« Cavalier au bord, cavalier mort ! » Au centre, le cavalier contrôle 8 cases. Dans un coin, il n’en contrôle que 2.' },
      { type: 'quiz', question: 'Combien de cases contrôle un cavalier dans le coin a1 ?', choix: ['2', '4', '8'], bonne: 0, explication: 'Seulement b3 et c2. Un cavalier au bord perd la moitié de sa force.' },
      { type: 'exercice', fen: '4k3/pp3ppp/8/8/8/N7/PP3PPP/4K3 w - - 0 1', solution: ['Nc4'], accepte: ['Nb5'],
        erreurs: { Nb1: 'Ton cavalier recule et reste dans un coin.', Nc2: 'Ton cavalier recule : vise plutôt le centre, vers l’avant.' },
        aide: 'Cherche une case plus proche du centre.', texte: 'Ton cavalier a3 est au bord. Rapproche-le du centre en un coup !', bravo: 'Ton cavalier contrôle maintenant beaucoup plus de cases.' },
    ],
  },
];

// Nombre maximum d'étoiles d'un cours (3 par étape notée : les explications ne comptent pas).
export const etoilesMaxCours = (cours) => cours.etapes.filter((e) => e.type !== 'explication').length * 3;
