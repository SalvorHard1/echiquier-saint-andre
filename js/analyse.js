// Analyse d'une partie (PGN) par Stockfish, entièrement sur l'appareil.
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc, monterBarreDessin } from './board.js';
import { obtenirMoteur } from './engine.js';
import { signaler } from './succes.js';

// Profondeur visée, avec un temps maximum par position (la version « lite » de Stockfish a besoin
// d'environ 18 demi-coups pour voir certains sacrifices).
const PROFONDEUR = 18;
const TEMPS_MAX = 2500;

export const CATEGORIES = {
  tresbon: {
    nom: 'Très bon coup', court: 'Très bon', couleur: '#2563eb',
    svg: '<path d="M12 5.5v8.5" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="18.6" r="1.9" fill="#fff"/>',
  },
  bon: {
    nom: 'Bon coup', court: 'Bon', couleur: '#16a34a',
    svg: '<path d="M5 11h2.6v7.5H5zM9 18.5V11l3.1-5.1c.4-.7 1.4-.8 1.9-.2.4.4.5 1 .3 1.5L13.5 10h4c1 0 1.8.9 1.6 1.9l-1.1 5.3c-.2.8-.9 1.3-1.7 1.3z" fill="#fff"/>',
  },
  correct: {
    nom: 'Coup correct', court: 'Correct', couleur: '#f59e0b',
    svg: '<path d="M6.8 12.6l3.4 3.4 7-7.6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  mauvais: {
    nom: 'Mauvais coup', court: 'Mauvais', couleur: '#dc2626',
    svg: '<path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
  },
};

export function iconeCoup(cat, cls = '') {
  const c = CATEGORIES[cat];
  return `<svg class="icone-coup ${cls}" viewBox="0 0 24 24" role="img" aria-label="${c.nom}"><circle cx="12" cy="12" r="12" fill="${c.couleur}"/>${c.svg}</svg>`;
}

// Pourcentage de chances de gain des Blancs (formule utilisée par Lichess).
function chancesBlancs(ev) {
  if (!ev) return 50;
  if (ev.gagnant) return ev.gagnant === 'w' ? 100 : 0;
  if (ev.mate !== undefined) return ev.mate > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * ev.cp)) - 1);
}

function texteEval(ev) {
  if (!ev) return '';
  if (ev.gagnant) return ev.gagnant === 'w' ? '1-0' : '0-1';
  if (ev.mate !== undefined) return `M${Math.abs(ev.mate)}`;
  const v = ev.cp / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

// Seuils en points de « chances de gain » perdus par le coup.
function classer(perte, estMeilleur) {
  // « Meilleur coup » ne compte que si l'évaluation suivante le confirme (le moteur peut se tromper).
  if ((estMeilleur && perte <= 5) || perte <= 1) return 'tresbon';
  if (perte <= 5) return 'bon';
  if (perte <= 12) return 'correct';
  return 'mauvais';
}

const precisionCoup = (perte) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * perte) - 3.1669));

function lirePgn(texte) {
  const chess = new Chess();
  try {
    chess.loadPgn(texte.trim());
  } catch {
    return null;
  }
  const coups = chess.history({ verbose: true });
  if (!coups.length) return null;
  const entetes = (chess.getHeaders ? chess.getHeaders() : chess.header()) || {};
  return { coups, entetes };
}

const EXEMPLE = `[Event "Opéra de Paris"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duc de Brunswick et comte Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7
8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7
14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

/* ---------- Écran d'import ---------- */

export function showAnalyse($app, { pgn = null } = {}) {
  let nettoyer = () => {};
  const partie = pgn && lirePgn(pgn);
  if (partie) {
    nettoyer = vueAnalyse($app, partie, () => { nettoyer(); nettoyer = vueImport(); });
  } else {
    nettoyer = vueImport();
  }
  return () => nettoyer();

  function vueImport(texteInitial = '') {
    $app.innerHTML = `
      <section class="page">
        <div class="page-head">
          <a href="#/" class="btn ghost">← Accueil</a>
          <h1>Analyser une partie</h1>
        </div>
        <p class="intro">Colle ta partie au format PGN ou importe un fichier : Stockfish corrige chaque coup.</p>
        <div class="import">
          <textarea id="pgn" class="pgn-input" spellcheck="false" placeholder="[White &quot;…&quot;]&#10;[Black &quot;…&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 …"></textarea>
          <div class="import-actions">
            <label class="btn">
              <input type="file" id="fichier" accept=".pgn,.txt,application/x-chess-pgn,text/plain" hidden>
              Importer un fichier
            </label>
            <button type="button" class="btn" id="exemple">Exemple</button>
            <button type="button" class="btn primary big" id="analyser">Analyser</button>
          </div>
          <p class="erreur" id="erreur" hidden></p>
          <div class="legende">
            ${Object.keys(CATEGORIES).map((k) => `<span>${iconeCoup(k)}${CATEGORIES[k].nom}</span>`).join('')}
          </div>
          <p class="note">Ta partie est analysée directement sur ton appareil : elle n'est envoyée nulle part et n'est pas enregistrée.</p>
        </div>
      </section>`;
    const $txt = $app.querySelector('#pgn');
    const $err = $app.querySelector('#erreur');
    $txt.value = texteInitial;

    // Le fichier est lu localement par le navigateur (aucun envoi).
    $app.querySelector('#fichier').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 1_000_000) {
        $err.textContent = 'Ce fichier est trop gros pour une seule partie.';
        $err.hidden = false;
        return;
      }
      $txt.value = await f.text();
      $err.hidden = true;
    });
    $app.querySelector('#exemple').addEventListener('click', () => {
      $txt.value = EXEMPLE;
      $err.hidden = true;
    });
    $app.querySelector('#analyser').addEventListener('click', () => {
      const p = lirePgn($txt.value);
      if (!p) {
        $err.textContent = $txt.value.trim()
          ? 'Ce PGN n’est pas valide. Vérifie qu’il contient bien les coups de la partie (ex. « 1. e4 e5 2. Nf3 … »).'
          : 'Colle d’abord une partie ou importe un fichier.';
        $err.hidden = false;
        return;
      }
      const texte = $txt.value;
      nettoyer = vueAnalyse($app, p, () => { nettoyer(); nettoyer = vueImport(texte); });
    });
    return () => {};
  }
}

/* ---------- Écran d'analyse ---------- */

function vueAnalyse($app, { coups, entetes }, retour) {
  const n = coups.length;
  const fens = [coups[0].before, ...coups.map((m) => m.after)];
  const evals = Array(n + 1).fill(null); // point de vue des Blancs
  const meilleurs = Array(n + 1).fill(null); // meilleur coup UCI dans chaque position
  const classes = Array(n).fill(null);
  const pertes = Array(n).fill(null);
  let idx = 0;
  let orientation = 'w';
  let actif = true;
  let erreurMoteur = false;
  let analyses = 0;

  const nom = (c) => {
    const v = entetes[c === 'w' ? 'White' : 'Black'];
    return v && v !== '?' ? v : c === 'w' ? 'Blancs' : 'Noirs';
  };
  const uci = (m) => m.from + m.to + (m.promotion || '');

  $app.innerHTML = `
    <section class="game analyse">
      <div class="page-head">
        <button type="button" class="btn ghost" id="retour">← Nouvelle analyse</button>
        <h1>Analyse</h1>
        ${entetes.Result && entetes.Result !== '*' ? `<span class="cad-chip">Résultat : ${entetes.Result}</span>` : ''}
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div class="player-bar" id="bar-haut"></div>
          <div class="board-row">
            <div class="evalbar" id="evalbar"><div class="evalbar-blanc"></div><span class="evalbar-txt"></span></div>
            <div id="board"></div>
          </div>
          <div class="player-bar" id="bar-bas"></div>
          <div id="dessin"></div>
          <div class="nav-coups">
            <button type="button" class="btn" data-nav="debut" aria-label="Début">⏮</button>
            <button type="button" class="btn" data-nav="prec" aria-label="Coup précédent">◀</button>
            <button type="button" class="btn" data-nav="suiv" aria-label="Coup suivant">▶</button>
            <button type="button" class="btn" data-nav="fin" aria-label="Fin">⏭</button>
            <button type="button" class="btn" data-nav="tourner" aria-label="Tourner le plateau">⇅</button>
          </div>
        </div>
        <aside class="panel">
          <div id="progression" class="progression"></div>
          <div id="commentaire" class="commentaire"></div>
          <div id="graphe" class="graphe" title="Clique pour aller à ce moment de la partie"></div>
          <div id="bilan"></div>
          <ol class="moves" id="moves"></ol>
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  monterBarreDessin($('#dessin'), board);

  function evaluerCoup(i) {
    // i : index du coup (0 = premier coup), entre la position i et la position i + 1
    if (!evals[i] || !evals[i + 1]) return;
    const m = coups[i];
    let avant = chancesBlancs(evals[i]);
    let apres = chancesBlancs(evals[i + 1]);
    if (m.color === 'b') { avant = 100 - avant; apres = 100 - apres; }
    const perte = Math.max(0, avant - apres);
    pertes[i] = perte;
    classes[i] = m.san.endsWith('#') ? 'tresbon' : classer(perte, meilleurs[i] === uci(m));
    // Laisser un mat forcé à l'adversaire est toujours une erreur, même dans une position déjà difficile.
    if (matContre(evals[i + 1], m.color) && !matContre(evals[i], m.color)) classes[i] = 'mauvais';
  }

  function matContre(ev, c) {
    if (ev.gagnant) return ev.gagnant !== c;
    return ev.mate !== undefined && (c === 'w' ? ev.mate < 0 : ev.mate > 0);
  }

  function sanDepuis(fen, coupUci) {
    try {
      return new Chess(fen).move({ from: coupUci.slice(0, 2), to: coupUci.slice(2, 4), promotion: coupUci[4] }).san;
    } catch {
      return coupUci;
    }
  }

  /* --- Affichage --- */

  function barre(c) {
    return `<span class="avatar small neutre"><img src="${pieceSrc(c, 'k')}" alt=""></span>
      <span class="player-name">${nom(c)}</span>`;
  }

  function majEvalBar() {
    const ev = evals[idx];
    const w = chancesBlancs(ev);
    const $bar = $('#evalbar');
    $bar.classList.toggle('inverse', orientation === 'b');
    $bar.querySelector('.evalbar-blanc').style.height = `${ev ? w : 50}%`;
    const $t = $bar.querySelector('.evalbar-txt');
    $t.textContent = texteEval(ev);
    $t.classList.toggle('cote-blanc', w >= 50);
  }

  function majGraphe() {
    const pts = [];
    for (let i = 0; i <= n && evals[i]; i++) pts.push([i, 100 - chancesBlancs(evals[i])]);
    const largeur = Math.max(n, 1);
    const aire = pts.length > 1
      ? `<path class="graphe-blanc" d="M0,100 ${pts.map(([x, y]) => `L${x},${y.toFixed(1)}`).join(' ')} L${pts[pts.length - 1][0]},100 Z"/>`
      : '';
    const erreurs = classes
      .map((c, i) => (c === 'mauvais' && evals[i + 1] ? `<line class="graphe-erreur" x1="${i + 1}" x2="${i + 1}" y1="0" y2="100"/>` : ''))
      .join('');
    $('#graphe').innerHTML = `
      <svg viewBox="0 0 ${largeur} 100" preserveAspectRatio="none">
        ${aire}
        <line class="graphe-milieu" x1="0" x2="${largeur}" y1="50" y2="50"/>
        ${erreurs}
        <line class="graphe-curseur" x1="${idx}" x2="${idx}" y1="0" y2="100"/>
      </svg>`;
  }

  function majBilan() {
    const stats = { w: { tresbon: 0, bon: 0, correct: 0, mauvais: 0, prec: [] }, b: { tresbon: 0, bon: 0, correct: 0, mauvais: 0, prec: [] } };
    classes.forEach((c, i) => {
      if (!c) return;
      const s = stats[coups[i].color];
      s[c]++;
      s.prec.push(precisionCoup(pertes[i]));
    });
    const prec = (c) => (stats[c].prec.length ? (stats[c].prec.reduce((a, b) => a + b, 0) / stats[c].prec.length).toFixed(1) : '–');
    $('#bilan').innerHTML = `
      <table class="bilan">
        <thead><tr><th></th><th>${nom('w')}</th><th>${nom('b')}</th></tr></thead>
        <tbody>
          <tr class="precision"><td>Précision</td><td>${prec('w')}</td><td>${prec('b')}</td></tr>
          ${Object.keys(CATEGORIES).map((k) => `
            <tr><td>${iconeCoup(k)}${CATEGORIES[k].court}</td><td>${stats.w[k]}</td><td>${stats.b[k]}</td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  function majCoups() {
    let html = '';
    for (let i = 0; i < n; i += 2) {
      const cell = (j) => {
        if (j >= n) return '<span></span>';
        return `<button type="button" class="coup ${idx === j + 1 ? 'current' : ''}" data-i="${j + 1}">
          ${classes[j] ? iconeCoup(classes[j], 'mini') : '<span class="mini vide"></span>'}${coups[j].san}</button>`;
      };
      html += `<li>${cell(i)}${cell(i + 1)}</li>`;
    }
    const $m = $('#moves');
    $m.innerHTML = html;
    // Garde le coup affiché visible dans la liste (sans faire défiler toute la page).
    const cur = $m.querySelector('.current');
    if (cur) {
      const haut = cur.offsetTop;
      if (haut < $m.scrollTop || haut + cur.offsetHeight > $m.scrollTop + $m.clientHeight) {
        $m.scrollTop = haut - $m.clientHeight / 2;
      }
    }
  }

  function majCommentaire() {
    const $c = $('#commentaire');
    if (idx === 0) {
      $c.innerHTML = '<p>Position de départ. Avance coup par coup avec <strong>▶</strong> ou les flèches du clavier.</p>';
      return;
    }
    const m = coups[idx - 1];
    const numero = `${Math.ceil(idx / 2)}.${m.color === 'b' ? '..' : ''} ${m.san}`;
    const cat = classes[idx - 1];
    if (!cat) {
      $c.innerHTML = `<p><strong>${numero}</strong> — analyse en cours…</p>`;
      return;
    }
    const meilleur = meilleurs[idx - 1];
    const sanMeilleur = meilleur && meilleur !== uci(m) ? sanDepuis(fens[idx - 1], meilleur) : null;
    const explications = {
      tresbon: m.san.endsWith('#') ? 'Échec et mat !' : sanMeilleur ? 'Presque aussi fort que le coup du moteur.' : 'C’est le meilleur coup.',
      bon: 'Un bon coup, qui garde la position.',
      correct: 'Jouable, mais il y avait mieux.',
      mauvais: matContre(evals[idx], m.color) && !matContre(evals[idx - 1], m.color)
        ? 'Ce coup permet à l’adversaire de forcer le mat !'
        : 'Ce coup fait perdre beaucoup d’avantage.',
    };
    $c.innerHTML = `
      <div class="commentaire-tete cat-${cat}">${iconeCoup(cat)}<span><strong>${numero}</strong> · ${CATEGORIES[cat].nom}</span><span class="eval">${texteEval(evals[idx])}</span></div>
      <p>${explications[cat]}${sanMeilleur && cat !== 'tresbon' ? ` Le meilleur coup était <strong>${sanMeilleur}</strong> (flèche verte).` : ''}</p>`;
  }

  function majProgression() {
    const $p = $('#progression');
    if (erreurMoteur) {
      $p.innerHTML = '<p class="erreur">Le moteur n’a pas pu se charger. Recharge la page.</p>';
    } else if (analyses <= n) {
      const pct = Math.round((analyses / (n + 1)) * 100);
      $p.innerHTML = `<div class="prog-texte">Analyse en cours… ${pct} %</div><div class="prog"><div style="width:${pct}%"></div></div>`;
    } else {
      $p.innerHTML = '';
    }
  }

  function majPlateau() {
    const chess = new Chess(fens[idx]);
    const m = coups[idx - 1];
    const cat = classes[idx - 1];
    const meilleur = m && meilleurs[idx - 1];
    const fleches = m && cat && cat !== 'tresbon' && meilleur && meilleur !== uci(m)
      ? [{ from: meilleur.slice(0, 2), to: meilleur.slice(2, 4) }]
      : [];
    board.set({
      chess,
      orientation,
      movable: null,
      lastMove: m && { from: m.from, to: m.to },
      fleches,
      badge: m && cat ? { sq: m.to, html: iconeCoup(cat) } : null,
    });
  }

  function maj() {
    majPlateau();
    $('#bar-bas').innerHTML = barre(orientation);
    $('#bar-haut').innerHTML = barre(orientation === 'w' ? 'b' : 'w');
    majEvalBar();
    majGraphe();
    majBilan();
    majCoups();
    majCommentaire();
    majProgression();
    $app.querySelector('[data-nav="debut"]').disabled = idx === 0;
    $app.querySelector('[data-nav="prec"]').disabled = idx === 0;
    $app.querySelector('[data-nav="suiv"]').disabled = idx === n;
    $app.querySelector('[data-nav="fin"]').disabled = idx === n;
  }

  function aller(i) {
    idx = Math.max(0, Math.min(n, i));
    maj();
  }

  /* --- Évènements --- */

  $('#retour').addEventListener('click', retour);
  $app.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.nav;
    if (a === 'debut') aller(0);
    if (a === 'prec') aller(idx - 1);
    if (a === 'suiv') aller(idx + 1);
    if (a === 'fin') aller(n);
    if (a === 'tourner') { orientation = orientation === 'w' ? 'b' : 'w'; maj(); }
  }));
  $('#moves').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) aller(Number(b.dataset.i));
  });
  $('#graphe').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    aller(Math.round(((e.clientX - r.left) / r.width) * n));
  });
  const clavier = (e) => {
    if (e.target.closest('input, textarea') || document.querySelector('dialog[open]')) return;
    const actions = { ArrowLeft: idx - 1, ArrowRight: idx + 1, Home: 0, End: n };
    if (e.key in actions) {
      e.preventDefault();
      aller(actions[e.key]);
    }
  };
  document.addEventListener('keydown', clavier);

  /* --- Analyse, position par position --- */

  async function lancer() {
    const moteur = obtenirMoteur();
    for (let i = 0; i <= n && actif; i++) {
      const pos = new Chess(fens[i]);
      if (pos.isCheckmate()) {
        evals[i] = { gagnant: pos.turn() === 'w' ? 'b' : 'w' };
      } else if (pos.isStalemate() || pos.isInsufficientMaterial()) {
        evals[i] = { cp: 0 };
      } else {
        try {
          const { score, best } = await moteur.analyse(fens[i], { depth: PROFONDEUR, movetime: TEMPS_MAX });
          if (!actif) return;
          const signe = pos.turn() === 'w' ? 1 : -1;
          evals[i] = !score ? { cp: 0 } : score.type === 'mate' ? { mate: signe * score.value } : { cp: signe * score.value };
          meilleurs[i] = best;
        } catch (e) {
          console.error(e);
          erreurMoteur = true;
          maj();
          return;
        }
      }
      analyses = i + 1;
      if (i > 0) evaluerCoup(i - 1);
      maj();
    }
    if (actif) signaler('analyse', { precision: precisionEleve() });
  }

  // Précision du camp joué par l'élève (parties venant de l'application), sinon rien.
  function precisionEleve() {
    const camp = entetes.White === 'Élève' ? 'w' : entetes.Black === 'Élève' ? 'b' : null;
    if (!camp) return null;
    const p = pertes.filter((x, i) => x !== null && coups[i].color === camp).map(precisionCoup);
    return p.length >= 5 ? p.reduce((a, b) => a + b, 0) / p.length : null;
  }

  maj();
  lancer();

  return () => {
    actif = false;
    document.removeEventListener('keydown', clavier);
    board.destroy();
  };
}
