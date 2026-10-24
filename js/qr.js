// Générateur de QR codes, sans bibliothèque externe (la Content-Security-Policy interdit tout CDN).
// Mode octets, correction d'erreur M (15 %), versions 1 à 20 : largement assez pour un lien vers une position.
// D'après l'algorithme publié par Project Nayuki (licence MIT).

const MAX_VERSION = 20;
// Index = version. Nombre de codewords de correction par bloc et nombre de blocs, niveau M.
const ECC_PAR_BLOC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26];
const NB_BLOCS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16];
const FORMAT_M = 0; // bits de format du niveau M

const bit = (x, i) => ((x >>> i) & 1) !== 0;

function modulesBruts(ver) {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const nbAlign = Math.floor(ver / 7) + 2;
    n -= (25 * nbAlign - 10) * nbAlign - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

const codewordsDonnees = (ver) => Math.floor(modulesBruts(ver) / 8) - ECC_PAR_BLOC[ver] * NB_BLOCS[ver];

/* ---------- Reed-Solomon (corps GF(256), polynôme 0x11D) ---------- */

function mulGF(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function diviseurRS(degre) {
  const r = new Array(degre).fill(0);
  r[degre - 1] = 1;
  let racine = 1;
  for (let i = 0; i < degre; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = mulGF(r[j], racine);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    racine = mulGF(racine, 0x02);
  }
  return r;
}

function resteRS(donnees, diviseur) {
  const r = diviseur.map(() => 0);
  for (const b of donnees) {
    const facteur = b ^ r.shift();
    r.push(0);
    diviseur.forEach((coef, i) => (r[i] ^= mulGF(coef, facteur)));
  }
  return r;
}

// Découpe les données en blocs, ajoute la correction de chaque bloc et entrelace le tout.
function ajouterCorrection(donnees, ver) {
  const nbBlocs = NB_BLOCS[ver];
  const eccLong = ECC_PAR_BLOC[ver];
  const total = Math.floor(modulesBruts(ver) / 8);
  const nbCourts = nbBlocs - (total % nbBlocs);
  const longCourt = Math.floor(total / nbBlocs);
  const diviseur = diviseurRS(eccLong);
  const blocs = [];
  for (let i = 0, k = 0; i < nbBlocs; i++) {
    const dat = donnees.slice(k, k + longCourt - eccLong + (i < nbCourts ? 0 : 1));
    k += dat.length;
    const ecc = resteRS(dat, diviseur);
    if (i < nbCourts) dat.push(0);
    blocs.push(dat.concat(ecc));
  }
  const r = [];
  for (let i = 0; i < blocs[0].length; i++) {
    blocs.forEach((b, j) => {
      if (i !== longCourt - eccLong || j >= nbCourts) r.push(b[i]);
    });
  }
  return r;
}

/* ---------- Matrice ---------- */

function positionsAlignement(ver, taille) {
  if (ver === 1) return [];
  const nb = Math.floor(ver / 7) + 2;
  const pas = Math.ceil((ver * 4 + 4) / (nb * 2 - 2)) * 2;
  const r = [6];
  for (let pos = taille - 7; r.length < nb; pos -= pas) r.splice(1, 0, pos);
  return r;
}

function construire(ver, codewords, masque) {
  const taille = ver * 4 + 17;
  const m = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const fonction = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const poser = (x, y, noir) => {
    m[y][x] = noir;
    fonction[y][x] = true;
  };

  // Lignes de synchronisation, repères des coins, motifs d'alignement.
  for (let i = 0; i < taille; i++) {
    poser(6, i, i % 2 === 0);
    poser(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [taille - 4, 3], [3, taille - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < taille && y >= 0 && y < taille) poser(x, y, d !== 2 && d !== 4);
    }
  }
  const al = positionsAlignement(ver, taille);
  al.forEach((ax, i) => al.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poser(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  // Format (niveau + masque), en deux exemplaires.
  const fmt = (FORMAT_M << 3) | masque;
  let rem = fmt;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bitsFormat = ((fmt << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) poser(8, i, bit(bitsFormat, i));
  poser(8, 7, bit(bitsFormat, 6));
  poser(8, 8, bit(bitsFormat, 7));
  poser(7, 8, bit(bitsFormat, 8));
  for (let i = 9; i < 15; i++) poser(14 - i, 8, bit(bitsFormat, i));
  for (let i = 0; i < 8; i++) poser(taille - 1 - i, 8, bit(bitsFormat, i));
  for (let i = 8; i < 15; i++) poser(8, taille - 15 + i, bit(bitsFormat, i));
  poser(8, taille - 8, true);

  // Numéro de version (à partir de la version 7).
  if (ver >= 7) {
    let r = ver;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const bits = (ver << 12) | r;
    for (let i = 0; i < 18; i++) {
      const a = taille - 11 + (i % 3);
      const b = Math.floor(i / 3);
      poser(a, b, bit(bits, i));
      poser(b, a, bit(bits, i));
    }
  }

  // Données, en zigzag par colonnes de deux, de droite à gauche.
  let i = 0;
  for (let droite = taille - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    for (let v = 0; v < taille; v++) {
      for (let j = 0; j < 2; j++) {
        const x = droite - j;
        const montant = ((droite + 1) & 2) === 0;
        const y = montant ? taille - 1 - v : v;
        if (!fonction[y][x] && i < codewords.length * 8) {
          m[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
  }

  // Masque.
  const inverser = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ][masque];
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) if (!fonction[y][x] && inverser(x, y)) m[y][x] = !m[y][x];
  return m;
}

// Pénalité de la norme : on garde le masque qui donne le code le plus facile à lire.
function penalite(m) {
  const taille = m.length;
  let p = 0;
  const lignes = [];
  for (let y = 0; y < taille; y++) lignes.push(m[y].map((b) => (b ? '1' : '0')).join(''));
  for (let x = 0; x < taille; x++) lignes.push(m.map((r) => (r[x] ? '1' : '0')).join(''));
  for (const l of lignes) {
    for (const suite of l.match(/0{5,}|1{5,}/g) || []) p += suite.length - 2;
    const bord = `0000${l}0000`;
    for (const motif of ['00001011101', '10111010000']) {
      for (let k = bord.indexOf(motif); k >= 0; k = bord.indexOf(motif, k + 1)) p += 40;
    }
  }
  let noirs = 0;
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) {
    if (m[y][x]) noirs++;
    if (x < taille - 1 && y < taille - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
  }
  const total = taille * taille;
  p += (Math.ceil(Math.abs(noirs * 20 - total * 10) / total) - 1) * 10;
  return p;
}

// Matrice du QR code (true = module noir) pour un texte, ou une erreur si le texte est trop long.
export function qrMatrice(texte) {
  const octets = [...new TextEncoder().encode(texte)];
  let ver = 1;
  const bitsNecessaires = (v) => 4 + (v < 10 ? 8 : 16) + octets.length * 8;
  while (ver <= MAX_VERSION && bitsNecessaires(ver) > codewordsDonnees(ver) * 8) ver++;
  if (ver > MAX_VERSION) throw new Error('Texte trop long pour un QR code.');

  const bits = [];
  const ecrire = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  ecrire(0b0100, 4); // mode octets
  ecrire(octets.length, ver < 10 ? 8 : 16);
  for (const o of octets) ecrire(o, 8);
  const capacite = codewordsDonnees(ver) * 8;
  ecrire(0, Math.min(4, capacite - bits.length));
  ecrire(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacite; pad ^= 0xec ^ 0x11) ecrire(pad, 8);
  const donnees = [];
  for (let i = 0; i < bits.length; i += 8) donnees.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  const codewords = ajouterCorrection(donnees, ver);
  let meilleure = null;
  let score = Infinity;
  for (let masque = 0; masque < 8; masque++) {
    const m = construire(ver, codewords, masque);
    const p = penalite(m);
    if (p < score) {
      score = p;
      meilleure = m;
    }
  }
  return meilleure;
}

// QR code en SVG (noir sur blanc, avec la marge blanche obligatoire de 4 modules).
export function qrSvg(texte, { titre = 'QR code' } = {}) {
  const m = qrMatrice(texte);
  const n = m.length + 8;
  let d = '';
  m.forEach((ligne, y) => ligne.forEach((noir, x) => { if (noir) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" role="img" aria-label="${titre}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
