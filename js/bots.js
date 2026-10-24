// Niveaux des bots. Les Elo sont des estimations.
// skill : « Skill Level » de Stockfish (0 à 20)
// depth / movetime : profondeur de calcul ou temps de réflexion (ms)
// hasard : probabilité de jouer un coup au hasard (pour les petits niveaux)
// camp : couleur de la pièce de l'avatar ('b' pour la distinguer d'un bot plus faible qui a la même pièce)
export const BOTS = [
  { id: 'pion',      nom: 'Pion',      piece: 'P', elo: '≈ 400',  niveau: 'Grand débutant', desc: 'Connaît les règles… et c’est à peu près tout.',     couleur: '#16a34a', skill: 0,  depth: 1,  hasard: 0.5 },
  { id: 'cavalier',  nom: 'Cavalier',  piece: 'N', elo: '≈ 700',  niveau: 'Débutant',       desc: 'Attaque un peu, défend beaucoup moins.',            couleur: '#0d9488', skill: 0,  depth: 2,  hasard: 0.25 },
  { id: 'fou',       nom: 'Fou',       piece: 'B', elo: '≈ 1000', niveau: 'Initié',         desc: 'Voit les prises simples, tombe dans les pièges.',   couleur: '#2563eb', skill: 3,  depth: 4,  hasard: 0.1 },
  { id: 'tour',      nom: 'Tour',      piece: 'R', elo: '≈ 1300', niveau: 'Intermédiaire',  desc: 'Solide, mais une tactique peut le surprendre.',     couleur: '#4f46e5', skill: 6,  depth: 6,  hasard: 0.04 },
  { id: 'dame',      nom: 'Dame',      piece: 'Q', elo: '≈ 1600', niveau: 'Confirmé',       desc: 'Fait des plans et punit les erreurs.',              couleur: '#9333ea', skill: 10, depth: 8,  hasard: 0 },
  { id: 'roi',       nom: 'Roi',       piece: 'K', elo: '≈ 1900', niveau: 'Fort',           desc: 'Le niveau d’un bon joueur de club.',                couleur: '#db2777', skill: 14, depth: 10, hasard: 0 },
  { id: 'maitre',    nom: 'Maître',    piece: 'Q', elo: '≈ 2200', niveau: 'Expert',         desc: 'Pour les meilleurs de l’AS.',                       couleur: '#ea580c', camp: 'b', skill: 18, movetime: 800,  hasard: 0 },
  { id: 'stockfish', nom: 'Stockfish', piece: 'K', elo: '3000 +', niveau: 'Imbattable',     desc: 'Le moteur à pleine puissance. Bonne chance !',      couleur: '#dc2626', camp: 'b', skill: 20, movetime: 1500, hasard: 0 },
];
