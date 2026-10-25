// Plateau interactif : clic-clic ou glisser-déposer, à la souris comme au doigt.
// Dessins (comme sur chess.com) : clic droit + glisser = flèche, clic droit sur une case = surligner,
// au doigt : appui long + glisser. Clic gauche (ou toucher bref) = tout effacer.
import { piecePlateau } from './skins.js';
import { animer, nettoyer, animationActive } from './animations.js';

const FILES = 'abcdefgh';
const APPUI_LONG = 450; // ms

export const COULEURS_DESSIN = {
  orange: '#ff9f1a',
  vert: '#22c55e',
  rouge: '#ef4444',
  bleu: '#3b82f6',
};
const COULEUR_MOTEUR = '#16a34a';

// Icônes et avatars : toujours les pièces classiques. Sur l'échiquier, piecePlateau suit le skin choisi.
export function pieceSrc(color, type) {
  return `assets/pieces/${color}${type.toUpperCase()}.svg`;
}

export class Board {
  constructor(el, { onMove }) {
    this.el = el;
    this.onMove = onMove;
    this.state = null;
    this.selected = null;
    this.targets = new Map();
    this.drag = null;
    this.ghost = null;
    this.couleurDessin = 'orange';
    this.dessins = new Map(); // fen → { fleches: [{from, to, couleur}], cases: [{sq, couleur}] } (en mémoire seulement)
    this.dessin = null; // flèche en cours de tracé
    this.appui = null; // appui au doigt en attente (pour l'appui long)
    this.pieces = null; // pièces affichées : case → 'wn', 'bp'… (pour savoir quelle pièce vient de bouger)
    this.anim = null; // animation du dernier coup en cours : { coups, lache, debut, anim }
    this.lache = null; // case où l'élève vient de lâcher une pièce à la main (pas de trajet à animer)

    el.classList.add('board');
    el.addEventListener('pointerdown', (e) => this.#down(e));
    el.addEventListener('pointermove', (e) => this.#move(e));
    el.addEventListener('pointerup', (e) => this.#up(e));
    el.addEventListener('pointercancel', () => this.#cancelDrag());
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // chess : instance chess.js · orientation : 'w' | 'b' · movable : couleur jouable ou null
  // fleches : [{ from, to }] (flèches du moteur) · badge : { sq, html } (icône affichée sur une case)
  // indice : case à faire clignoter (aide dans les problèmes)
  // marqueurs : [{ sq, html }] (ex. étoiles à ramasser, au centre des cases)
  // fleches[i].couleur et cases : [{ sq, couleur }] (couleurs de COULEURS_DESSIN) servent aux schémas des cours
  set({ chess, orientation, movable, lastMove, fleches = [], badge = null, indice = null, marqueurs = [], cases = [] }) {
    const fen = chess.fen();
    if (!this.state || this.state.fen !== fen || movable !== this.state.movable) this.#clearSelection(false);
    const nouvelle = !this.state || this.state.fen !== fen || this.state.orientation !== orientation;
    const avant = this.pieces;
    const lache = this.lache;
    this.lache = null;
    if (nouvelle) this.#finAnimation();
    this.state = { chess, orientation, movable, lastMove, fen, fleches, badge, indice, marqueurs, cases };
    this.render();
    if (nouvelle && avant && lastMove) this.#animerCoup(avant, lastMove, lache === lastMove.to);
  }

  /* ---------- Animation du dernier coup ---------- */

  // N'anime que si l'affichage passe vraiment de « pièce sur from » à « pièce sur to » : revenir en arrière
  // dans une analyse ou charger une autre position ne rejoue rien.
  #animerCoup(avant, { from, to }, lache) {
    const p = avant.get(from);
    const arrivee = this.pieces.get(to);
    if (!p || this.pieces.has(from) || !arrivee || arrivee[0] !== p[0]) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const enPassant = p[1] === 'p' && from[0] !== to[0] && !avant.get(to);
    const prise = avant.get(to) || (enPassant ? avant.get(to[0] + from[1]) : null);
    const coups = [{ from, to, prise }];
    // Roque : la tour bouge aussi.
    if (p[1] === 'k' && Math.abs(FILES.indexOf(from[0]) - FILES.indexOf(to[0])) === 2) {
      const petit = to[0] === 'g';
      coups.push({ from: (petit ? 'h' : 'a') + to[1], to: (petit ? 'f' : 'd') + to[1], tour: true });
    }
    const anim = animationActive();
    this.anim = { coups, lache, anim, debut: performance.now() };
    this.el.classList.add('anim-en-cours');
    this.#jouerAnimation(0);
    this.anim.timer = setTimeout(() => this.#finAnimation(), anim.duree);
  }

  // ecoule > 0 : le plateau vient d'être redessiné pendant l'animation, on la reprend où elle en était.
  #jouerAnimation(ecoule) {
    const { coups, lache, anim } = this.anim;
    const cases = [];
    for (const { from, to, prise, tour } of coups) {
      const dest = this.el.querySelector(`[data-sq="${to}"]`);
      const origine = this.el.querySelector(`[data-sq="${from}"]`);
      const piece = dest?.querySelector('.piece');
      if (!piece) continue;
      const [x1, y1] = this.#centre(from);
      const [x2, y2] = this.#centre(to);
      animer({
        anim, dest, origine, piece, dx: x1 - x2, dy: y1 - y2,
        victime: prise ? piecePlateau(prise[0], prise[1]) : null,
        glisse: tour || !lache,
        secouer: ecoule ? null : this.el,
      });
      cases.push(dest, origine);
    }
    if (ecoule) {
      for (const c of cases) for (const a of c.getAnimations({ subtree: true })) a.currentTime = ecoule;
    }
  }

  #finAnimation() {
    if (!this.anim) return;
    clearTimeout(this.anim.timer);
    nettoyer(...this.anim.coups.flatMap(({ from, to }) => [this.el.querySelector(`[data-sq="${from}"]`), this.el.querySelector(`[data-sq="${to}"]`)]));
    this.el.classList.remove('anim-secousse', 'anim-en-cours');
    this.anim = null;
  }

  /* ---------- Dessins ---------- */

  #dessinsCourants(creer = false) {
    const fen = this.state.fen;
    if (!this.dessins.has(fen) && creer) this.dessins.set(fen, { fleches: [], cases: [] });
    return this.dessins.get(fen) || { fleches: [], cases: [] };
  }

  effacerDessins() {
    if (!this.state || !this.dessins.has(this.state.fen)) return false;
    this.dessins.delete(this.state.fen);
    this.render();
    return true;
  }

  #couleurPour(e) {
    if (e.shiftKey) return 'vert';
    if (e.ctrlKey || e.metaKey) return 'rouge';
    if (e.altKey) return 'bleu';
    return this.couleurDessin;
  }

  #commencerDessin(sq, couleur, pointerId) {
    this.dessin = { from: sq, to: sq, couleur };
    try { this.el.setPointerCapture(pointerId); } catch { /* pointeur déjà relâché */ }
    this.render();
  }

  #finirDessin() {
    const { from, to, couleur } = this.dessin;
    this.dessin = null;
    const d = this.#dessinsCourants(true);
    // Refaire le même dessin l'efface ; avec une autre couleur, il change de couleur.
    const basculer = (liste, trouve, nouveau) => {
      const i = liste.findIndex(trouve);
      if (i < 0) liste.push(nouveau);
      else if (liste[i].couleur === couleur) liste.splice(i, 1);
      else liste[i].couleur = couleur;
    };
    if (from === to) basculer(d.cases, (c) => c.sq === from, { sq: from, couleur });
    else {
      const avant = d.fleches.length;
      basculer(d.fleches, (f) => f.from === from && f.to === to, { from, to, couleur });
      if (d.fleches.length > avant) this.el.dispatchEvent(new CustomEvent('fleche-dessinee', { bubbles: true }));
    }
    this.render();
  }

  // Centre d'une case dans un repère 8×8 (0,0 = coin haut gauche affiché).
  #centre(sq) {
    const f = FILES.indexOf(sq[0]);
    const r = Number(sq[1]);
    const col = this.state.orientation === 'w' ? f : 7 - f;
    const row = this.state.orientation === 'w' ? 8 - r : r - 1;
    return [col + 0.5, row + 0.5];
  }

  #fleche(from, to, couleur, opacite = 0.8) {
    const [x1, y1] = this.#centre(from);
    const [x2, y2] = this.#centre(to);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const pts = [[x1, y1]];
    // Déplacement de cavalier : flèche en L, comme sur chess.com.
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) pts.push(dx > dy ? [x2, y1] : [x1, y2]);
    pts.push([x2, y2]);

    const [sx, sy] = pts[0];
    const [nx, ny] = pts[1];
    const d0 = Math.hypot(nx - sx, ny - sy);
    pts[0] = [sx + ((nx - sx) / d0) * 0.25, sy + ((ny - sy) / d0) * 0.25];

    const [px, py] = pts[pts.length - 2];
    const d = Math.hypot(x2 - px, y2 - py);
    const ux = (x2 - px) / d;
    const uy = (y2 - py) / d;
    const tete = 0.42;
    const bx = x2 - ux * tete;
    const by = y2 - uy * tete;
    const lx = -uy * 0.27;
    const ly = ux * 0.27;
    pts[pts.length - 1] = [bx, by];

    return `<g opacity="${opacite}">
      <polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${couleur}" stroke-width="0.18" stroke-linejoin="round"/>
      <polygon points="${x2},${y2} ${bx + lx},${by + ly} ${bx - lx},${by - ly}" fill="${couleur}"/>
    </g>`;
  }

  #svg() {
    let traits = this.state.fleches.map(({ from, to, couleur }) => this.#fleche(from, to, COULEURS_DESSIN[couleur] || COULEUR_MOTEUR, 0.85)).join('');
    traits += this.#dessinsCourants().fleches.map((f) => this.#fleche(f.from, f.to, COULEURS_DESSIN[f.couleur])).join('');
    if (this.dessin && this.dessin.from !== this.dessin.to) {
      traits += this.#fleche(this.dessin.from, this.dessin.to, COULEURS_DESSIN[this.dessin.couleur], 0.6);
    }
    return `<svg class="fleches" viewBox="0 0 8 8" aria-hidden="true">${traits}</svg>`;
  }

  #majSvg() {
    const ancien = this.el.querySelector('.fleches');
    if (ancien) ancien.outerHTML = this.#svg();
  }

  /* ---------- Affichage ---------- */

  render() {
    const { chess, orientation, lastMove, badge } = this.state;
    const board = chess.board();
    this.targets = this.selected
      ? new Map(chess.moves({ square: this.selected, verbose: true }).map((m) => [m.to, m]))
      : new Map();
    const marques = new Map([...this.state.cases, ...this.#dessinsCourants().cases].map((c) => [c.sq, c.couleur]));

    let checkSq = null;
    if (chess.inCheck()) {
      for (const row of board) for (const p of row) if (p && p.type === 'k' && p.color === chess.turn()) checkSq = p.square;
    }

    let html = '';
    this.pieces = new Map();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const r = orientation === 'w' ? row : 7 - row;
        const f = orientation === 'w' ? col : 7 - col;
        const sq = FILES[f] + (8 - r);
        const piece = board[r][f];
        const cls = ['sq', (r + f) % 2 === 0 ? 'light' : 'dark'];
        if (lastMove && (lastMove.from === sq || lastMove.to === sq)) cls.push('last');
        if (this.selected === sq) cls.push('selected');
        if (checkSq === sq) cls.push('check');
        if (this.state.indice === sq) cls.push('indice');
        const t = this.targets.get(sq);
        if (t) cls.push(t.captured ? 'target capture' : 'target');
        if (this.drag?.started && this.drag.from === sq) cls.push('dragging');

        html += `<div class="${cls.join(' ')}" data-sq="${sq}">`;
        if (marques.has(sq)) html += `<span class="marque" style="background:${COULEURS_DESSIN[marques.get(sq)]}"></span>`;
        if (col === 0) html += `<span class="coord rank">${8 - r}</span>`;
        if (row === 7) html += `<span class="coord file">${FILES[f]}</span>`;
        if (piece) {
          html += `<img class="piece" src="${piecePlateau(piece.color, piece.type)}" alt="" draggable="false">`;
          this.pieces.set(sq, piece.color + piece.type);
        }
        for (const m of this.state.marqueurs) if (m.sq === sq) html += `<span class="marqueur">${m.html}</span>`;
        if (badge?.sq === sq) html += `<span class="badge-case">${badge.html}</span>`;
        html += '</div>';
      }
    }
    this.el.innerHTML = html + this.#svg();
    if (this.anim) this.#jouerAnimation(performance.now() - this.anim.debut);
  }

  #clearSelection(rerender = true) {
    this.selected = null;
    this.targets = new Map();
    if (rerender && this.state) this.render();
  }

  #squareAt(x, y) {
    const sqEl = document.elementFromPoint(x, y)?.closest('.sq');
    return sqEl && this.el.contains(sqEl) ? sqEl.dataset.sq : null;
  }

  #play(from, to) {
    this.#clearSelection();
    this.onMove(from, to);
  }

  /* ---------- Souris / doigt ---------- */

  #down(e) {
    const sq = this.#squareAt(e.clientX, e.clientY);
    if (!sq || !this.state) return;
    const souris = e.pointerType === 'mouse';

    // Clic droit : dessin.
    if (souris && e.button === 2) {
      e.preventDefault();
      this.#commencerDessin(sq, this.#couleurPour(e), e.pointerId);
      return;
    }
    if (souris && e.button !== 0) return;

    if (souris) {
      // Clic gauche : efface les dessins de la position (comme sur chess.com).
      this.dessins.delete(this.state.fen);
    } else {
      // Au doigt : un appui long lance le dessin, un toucher bref efface.
      clearTimeout(this.appui?.timer);
      const pointerId = e.pointerId;
      this.appui = { sq, x: e.clientX, y: e.clientY, bref: true, timer: setTimeout(() => this.#appuiLong(pointerId), APPUI_LONG) };
      try { this.el.setPointerCapture(pointerId); } catch { /* rien */ }
    }

    if (!this.state.movable) {
      this.render();
      return;
    }
    if (this.selected && this.targets.has(sq)) {
      this.#play(this.selected, sq);
      return;
    }
    const piece = this.state.chess.get(sq);
    if (piece && piece.color === this.state.movable) {
      e.preventDefault();
      const wasSelected = this.selected === sq;
      this.selected = sq;
      this.render();
      this.drag = { from: sq, x: e.clientX, y: e.clientY, started: false, wasSelected };
      this.el.setPointerCapture(e.pointerId);
    } else {
      this.#clearSelection();
    }
  }

  #appuiLong(pointerId) {
    const a = this.appui;
    if (!a || this.drag?.started) return;
    a.bref = false;
    this.drag = null;
    this.selected = null;
    this.targets = new Map();
    navigator.vibrate?.(15);
    this.#commencerDessin(a.sq, this.couleurDessin, pointerId);
  }

  #move(e) {
    if (this.dessin) {
      const sq = this.#squareAt(e.clientX, e.clientY);
      if (sq && sq !== this.dessin.to) {
        this.dessin.to = sq;
        this.#majSvg();
      }
      return;
    }
    if (this.appui && Math.hypot(e.clientX - this.appui.x, e.clientY - this.appui.y) > 8) {
      // Le doigt bouge : c'est un déplacement de pièce, pas un appui long.
      clearTimeout(this.appui.timer);
      this.appui = null;
    }
    const d = this.drag;
    if (!d) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return;
      d.started = true;
      const piece = this.state.chess.get(d.from);
      const size = this.el.getBoundingClientRect().width / 8;
      this.ghost = document.createElement('img');
      this.ghost.className = 'piece-ghost';
      this.ghost.src = piecePlateau(piece.color, piece.type);
      this.ghost.style.width = this.ghost.style.height = `${size}px`;
      document.body.appendChild(this.ghost);
      this.render();
    }
    this.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    const over = this.#squareAt(e.clientX, e.clientY);
    for (const el of this.el.querySelectorAll('.sq.hover')) el.classList.remove('hover');
    if (over && this.targets.has(over)) this.el.querySelector(`[data-sq="${over}"]`)?.classList.add('hover');
  }

  #up(e) {
    if (this.dessin) {
      this.appui = null;
      this.#finirDessin();
      return;
    }
    if (this.appui) {
      clearTimeout(this.appui.timer);
      const bref = this.appui.bref;
      this.appui = null;
      if (bref && this.dessins.has(this.state.fen)) {
        this.dessins.delete(this.state.fen);
        if (!this.drag) this.render();
      }
    }
    const d = this.drag;
    if (!d) return;
    this.#removeGhost();
    this.drag = null;
    if (d.started) {
      const sq = this.#squareAt(e.clientX, e.clientY);
      if (sq && this.targets.has(sq)) {
        this.lache = sq;
        this.#play(d.from, sq);
      } else this.render();
    } else if (d.wasSelected) {
      this.#clearSelection();
    } else {
      this.render();
    }
  }

  #cancelDrag() {
    clearTimeout(this.appui?.timer);
    this.appui = null;
    this.dessin = null;
    this.#removeGhost();
    this.drag = null;
    if (this.state) this.render();
  }

  #removeGhost() {
    this.ghost?.remove();
    this.ghost = null;
  }

  destroy() {
    clearTimeout(this.appui?.timer);
    clearTimeout(this.anim?.timer);
    this.#removeGhost();
  }
}

// Petite barre sous le plateau : couleur des dessins + bouton pour tout effacer.
export function monterBarreDessin(conteneur, board) {
  const tactile = matchMedia('(pointer: coarse)').matches;
  conteneur.classList.add('dessin-bar');
  conteneur.innerHTML = `
    <span class="dessin-label">Dessin</span>
    ${Object.entries(COULEURS_DESSIN).map(([nom, c]) => `
      <button type="button" class="dessin-couleur" data-couleur-dessin="${nom}" style="--c:${c}" aria-label="Couleur ${nom}" aria-pressed="${nom === board.couleurDessin}"></button>`).join('')}
    <button type="button" class="btn ghost dessin-effacer">Effacer</button>
    <span class="dessin-aide">${tactile ? 'Appui long puis glisse pour une flèche' : 'Clic droit + glisser : flèche · clic droit : case'}</span>`;
  conteneur.querySelectorAll('[data-couleur-dessin]').forEach((b) =>
    b.addEventListener('click', () => {
      board.couleurDessin = b.dataset.couleurDessin;
      conteneur.querySelectorAll('[data-couleur-dessin]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    }));
  conteneur.querySelector('.dessin-effacer').addEventListener('click', () => board.effacerDessins());
}
