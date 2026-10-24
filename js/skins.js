// Skins de plateau : couleurs des cases + famille de pièces, débloqués par le rang ou par un haut fait.
// Les pièces sont dessinées ici (repère 45×45, comme les pièces cburnett) et recolorées selon le skin :
// pas de fichier à télécharger, tout marche hors ligne. Le choix de l'élève est gardé dans le navigateur.

const CLE = 'echiquier-saint-andre:plateau';

/* ---------- Familles de pièces ---------- */

const P = (d) => `<path d="${d}"/>`;
const L = (d) => `<path d="${d}" fill="none"/>`;
const C = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const G = (pts) => `<polygon points="${pts}"/>`;
const Y = (pts) => `<polyline points="${pts}" fill="none"/>`;

const socle = {
  deco: 'M13 39h19v-3H13zM16 36h13v-3H16z',
  marbre: 'M10 39h25v-4H10zM13 35h19v-2H13z',
  titane: 'M13 39h19l-2-4H15z',
  bauhaus: 'M13 39h19v-3a3 3 0 0 0-3-3H16a3 3 0 0 0-3 3z',
  baroque: 'M10 39h25l-2-3H12zM13 36h19c0-2-2-3-4-3H17c-2 0-4 1-4 3z',
  flamme: 'M12 39h21c-1-2-3-3-5-3H17c-2 0-4 1-5 3z',
};

// cburnett : les fichiers d'origine (assets/pieces), utilisés tels quels.
export const FAMILLES = {
  cburnett: { nom: 'Classiques' },
  staunton: {
    nom: 'Staunton revisité',
    p: P('M13 39h19v-2c0-2-2-3-4-3H17c-2 0-4 1-4 3zM17 34c1-5 3-8 3-11h5c0 3 2 6 3 11zM18 23h9v-2h-9z') + C(22.5, 16, 4.5),
    n: P('M12 39h21v-3H12zM15 36h15c0-10-1-19-5-24l1-4-4 2c-6 1-11 6-12 13 2 1 4 1 6-1 3 0 5-1 6-3 0 5-5 8-7 17z'),
    b: P('M13 39h19v-3H13zM16 36h13c-1-4-2-7-2-10h-9c0 3-1 6-2 10zM17 26h11v-2H17zM18 24c-3-4-1-10 4.5-14 5.5 4 7.5 10 4.5 14z') + C(22.5, 8, 2) + L('M24 14l-3 4'),
    r: P('M12 39h21v-3H12zM15 36h15l-2-5H17zM17 31h11V17H17zM15 17h15v-2H15zM15 15V9h3v3h3V9h3v3h3V9h3v6z'),
    q: P('M12 39h21v-3H12zM15 36h15c-2-4-3-9-3-13H18c0 4-1 9-3 13zM17 23h11v-2H17zM16 21l-3-10 5 5 2-7 2.5 7 2.5-7 2 7 5-5-3 10z') + C(13, 11, 1.5) + C(20, 9, 1.5) + C(25, 9, 1.5) + C(32, 11, 1.5),
    k: P('M12 39h21v-3H12zM15 36h15c-2-4-3-9-3-13H18c0 4-1 9-3 13zM17 23h11v-2H17zM16 21c-2-5 2-9 6.5-9s8.5 4 6.5 9zM21 12V8h-3V5h3V2h3v3h3v3h-3v4z'),
  },
  bauhaus: {
    nom: 'Bauhaus',
    p: P(socle.bauhaus + 'M19 33h7v-9h-7z') + C(22.5, 18, 6),
    n: P(socle.bauhaus + 'M16 33h13V21a10 10 0 0 0-10-10h-6v8h6z'),
    b: P(socle.bauhaus + 'M18 33h9V22h-9z') + C(22.5, 15, 6) + C(22.5, 6, 2),
    r: P(socle.bauhaus + 'M16 33h13V17H16zM14 17h17v-4a8.5 8.5 0 0 0-17 0z') + L('M22.5 6v7'),
    q: P(socle.bauhaus + 'M18 33h9V22h-9zM13 22h19a9.5 9.5 0 0 0-19 0z') + C(14, 10, 2) + C(22.5, 7, 2) + C(31, 10, 2),
    k: P(socle.bauhaus + 'M18 33h9V20h-9zM14 20h17a8.5 8.5 0 0 0-17 0zM21 11V8h-3V5h3V2h3v3h3v3h-3v3z'),
  },
  neoclassique: {
    nom: 'Néoclassique',
    p: P(socle.marbre + 'M19 33h7V22h-7zM17 22h11v-2H17z') + C(22.5, 15, 5) + L('M21.5 23v9M23.5 23v9'),
    n: P(socle.marbre + 'M15 33h15c0-8-1-15-2-19l-6-7-8 6-2 6 6-1-6 9z') + L('M24 10l3 4M26 16l2 3'),
    b: P(socle.marbre + 'M19 33h7V20h-7zM17 20h11v-2H17zM22.5 5c4 4 5 9 3.5 13h-7c-1.5-4-.5-9 3.5-13z') + L('M22.5 21v11'),
    r: P(socle.marbre + 'M16 33h13V16H16zM13 16h19v-3H13zM13 13V8h4v3h3V8h5v3h3V8h4v5z') + L('M19 17v15M22.5 17v15M26 17v15'),
    q: P(socle.marbre + 'M18 33h9V20h-9zM16 20h13v-2H16zM15 18l-2-10 5 5 4.5-8 4.5 8 5-5-2 10z') + L('M21 21v11M24 21v11'),
    k: P(socle.marbre + 'M18 33h9V18h-9zM16 18h13v-3H16zM21 15v-5h-3V7h3V4h3v3h3v3h-3v5z') + L('M21 19v13M24 19v13'),
  },
  facette: {
    nom: 'Facetté',
    p: G('22.5,8 27,13 26,20 29,30 32,39 13,39 16,30 19,20 18,13') + Y('18,13 27,13') + Y('19,20 26,20') + Y('16,30 29,30') + Y('22.5,8 22.5,39'),
    n: G('13,39 32,39 30,28 31,15 25,6 17,11 12,19 15,22 21,19 15,30') + Y('25,6 22,19') + Y('21,19 30,28') + Y('15,30 30,28'),
    b: G('22.5,4 28,13 26,22 29,30 32,39 13,39 16,30 19,22 17,13') + Y('17,13 28,13') + Y('19,22 26,22') + Y('16,30 29,30') + Y('22.5,4 22.5,39'),
    r: G('13,39 32,39 29,30 29,15 32,8 26,8 24.5,12 20.5,12 19,8 13,8 16,15 16,30') + Y('16,15 29,15') + Y('16,30 29,30') + Y('22.5,12 22.5,39'),
    q: G('11,9 17,15 22.5,5 28,15 34,9 30,24 31,30 33,39 12,39 14,30 15,24') + Y('15,24 30,24') + Y('14,30 31,30') + Y('22.5,5 22.5,39'),
    k: G('21,2 24,2 24,5 27,5 27,8 24,8 24,11 21,11 21,8 18,8 18,5 21,5') + G('16,13 29,13 31,24 29,30 32,39 13,39 16,30 14,24') + Y('14,24 31,24') + Y('16,30 29,30') + Y('22.5,13 22.5,39'),
  },
  calligraphie: {
    nom: 'Calligraphie',
    p: P('M14 39c3-1 14-1 17 0-1-6-4-10-6-12 3-2 3-8-2.5-9-5.5 1-5.5 7-2.5 9-2 2-5 6-6 12z'),
    n: P('M13 39c4-1 15-1 19 0 1-12-1-24-10-29-2 0-3 1-3 3-4 2-8 7-9 12 2 1 4 0 6-2 3 0 4-1 5-3 0 6-6 10-8 19z'),
    b: P('M14 39c4-1 13-1 17 0-2-5-5-9-5-14 4-3 3-10-3.5-16-6.5 6-7.5 13-3.5 16 0 5-3 9-5 14z') + L('M25 13l-5 5'),
    r: P('M13 39c5-1 14-1 19 0l-3-6V15l3-6c-2 1-3 1-4 0l-1 3h-3l-1-3c-1 1-2 1-3 0l-1 3h-3l-1-3c-1 1-2 0-3-1l2 6v18z'),
    q: P('M13 39c4-1 15-1 19 0-3-6-4-12-3-19l3-9-5 6-4.5-9-4.5 9-5-6 3 9c1 7 0 13-3 19z'),
    k: P('M13 39c4-1 15-1 19 0-3-6-4-13-3-20 2-3 1-5-3-5h-7c-4 0-5 2-3 5 1 7 0 14-3 20z') + L('M22.5 13V4M19 7.5h7'),
  },
  futuriste: {
    nom: 'Futuriste',
    p: P(socle.titane + 'M19 35h7V23h-7zM18 23h9v-7l-3-3h-3l-3 3z'),
    n: P(socle.titane + 'M16 35L30 35L30 14L24 8L16 8L12 13L12 19L21 19L16 25Z'),
    b: P(socle.titane + 'M19 35h7V20h-7zM17 20h11V11l-5.5-6L17 11z') + L('M20 15l5-5'),
    r: P('M12 39h21l-2-4H14zM16 35h13V17H16zM14 17h17V9h-5v3h-7V9h-5z'),
    q: P(socle.titane + 'M18 35h9V20h-9zM14 20h17l2-11-6 5-4.5-8-4.5 8-6-5z'),
    k: P(socle.titane + 'M18 35h9V18h-9zM15 18h15v-5H15zM21 13V8h-3V5h3V2h3v3h3v3h-3v5z'),
  },
  flamme: {
    nom: 'Flamme',
    p: P(socle.flamme + 'M16 36c-2-6 2-10 4-13-3-3-2-8 3-13 0 3 2 4 3 6 2 3 0 6-1 7 3 3 6 7 4 13z'),
    n: P(socle.flamme + 'M15 36c-1-8 4-12 6-16-3 1-6 2-9 1 2-6 7-10 12-11-1-2 0-4 2-5 0 2 2 3 3 4 6 4 8 12 5 27z'),
    b: P(socle.flamme + 'M16 36c-1-7 2-11 4-15-3-4 0-10 2.5-17 1 4 4 7 5 11 1 3 0 5-1 6 2 4 4 8 3 15z') + L('M23 12l-2 5'),
    r: P(socle.flamme + 'M15 36l1-19h13l1 19zM14 17l1-9 3 4 2-6 2.5 5 2.5-5 2 6 3-4 1 9z'),
    q: P(socle.flamme + 'M16 36c0-6 1-10 2-14h9c1 4 2 8 2 14zM14 22h17c2-5 3-10 1-15-2 3-4 4-5 5 0-4-2-7-4.5-10-2.5 3-4.5 6-4.5 10-1-1-3-2-5-5-2 5-1 10 1 15z'),
    k: P(socle.flamme + 'M16 36c0-6 1-10 2-15h9c1 5 2 9 2 15zM15 21h15c3-5 0-10-4-11-1 2-2 3-3.5 3s-2.5-1-3.5-3c-4 1-7 6-4 11zM22.5 10c-2-2-2-5 0-8 2 3 2 6 0 8z'),
  },
  artdeco: {
    nom: 'Art déco',
    p: P(socle.deco + 'M20 33h5V21h-5z') + C(22.5, 16, 4.5),
    n: P('M12 39h21v-3H12zM15 36h15v-3H15zM16 33h14l-1-12 2-7-7-7-9 6-1 5h6l-5 8z'),
    b: P(socle.deco + 'M19 33h7l-1-13h-5z') + P('M22.5 5l5 8-5 7-5-7z'),
    r: P('M11 39h23v-3H11zM14 36h17v-3H14zM17 33h11V16H17zM14 16h17V8h-3v3h-3V8h-5v3h-3V8h-3z'),
    q: P(socle.deco + 'M18 33h9l-1-12h-7z') + P('M12 9l5 12h11l5-12-5 5-5.5-9-5.5 9z'),
    k: P(socle.deco + 'M18 33h9l-1-14h-7zM15 19h15v-5H15zM21 14V9h-3V6h3V3h3v3h3v3h-3v5z'),
  },
  baroque: {
    nom: 'Baroque',
    p: P(socle.baroque + 'M18 33c1-4 2-7 2-9h5c0 2 1 5 2 9zM16 24h13c0-1-1-2-2-2H18c-1 0-2 1-2 2z') + C(22.5, 16, 5) + C(22.5, 9.5, 1.5),
    n: P(socle.baroque + 'M15 33h15c0-9-1-17-4-21l1-5-4 3c-7 0-12 6-13 12 2 2 5 1 7-1 2 0 4 0 5-2 0 5-5 8-7 14z') + L('M25 13c2 2 3 5 3 8M23 16c1 2 2 4 2 7'),
    b: P(socle.baroque + 'M18 33c1-3 1-6 1-8h7c0 2 0 5 1 8zM16 25h13l-1-2H17zM18 23c-3-4-1-10 4.5-14 5.5 4 7.5 10 4.5 14z') + C(22.5, 7, 2) + L('M20 17c2-1 3-3 5-4'),
    r: P(socle.baroque + 'M16 33h13l-1-15H17zM14 18h17v-3H14zM14 15l1-7 3 2 2-3 2.5 3 2.5-3 2 3 3-2 1 7z') + L('M18 22c3 2 6 2 9 0M18 27c3 2 6 2 9 0'),
    q: P(socle.baroque + 'M17 33c1-3 1-7 1-10h9c0 3 0 7 1 10zM15 23h15l-1-2H16zM16 21l-4-11 5 4 1-7 3 6 1.5-8 1.5 8 3-6 1 7 5-4-4 11z') + C(12, 10, 1.5) + C(18, 7, 1.5) + C(22.5, 5, 1.5) + C(27, 7, 1.5) + C(33, 10, 1.5),
    k: P(socle.baroque + 'M17 33c1-3 1-7 1-10h9c0 3 0 7 1 10zM15 23h15l-1-2H16zM16 21c-3-6 0-10 4-10 1-2 4-2 5 0 4 0 7 4 4 10zM21 11V7h-3V4h3V1h3v3h3v3h-3v4z') + L('M19 16h7'),
  },
  eclats: {
    nom: 'Éclats',
    p: G('22.5,9 27,16 25,22 31,39 14,39 20,22 18,16'),
    n: G('12,39 33,39 29,26 31,12 26,4 22,9 14,13 10,20 17,19 21,17 13,30'),
    b: G('22.5,2 28,14 25,22 30,39 15,39 20,22 17,14') + Y('20,15 26,10'),
    r: G('12,39 33,39 29,30 30,16 33,7 28,11 25,6 22.5,11 20,6 17,11 12,7 15,16 16,30'),
    q: G('10,6 17,16 22.5,3 28,16 35,6 30,24 32,39 13,39 15,24'),
    k: G('22.5,1 25,6 22.5,9 20,6') + G('15,12 18,12 22.5,9 27,12 30,12 28,24 32,39 13,39 17,24'),
  },
};

/* ---------- Skins ---------- */
// cases : [claire, foncée] (null = couleurs du thème) · w / b : remplissage des pièces blanches / noires
// t : contour des pièces noires (les blanches sont cernées de la couleur des noires)
// rang : nom du rang qui le débloque · hautFait : id du haut fait qui le débloque

export const SKINS = [
  { id: 'classique', nom: 'Classique', desc: 'Le plateau de l’AS', rang: 'Fer', cases: null, apercuCases: ['#e9eef4', '#8ea4bd'], pieces: 'cburnett', w: '#ffffff', b: '#20242b', t: '#c9d3df' },
  { id: 'noyer', nom: 'Noyer et laiton', desc: 'Club anglais, Staunton', rang: 'Bronze', cases: ['#d9b98a', '#7a4f2e'], pieces: 'staunton', w: '#f3e2c0', b: '#2a1a10', t: '#a8823d' },
  { id: 'minuit', nom: 'Minuit', desc: 'Bleu nuit et argent', rang: 'Argent', cases: ['#9fb0c8', '#1f2b45'], pieces: 'bauhaus', w: '#eef2f8', b: '#0b1222', t: '#c0c8d6' },
  { id: 'ebene', nom: 'Ébène et ivoire', desc: 'Bois précieux, liseré doré', rang: 'Or', cases: ['#e9dcc3', '#4a382d'], pieces: 'staunton', w: '#f7f0e1', b: '#17110d', t: '#c9973a' },
  { id: 'marbre', nom: 'Marbre de Carrare', desc: 'Blanc veiné, graphite', rang: 'Platine', cases: ['#ecebe6', '#6b7078'], pieces: 'neoclassique', w: '#fbfaf7', b: '#22262b', t: '#b3bcc6' },
  { id: 'emeraude', nom: 'Émeraude', desc: 'Vert profond et or', rang: 'Émeraude', cases: ['#d6e8d4', '#0f5a40'], pieces: 'facette', w: '#f4efe2', b: '#08261b', t: '#d8b25a' },
  { id: 'cristal', nom: 'Cristal', desc: 'Bleu glacier, reflets lilas', rang: 'Diamant', cases: ['#e3f1f7', '#5b7fa8'], pieces: 'facette', w: '#ffffff', b: '#1c2340', t: '#b9adf0' },
  { id: 'artdeco', nom: 'Art déco 1925', desc: 'Noir laqué, or, crème', rang: 'Master', cases: ['#efe3c8', '#2a2a2a'], pieces: 'artdeco', w: '#f2e6c9', b: '#0d0d0d', t: '#d4ae3a' },
  { id: 'grandmaitre', nom: 'Grand maître', desc: 'Cuir bordeaux et or', rang: 'Grand Master', cases: ['#e7d3b0', '#5e1a23'], pieces: 'baroque', w: '#f6e8cc', b: '#2a0b10', t: '#d4a63a' },
  { id: 'obsidienne', nom: 'Obsidienne', desc: 'Verre volcanique, or pur', rang: 'Challenger', hautFait: 'bat-stockfish', cases: ['#5a5560', '#24202a'], pieces: 'eclats', w: '#f1d27a', b: '#050406', t: '#e2b84a' },

  { id: 'jade', nom: 'Jade impérial', desc: 'Jade et cinabre', hautFait: 'pb-500', cases: ['#cfe3d2', '#2f6b52'], pieces: 'calligraphie', w: '#f4efe2', b: '#8e2a1c', t: '#e3c06a' },
  { id: 'amethyste', nom: 'Améthyste', desc: 'Violet royal et argent', hautFait: 'niveau-roi', cases: ['#e4dcf2', '#4b2a7a'], pieces: 'facette', w: '#f7f4fb', b: '#1e1033', t: '#c4b3e6' },
  { id: 'aurore', nom: 'Aurore boréale', desc: 'Nuit polaire, vert et violet', hautFait: 'defi-30', cases: ['#8fd3b8', '#1b2350'], pieces: 'bauhaus', w: '#e8fbf3', b: '#0a0f2a', t: '#a58bea' },
  { id: 'titane', nom: 'Titane', desc: 'Métal brossé, rouge course', hautFait: 'course-30', cases: ['#c9ccd1', '#3d4148'], pieces: 'futuriste', w: '#f2f3f5', b: '#b3121d', t: '#1a1c20' },
  { id: 'encre', nom: 'Encre et parchemin', desc: 'Papier ancien, encre de Chine', hautFait: 'precision-90', cases: ['#f1e6cc', '#b9a27a'], pieces: 'calligraphie', w: '#fbf6e8', b: '#141210', t: '#7a6542' },
  { id: 'phenix', nom: 'Phénix', desc: 'Cendre et braise', hautFait: 'remontada', cases: ['#d8cfc7', '#3b2a26'], pieces: 'flamme', w: '#ffd9a0', b: '#1a0f0c', t: '#e0531f' },
  { id: 'academie', nom: 'Académie', desc: 'Acajou et vert bouteille', hautFait: 'cours-parfait', cases: ['#e6d5b8', '#1f4a36'], pieces: 'neoclassique', w: '#f5ecd9', b: '#3a1a0e', t: '#c49a3c' },
];

export const skinParId = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
export const skinDuRang = (nom) => SKINS.find((s) => s.rang === nom) || null;
// Skin débloqué par un haut fait (Challenger compris : battre Stockfish donne l'Obsidienne).
export const skinDuHautFait = (id) => SKINS.find((s) => s.hautFait === id) || null;

/* ---------- Dessin des pièces ---------- */

const cache = new Map();

export function pieceSkin(skin, famille, color, type) {
  if (famille === 'cburnett' || !FAMILLES[famille]) return `assets/pieces/${color}${type.toUpperCase()}.svg`;
  const cle = `${skin.id}:${famille}:${color}${type}`;
  if (!cache.has(cle)) {
    const [fill, stroke] = color === 'w' ? [skin.w, skin.b] : [skin.b, skin.t];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${FAMILLES[famille][type]}</g></svg>`;
    cache.set(cle, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  }
  return cache.get(cle);
}

// Petit plateau 4×4 pour montrer un skin.
const DISPOSITION = ['', 'bq', '', 'bk', 'bp', '', 'bb', '', '', 'bn', '', 'wp', 'wk', '', 'wq', ''];

export function apercu(skin, famille = skin.pieces) {
  const [claire, foncee] = skin.cases || skin.apercuCases;
  return `<span class="apercu" aria-hidden="true">${DISPOSITION.map((p, i) => {
    const fond = (Math.floor(i / 4) + (i % 4)) % 2 ? foncee : claire;
    return `<span style="background:${fond}">${p ? `<img src="${pieceSkin(skin, famille, p[0], p[1])}" alt="">` : ''}</span>`;
  }).join('')}</span>`;
}

/* ---------- Choix de l'élève ---------- */
// { plateau: id du skin, pieces: famille choisie à part (null = celle du plateau), vus: skins déjà annoncés }

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
  if (skin.cases) {
    racine.setProperty('--sq-light', skin.cases[0]);
    racine.setProperty('--sq-dark', skin.cases[1]);
  } else {
    racine.removeProperty('--sq-light');
    racine.removeProperty('--sq-dark');
  }
}

// Pièce affichée sur l'échiquier (et dans les choix de promotion, les prises…), selon le skin choisi.
export function piecePlateau(color, type) {
  return pieceSkin(actif.skin, actif.famille, color, type);
}
