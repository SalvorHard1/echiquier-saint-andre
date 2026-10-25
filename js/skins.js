// Skins de plateau : couleurs (ou motif) des cases + jeu de pièces, débloqués par le rang ou par un haut fait.
// Les jeux de pièces sont des fichiers SVG de Lichess copiés dans assets/pieces (crédits dans le README) :
// tout marche hors ligne. Les motifs des cases sont faits en CSS, sans image. Le choix de l'élève est gardé
// dans le navigateur.

const CLE = 'echiquier-saint-andre:plateau';

/* ---------- Jeux de pièces ---------- */
// dossier : sous-dossier de assets/pieces ('' = cburnett, à la racine, utilisé aussi pour les icônes).

export const FAMILLES = {
  cburnett: { nom: 'Classiques', dossier: '' },
  merida: { nom: 'Merida' },
  staunty: { nom: 'Staunty' },
  maestro: { nom: 'Maestro' },
  california: { nom: 'California' },
  cardinal: { nom: 'Cardinal' },
  tatiana: { nom: 'Tatiana' },
  chessnut: { nom: 'Chessnut' },
  celtic: { nom: 'Celtic' },
  fantasy: { nom: 'Fantasy' },
  spatial: { nom: 'Spatial' },
  horsey: { nom: 'Horsey' },
  anarcandy: { nom: 'Anarcandy' },
  papercut: { nom: 'Papier découpé' },
  shapes: { nom: 'Formes' },
};

// Silhouettes Staunton (repère 45×45) dessinées dans les insignes de rang (succes.js).
export const SILHOUETTES = {
  p: '<path d="M13 39h19v-2c0-2-2-3-4-3H17c-2 0-4 1-4 3zM17 34c1-5 3-8 3-11h5c0 3 2 6 3 11zM18 23h9v-2h-9z"/><circle cx="22.5" cy="16" r="4.5"/>',
  n: '<path d="M12 39h21v-3H12zM15 36h15c0-10-1-19-5-24l1-4-4 2c-6 1-11 6-12 13 2 1 4 1 6-1 3 0 5-1 6-3 0 5-5 8-7 17z"/>',
  b: '<path d="M13 39h19v-3H13zM16 36h13c-1-4-2-7-2-10h-9c0 3-1 6-2 10zM17 26h11v-2H17zM18 24c-3-4-1-10 4.5-14 5.5 4 7.5 10 4.5 14z"/><circle cx="22.5" cy="8" r="2"/><path d="M24 14l-3 4" fill="none"/>',
  r: '<path d="M12 39h21v-3H12zM15 36h15l-2-5H17zM17 31h11V17H17zM15 17h15v-2H15zM15 15V9h3v3h3V9h3v3h3V9h3v6z"/>',
  q: '<path d="M12 39h21v-3H12zM15 36h15c-2-4-3-9-3-13H18c0 4-1 9-3 13zM17 23h11v-2H17zM16 21l-3-10 5 5 2-7 2.5 7 2.5-7 2 7 5-5-3 10z"/><circle cx="13" cy="11" r="1.5"/><circle cx="20" cy="9" r="1.5"/><circle cx="25" cy="9" r="1.5"/><circle cx="32" cy="11" r="1.5"/>',
  k: '<path d="M12 39h21v-3H12zM15 36h15c-2-4-3-9-3-13H18c0 4-1 9-3 13zM17 23h11v-2H17zM16 21c-2-5 2-9 6.5-9s8.5 4 6.5 9zM21 12V8h-3V5h3V2h3v3h3v3h-3v4z"/>',
};

/* ---------- Motifs des cases (CSS) ---------- */
// Chaque motif donne le fond [case claire, case foncée] ; les tailles en % suivent la taille des cases.

const bois = (a, b, c) => `repeating-linear-gradient(100deg, ${a} 0 6%, ${b} 6% 9%, ${c} 9% 15%)`;
const veines = (a, b, c, d) => `linear-gradient(125deg, ${a} 38%, ${b} 44%, ${c} 50%, ${d} 72%)`;
const quadrillage = 'linear-gradient(#bcd2ef 1px, transparent 1px) 0 0 / 25% 25%, linear-gradient(90deg, #bcd2ef 1px, transparent 1px) 0 0 / 25% 25%';

const MOTIFS = {
  noyer: [bois('#ddbf91', '#d4b382', '#e0c49a'), bois('#7a4f2e', '#6c4427', '#80553a')],
  erable: [bois('#f0d9b5', '#ecd2a9', '#f2dcba'), bois('#b58863', '#ab7d58', '#b98d68')],
  ebene: [bois('#ece0c8', '#e4d6ba', '#efe4ce'), bois('#4a382d', '#3e2f26', '#523f33')],
  marbre: [veines('#f2f1ec', '#dcdad3', '#f2f1ec', '#e7e5df'), veines('#6b7078', '#8a8f97', '#5f646c', '#747980')],
  obsidienne: [veines('#5a5560', '#6d6873', '#524d58', '#5f5a65'), veines('#24202a', '#36303e', '#1c1921', '#28242e')],
  cahier: [`${quadrillage}, #fdfdfb`, `repeating-linear-gradient(45deg, rgba(37, 84, 180, 0.5) 0 1.5px, transparent 1.5px 6px), ${quadrillage}, #fdfdfb`],
  tableau: ['radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1), transparent 60%), #4b6b57', 'radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.05), transparent 60%), #2b4236'],
  neon: ['radial-gradient(circle, rgba(56, 232, 255, 0.35), transparent 75%), #b9a8ee', 'radial-gradient(circle, rgba(255, 62, 165, 0.45), transparent 75%), #3a1f78'],
  ocean: ['linear-gradient(160deg, #d9f0f5, #c4e5ee)', 'linear-gradient(160deg, #2f7896, #215a73)'],
  aurore: ['linear-gradient(160deg, #a5e6c8, #8fd3b8 60%, #b9b0f0)', 'linear-gradient(160deg, #1b2350, #241a52)'],
  titane: ['repeating-linear-gradient(90deg, #c9ccd1 0 2%, #d3d6da 2% 4%)', 'repeating-linear-gradient(90deg, #3d4148 0 2%, #464a52 2% 4%)'],
  parchemin: ['radial-gradient(circle at 30% 30%, #f6ecd5, #ecdfc0)', 'radial-gradient(circle at 70% 70%, #c3ad85, #b09872)'],
};

/* ---------- Skins ---------- */
// cases : [claire, foncée] (couleurs unies, aussi pour les coordonnées ; null = couleurs du thème)
// motif : fond dessiné des cases (sinon les couleurs unies) · pieces : jeu de pièces du plateau
// rang : nom du rang qui le débloque · hautFait : id du haut fait qui le débloque

export const SKINS = [
  { id: 'classique', nom: 'Classique', desc: 'Le plateau de l’AS', rang: 'Fer', cases: null, apercuCases: ['#e9eef4', '#8ea4bd'], pieces: 'cburnett' },
  { id: 'noyer', nom: 'Noyer et laiton', desc: 'Bois de club anglais', rang: 'Bronze', cases: ['#d9b98a', '#7a4f2e'], motif: MOTIFS.noyer, pieces: 'merida' },
  { id: 'minuit', nom: 'Minuit', desc: 'Bleu nuit et argent', rang: 'Argent', cases: ['#a9b9d0', '#1f2b45'], pieces: 'california' },
  { id: 'ebene', nom: 'Ébène et ivoire', desc: 'Bois précieux', rang: 'Or', cases: ['#e9dcc3', '#4a382d'], motif: MOTIFS.ebene, pieces: 'staunty' },
  { id: 'marbre', nom: 'Marbre de Carrare', desc: 'Blanc veiné, graphite', rang: 'Platine', cases: ['#ecebe6', '#6b7078'], motif: MOTIFS.marbre, pieces: 'cardinal' },
  { id: 'emeraude', nom: 'Émeraude', desc: 'Vert profond', rang: 'Émeraude', cases: ['#d6e8d4', '#0f5a40'], pieces: 'chessnut' },
  { id: 'cristal', nom: 'Cristal', desc: 'Bleu glacier', rang: 'Diamant', cases: ['#e3f1f7', '#5b7fa8'], pieces: 'spatial' },
  { id: 'artdeco', nom: 'Art déco 1925', desc: 'Noir laqué et crème', rang: 'Master', cases: ['#efe3c8', '#2a2a2a'], pieces: 'tatiana' },
  { id: 'grandmaitre', nom: 'Grand maître', desc: 'Cuir bordeaux', rang: 'Grand Master', cases: ['#e7d3b0', '#5e1a23'], pieces: 'maestro' },
  { id: 'obsidienne', nom: 'Obsidienne', desc: 'Verre volcanique', rang: 'Challenger', hautFait: 'bat-stockfish', cases: ['#5a5560', '#24202a'], motif: MOTIFS.obsidienne, pieces: 'celtic' },

  { id: 'jade', nom: 'Jade impérial', desc: 'Jade et papier de riz', hautFait: 'pb-500', cases: ['#cfe3d2', '#2f6b52'], pieces: 'papercut' },
  { id: 'amethyste', nom: 'Améthyste', desc: 'Violet royal', hautFait: 'niveau-roi', cases: ['#e4dcf2', '#4b2a7a'], pieces: 'fantasy' },
  { id: 'aurore', nom: 'Aurore boréale', desc: 'Nuit polaire, vert et violet', hautFait: 'defi-30', cases: ['#8fd3b8', '#1b2350'], motif: MOTIFS.aurore, pieces: 'spatial' },
  { id: 'titane', nom: 'Titane', desc: 'Métal brossé', hautFait: 'course-30', cases: ['#c9ccd1', '#3d4148'], motif: MOTIFS.titane, pieces: 'shapes' },
  { id: 'encre', nom: 'Encre et parchemin', desc: 'Papier ancien, pièces de livre', hautFait: 'precision-90', cases: ['#f1e6cc', '#b9a27a'], motif: MOTIFS.parchemin, pieces: 'merida' },
  { id: 'phenix', nom: 'Phénix', desc: 'Cendre et braise', hautFait: 'remontada', cases: ['#e2c9b5', '#7a2e1b'], pieces: 'staunty' },
  { id: 'academie', nom: 'Académie', desc: 'Acajou et vert bouteille', hautFait: 'cours-parfait', cases: ['#e6d5b8', '#1f4a36'], pieces: 'cardinal' },
  { id: 'tournoi', nom: 'Tournoi', desc: 'Vert et crème, comme en club', hautFait: 'parties-10', cases: ['#eeeed2', '#769656'], pieces: 'california' },
  { id: 'erable', nom: 'Érable', desc: 'Bois clair veiné', hautFait: 'jours-10', cases: ['#f0d9b5', '#b58863'], motif: MOTIFS.erable, pieces: 'maestro' },
  { id: 'cahier', nom: 'Cahier d’écolier', desc: 'Petits carreaux et stylo bille', hautFait: 'cours-tous', cases: ['#fdfdfb', '#8fa9d6'], motif: MOTIFS.cahier, pieces: 'horsey' },
  { id: 'tableau', nom: 'Tableau noir', desc: 'Ardoise et craie', hautFait: 'lecons-toutes', cases: ['#4b6b57', '#2b4236'], motif: MOTIFS.tableau, pieces: 'papercut' },
  { id: 'pixel', nom: 'Pixel rétro', desc: 'Console de poche des années 90', hautFait: 'duel-5', cases: ['#9bbc0f', '#306230'], pieces: 'chessnut' },
  { id: 'neon', nom: 'Néon', desc: 'Nuit synthwave', hautFait: 'victoire-bullet', cases: ['#b9a8ee', '#3a1f78'], motif: MOTIFS.neon, pieces: 'california' },
  { id: 'sakura', nom: 'Sakura', desc: 'Cerisier en fleur', hautFait: 'defi-serie-7', cases: ['#fae3ea', '#9c5a68'], pieces: 'tatiana' },
  { id: 'ocean', nom: 'Océan', desc: 'Bleu profond et écume', hautFait: 'serie-10', cases: ['#d9f0f5', '#2f7896'], motif: MOTIFS.ocean, pieces: 'fantasy' },
  { id: 'bonbon', nom: 'Confiserie', desc: 'Guimauve et réglisse', hautFait: 'mat-express', cases: ['#ffe4f1', '#c58ab0'], pieces: 'anarcandy' },
];

export const skinParId = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
export const skinDuRang = (nom) => SKINS.find((s) => s.rang === nom) || null;
// Skin débloqué par un haut fait (Challenger compris : battre Stockfish donne l'Obsidienne).
export const skinDuHautFait = (id) => SKINS.find((s) => s.hautFait === id) || null;

/* ---------- Pièces ---------- */

export function pieceSkin(skin, famille, color, type) {
  const f = FAMILLES[famille] || FAMILLES.cburnett;
  const dossier = f.dossier ?? famille;
  return `assets/pieces/${dossier ? `${dossier}/` : ''}${color}${type.toUpperCase()}.svg`;
}

// Petit plateau 4×4 pour montrer un skin.
const DISPOSITION = ['', 'bq', '', 'bk', 'bp', '', 'bb', '', '', 'bn', '', 'wp', 'wk', '', 'wq', ''];

export function apercu(skin, famille = skin.pieces) {
  const [claire, foncee] = skin.motif || skin.cases || skin.apercuCases;
  return `<span class="apercu" aria-hidden="true">${DISPOSITION.map((p, i) => {
    const fond = (Math.floor(i / 4) + (i % 4)) % 2 ? foncee : claire;
    return `<span style="background:${fond}">${p ? `<img src="${pieceSkin(skin, famille, p[0], p[1])}" alt="">` : ''}</span>`;
  }).join('')}</span>`;
}

/* ---------- Choix de l'élève ---------- */
// { plateau: id du skin, pieces: jeu choisi à part (null = celui du plateau), vus: skins déjà annoncés }

export function lirePref() {
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (d && typeof d === 'object') return { plateau: 'classique', pieces: null, ...d };
  } catch { /* stockage indisponible ou illisible */ }
  return { plateau: 'classique', pieces: null };
}

export function ecrirePref(pref) {
  try {
    localStorage.setItem(CLE, JSON.stringify(pref));
  } catch { /* navigation privée : le choix ne dure que le temps de la visite */ }
}

let actif = { skin: SKINS[0], famille: 'cburnett' };

export function utiliser(skinId, famille) {
  const skin = skinParId(skinId);
  actif = { skin, famille: FAMILLES[famille] ? famille : skin.pieces };
  const racine = document.documentElement.style;
  const proprietes = { '--sq-light': skin.cases?.[0], '--sq-dark': skin.cases?.[1], '--sq-light-fond': skin.motif?.[0], '--sq-dark-fond': skin.motif?.[1] };
  for (const [nom, valeur] of Object.entries(proprietes)) {
    if (valeur) racine.setProperty(nom, valeur);
    else racine.removeProperty(nom);
  }
}

// Pièce affichée sur l'échiquier (et dans les choix de promotion, les prises…), selon le skin choisi.
export function piecePlateau(color, type) {
  return pieceSkin(actif.skin, actif.famille, color, type);
}
