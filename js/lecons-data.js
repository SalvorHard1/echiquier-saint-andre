// Contenu du parcours « Pas à pas » : les règles de base, en petites étapes.
// Types d'étapes :
//  - etoiles : ramasser les étoiles (et prendre les pièces noires) avec la pièce blanche, en un minimum de coups
//  - coup    : trouver le coup demandé (but : echec, mat, roque, enpassant, promotion, parer)
//  - quiz    : question à choix multiple
// Les positions sont en notation FEN.

export const CHAPITRES = [
  { id: 'pieces', nom: 'Les pièces', desc: 'Comment se déplace chaque pièce.' },
  { id: 'prendre', nom: 'Prendre', desc: 'Capturer et connaître la valeur des pièces.' },
  { id: 'speciaux', nom: 'Les coups spéciaux', desc: 'Roque, promotion et prise en passant.' },
  { id: 'mat', nom: 'Échec et mat', desc: 'Attaquer le roi et gagner la partie.' },
];

export const LECONS = [
  {
    id: 'but', chapitre: 'pieces', piece: 'K', titre: 'Le but du jeu',
    intro: 'Deux armées s’affrontent : les Blancs et les Noirs. Chacun a 16 pièces. Le but ? Capturer… le roi adverse ! On dit qu’on le met « échec et mat ».',
    etapes: [
      { type: 'quiz', question: 'Comment gagne-t-on une partie d’échecs ?', choix: ['En prenant toutes les pièces adverses', 'En mettant le roi adverse échec et mat', 'En arrivant de l’autre côté de l’échiquier'], bonne: 1, explication: 'On gagne quand le roi adverse est attaqué et ne peut plus s’échapper : c’est l’échec et mat.' },
      { type: 'quiz', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', question: 'Qui joue le premier coup ?', choix: ['Les Blancs', 'Les Noirs', 'On tire au sort'], bonne: 0, explication: 'Ce sont toujours les Blancs qui commencent.' },
      { type: 'quiz', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', question: 'Comment doit-on placer l’échiquier ?', choix: ['Une case blanche en bas à droite', 'Une case noire en bas à droite', 'Peu importe'], bonne: 0, explication: 'Retiens « blanc à droite » : chaque joueur a une case blanche dans son coin droit.' },
      { type: 'quiz', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', question: 'Au départ, où se trouve la dame blanche ?', choix: ['Sur la case de sa couleur (d1)', 'À droite du roi', 'N’importe où sur la première rangée'], bonne: 0, explication: 'La dame aime sa couleur : dame blanche sur case blanche (d1), dame noire sur case noire (d8).' },
    ],
  },
  {
    id: 'tour', chapitre: 'pieces', piece: 'R', titre: 'La tour',
    intro: 'La tour se déplace en ligne droite : vers le haut, le bas, la gauche ou la droite, d’autant de cases qu’elle veut. Ramasse toutes les étoiles !',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/R7 w - - 0 1', etoiles: ['a7'], texte: 'Amène la tour sur l’étoile.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/R7 w - - 0 1', etoiles: ['a8', 'h8', 'h1'], texte: 'Ramasse les 3 étoiles en un minimum de coups.' },
      { type: 'etoiles', fen: '8/8/8/8/8/2R5/8/8 w - - 0 1', etoiles: ['c7', 'g7', 'g2', 'b2'], texte: 'Fais le tour de l’échiquier !' },
      { type: 'etoiles', fen: '8/2P5/8/8/8/8/P7/R6P w - - 0 1', piece: 'a1', etoiles: ['b8', 'g1', 'g7'], texte: 'Tes pions bloquent le chemin : la tour ne peut pas sauter par-dessus.' },
    ],
  },
  {
    id: 'fou', chapitre: 'pieces', piece: 'B', titre: 'Le fou',
    intro: 'Le fou se déplace en diagonale, d’autant de cases qu’il veut. Il reste toujours sur la même couleur de case !',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/2B5 w - - 0 1', etoiles: ['h6'], texte: 'Amène le fou sur l’étoile.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/2B5 w - - 0 1', etoiles: ['a3', 'd6', 'f8'], texte: 'Ramasse les 3 étoiles.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/5B2 w - - 0 1', etoiles: ['b5', 'd7', 'h3', 'e6'], texte: 'Zigzag en diagonale !' },
    ],
  },
  {
    id: 'dame', chapitre: 'pieces', piece: 'Q', titre: 'La dame',
    intro: 'La dame est la pièce la plus puissante : elle se déplace comme une tour ET comme un fou, dans toutes les directions.',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/3Q4 w - - 0 1', etoiles: ['d7', 'h3', 'a3'], texte: 'Ramasse les étoiles avec la dame.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/Q7 w - - 0 1', etoiles: ['g7', 'b2', 'h2', 'h8', 'e5'], texte: 'Lignes droites ou diagonales : à toi de choisir le plus court chemin.' },
    ],
  },
  {
    id: 'roi', chapitre: 'pieces', piece: 'K', titre: 'Le roi',
    intro: 'Le roi est la pièce la plus importante… mais il est lent : il se déplace d’une seule case, dans n’importe quelle direction.',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/4K3 w - - 0 1', etoiles: ['e3'], texte: 'Amène le roi sur l’étoile, case par case.' },
      { type: 'etoiles', fen: '8/8/8/8/3K4/8/8/8 w - - 0 1', etoiles: ['f6', 'b6', 'd2'], texte: 'Ramasse les étoiles. Pense aux diagonales pour aller plus vite !' },
    ],
  },
  {
    id: 'cavalier', chapitre: 'pieces', piece: 'N', titre: 'Le cavalier',
    intro: 'Le cavalier se déplace en « L » : deux cases dans une direction, puis une case sur le côté. C’est la seule pièce qui peut sauter par-dessus les autres !',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/1N6 w - - 0 1', etoiles: ['c3', 'e4'], texte: 'Saute sur les étoiles.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/6N1 w - - 0 1', etoiles: ['f3', 'g5', 'e6'], texte: 'Continue à sauter !' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/PPPP4/1N6 w - - 0 1', piece: 'b1', etoiles: ['c3', 'd5', 'f6'], texte: 'Le cavalier saute par-dessus les pions.' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/8/N7 w - - 0 1', etoiles: ['b1'], texte: 'Défi : va sur la case b1, juste à côté… Ce n’est pas si simple pour un cavalier !' },
    ],
  },
  {
    id: 'pion', chapitre: 'pieces', piece: 'P', titre: 'Le pion',
    intro: 'Le pion avance tout droit, d’une case. Pour son tout premier déplacement, il peut avancer de deux cases. Il ne recule jamais !',
    etapes: [
      { type: 'etoiles', fen: '8/8/8/8/8/8/4P3/8 w - - 0 1', etoiles: ['e4'], texte: 'Premier coup : le pion peut avancer de deux cases !' },
      { type: 'etoiles', fen: '8/8/8/8/8/8/3P4/8 w - - 0 1', etoiles: ['d3', 'd5'], texte: 'Ramasse les deux étoiles.' },
      { type: 'etoiles', fen: '8/8/8/5p2/4P3/8/8/8 w - - 0 1', etoiles: [], texte: 'Le pion avance tout droit, mais il PREND en diagonale. Prends le pion noir !' },
      { type: 'etoiles', fen: '8/7p/6p1/5p2/4P3/8/8/8 w - - 0 1', etoiles: [], texte: 'Prends tous les pions noirs, l’un après l’autre.' },
    ],
  },
  {
    id: 'prise', chapitre: 'prendre', piece: 'R', titre: 'Capturer',
    intro: 'Pour prendre une pièce adverse, on va sur sa case : elle est retirée de l’échiquier. Prends toutes les pièces noires !',
    etapes: [
      { type: 'etoiles', fen: '8/8/p4p2/8/8/8/5p2/R7 w - - 0 1', etoiles: [], texte: 'La tour a faim : prends les 3 pions.' },
      { type: 'etoiles', fen: '3r4/8/1n6/8/8/4n3/8/2B5 w - - 0 1', etoiles: [], texte: 'Avec le fou, prends toutes les pièces noires.' },
      { type: 'etoiles', fen: '8/8/3b4/8/1n6/8/7p/3Q4 w - - 0 1', etoiles: [], texte: 'La dame fait le ménage !' },
      { type: 'etoiles', fen: '8/8/8/3p4/2p5/4p3/8/1N6 w - - 0 1', etoiles: [], texte: 'Le cavalier aussi sait prendre.' },
    ],
  },
  {
    id: 'valeur', chapitre: 'prendre', piece: 'Q', titre: 'La valeur des pièces',
    intro: 'Toutes les pièces ne se valent pas ! On compte en « pions » : pion = 1, cavalier = 3, fou = 3, tour = 5, dame = 9. Le roi n’a pas de prix : sans lui, on perd.',
    etapes: [
      { type: 'quiz', question: 'Combien vaut une tour ?', choix: ['3 pions', '5 pions', '9 pions'], bonne: 1, explication: 'Une tour vaut 5 pions.' },
      { type: 'quiz', question: 'Quelle pièce vaut le plus (à part le roi) ?', choix: ['La tour', 'La dame', 'Le cavalier'], bonne: 1, explication: 'La dame vaut 9 pions : c’est la pièce la plus forte.' },
      { type: 'quiz', question: 'Un fou vaut à peu près autant que…', choix: ['Un pion', 'Un cavalier', 'Une dame'], bonne: 1, explication: 'Fou et cavalier valent tous les deux environ 3 pions.' },
      { type: 'quiz', question: 'Tu peux prendre une tour adverse, mais tu perdras ton cavalier. Bonne affaire ?', choix: ['Oui : je gagne 5 et je perds 3', 'Non : c’est un mauvais échange'], bonne: 0, explication: 'Tu gagnes 5 et tu perds 3 : tu es gagnant de 2 points.' },
    ],
  },
  {
    id: 'roque', chapitre: 'speciaux', piece: 'K', titre: 'Le roque',
    intro: 'Le roque met ton roi à l’abri en un seul coup : le roi se déplace de DEUX cases vers une tour, et la tour saute de l’autre côté du roi. Pour roquer, déplace simplement ton roi de deux cases.',
    etapes: [
      { type: 'coup', fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1', but: 'roque', cote: 'k', texte: 'Fais le petit roque : déplace ton roi de deux cases vers la tour de droite.' },
      { type: 'coup', fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', but: 'roque', cote: 'q', texte: 'Maintenant le grand roque : deux cases vers la tour de gauche.' },
      { type: 'quiz', fen: '4r1k1/8/8/8/8/8/8/4K2R w K - 0 1', question: 'Ton roi est attaqué par la tour noire. As-tu le droit de roquer ?', choix: ['Oui', 'Non'], bonne: 1, explication: 'On ne peut pas roquer quand on est en échec. Il faut d’abord parer l’échec.' },
      { type: 'quiz', question: 'Ton roi a déjà bougé puis il est revenu sur sa case. Peux-tu encore roquer ?', choix: ['Oui, il est revenu', 'Non, jamais'], bonne: 1, explication: 'Si le roi (ou la tour) a déjà bougé une seule fois, le roque n’est plus possible.' },
    ],
  },
  {
    id: 'promotion', chapitre: 'speciaux', piece: 'P', titre: 'La promotion',
    intro: 'Quand un pion arrive tout au bout de l’échiquier, il se transforme ! On choisit une dame, une tour, un fou ou un cavalier. Le plus souvent : une dame.',
    etapes: [
      { type: 'coup', fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', but: 'promotion', texte: 'Avance ton pion jusqu’au bout et choisis ta nouvelle pièce.' },
      { type: 'coup', fen: '1r2k3/2P5/8/8/8/8/8/4K3 w - - 0 1', but: 'promotion', prise: true, texte: 'Le pion peut aussi se promouvoir en prenant : prends la tour en diagonale !' },
    ],
  },
  {
    id: 'enpassant', chapitre: 'speciaux', piece: 'P', titre: 'La prise en passant',
    intro: 'Une règle surprenante ! Si un pion adverse avance de deux cases et arrive juste à côté de ton pion, tu peux le prendre comme s’il n’avait avancé que d’une case. Attention : seulement au coup juste après !',
    etapes: [
      { type: 'coup', fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', dernier: { from: 'd7', to: 'd5' }, but: 'enpassant', texte: 'Le pion noir vient de sauter de d7 à d5. Prends-le en passant avec ton pion e5 : va en d6 !' },
      { type: 'coup', fen: '4k3/8/8/1Pp5/8/8/8/4K3 w - c6 0 1', dernier: { from: 'c7', to: 'c5' }, but: 'enpassant', texte: 'À toi : prends le pion noir en passant.' },
    ],
  },
  {
    id: 'echec', chapitre: 'mat', piece: 'R', titre: 'L’échec',
    intro: 'Quand une pièce attaque le roi adverse, on dit que le roi est « en échec ». Mets le roi noir en échec !',
    etapes: [
      { type: 'coup', fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', but: 'echec', texte: 'Attaque le roi noir avec ta tour.' },
      { type: 'coup', fen: '4k3/8/8/8/8/8/8/4KB2 w - - 0 1', but: 'echec', texte: 'Fais échec avec ton fou.' },
      { type: 'coup', fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1', but: 'echec', texte: 'Fais échec avec ton cavalier.' },
    ],
  },
  {
    id: 'parer', chapitre: 'mat', piece: 'K', titre: 'Sortir de l’échec',
    intro: 'Quand ton roi est en échec, tu DOIS le sauver tout de suite. Il y a 3 façons : déplacer le roi, prendre la pièce qui attaque, ou se mettre entre les deux.',
    etapes: [
      { type: 'coup', fen: '4k3/8/8/8/8/8/8/r3K3 w - - 0 1', but: 'parer', methode: 'fuir', texte: 'La tour noire attaque ton roi : mets-le à l’abri en le déplaçant.' },
      { type: 'coup', fen: '4k3/8/8/8/1b6/8/8/1R2K3 w - - 0 1', but: 'parer', methode: 'prendre', texte: 'Le fou noir fait échec : prends-le avec ta tour !' },
      { type: 'coup', fen: '4k3/8/8/8/8/4B3/8/r3K3 w - - 0 1', but: 'parer', methode: 'bloquer', texte: 'Mets une pièce entre la tour et ton roi pour bloquer l’échec.' },
    ],
  },
  {
    id: 'mat1', chapitre: 'mat', piece: 'Q', titre: 'Échec et mat',
    intro: 'Échec et mat : le roi est en échec et n’a AUCUN moyen de s’en sortir. La partie est gagnée ! Trouve le mat en un coup.',
    etapes: [
      { type: 'coup', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', but: 'mat', texte: 'Le roi noir est coincé derrière ses pions. Fais mat !' },
      { type: 'coup', fen: '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1', but: 'mat', texte: 'Ton roi aide ta dame : fais mat !' },
      { type: 'coup', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', but: 'mat', texte: 'Le célèbre « coup du berger » : fais mat en un coup.' },
      { type: 'coup', fen: '7k/5K2/8/8/8/8/8/6Q1 w - - 0 1', but: 'mat', texte: 'Fais mat… mais attention au piège du PAT !' },
    ],
  },
  {
    id: 'pat', chapitre: 'mat', piece: 'K', titre: 'Mat ou pat ?',
    intro: 'Le PAT : le joueur qui doit jouer n’est pas en échec, mais il ne peut faire aucun coup. La partie est alors NULLE ! Attention à ne pas offrir le pat quand tu gagnes.',
    etapes: [
      { type: 'quiz', fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', question: 'Les Noirs doivent jouer. Qu’est-ce que c’est ?', choix: ['Échec et mat', 'Pat (partie nulle)', 'Rien de spécial'], bonne: 0, explication: 'Le roi noir est en échec par la dame (protégée par le roi blanc) et ne peut aller nulle part : mat !' },
      { type: 'quiz', fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', question: 'Les Noirs doivent jouer. Qu’est-ce que c’est ?', choix: ['Échec et mat', 'Pat (partie nulle)', 'Rien de spécial'], bonne: 1, explication: 'Le roi noir n’est pas en échec, mais toutes les cases autour sont attaquées : c’est pat, partie nulle.' },
      { type: 'quiz', fen: '6k1/8/6K1/8/8/8/8/R7 b - - 0 1', question: 'Les Noirs doivent jouer. Qu’est-ce que c’est ?', choix: ['Échec et mat', 'Pat (partie nulle)', 'Rien de spécial'], bonne: 2, explication: 'Le roi noir n’est pas en échec et peut encore bouger (f8 ou h8) : la partie continue.' },
    ],
  },
];

// Nombre maximum d'étoiles d'une leçon (3 par étape).
export const etoilesMax = (lecon) => lecon.etapes.length * 3;
