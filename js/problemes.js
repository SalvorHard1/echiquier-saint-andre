// Problèmes (base Lichess, domaine public) : entraînement par niveau et course contre la montre.
// Tout reste en mémoire : rien n'est enregistré, la session s'efface à la fermeture de l'onglet.
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc, monterBarreDessin } from './board.js';
import { formatTemps } from './cadences.js';
import { modal } from './modal.js';
import { signaler } from './succes.js';
import { carteDefi } from './defi.js';

export const NIVEAUX = [
  { nom: 'Pion',     piece: 'P', titre: 'Débutant',      min: 399,  max: 800,  couleur: '#16a34a', desc: 'Mats en 1 et pièces laissées en prise.' },
  { nom: 'Cavalier', piece: 'N', titre: 'Facile',        min: 800,  max: 1200, couleur: '#0d9488', desc: 'Premières fourchettes et premiers clouages.' },
  { nom: 'Fou',      piece: 'B', titre: 'Intermédiaire', min: 1200, max: 1600, couleur: '#2563eb', desc: 'Combinaisons en 2 ou 3 coups.' },
  { nom: 'Tour',     piece: 'R', titre: 'Avancé',        min: 1600, max: 2000, couleur: '#4f46e5', desc: 'Il faut calculer plus loin.' },
  { nom: 'Dame',     piece: 'Q', titre: 'Expert',        min: 2000, max: 2400, couleur: '#9333ea', desc: 'Sacrifices et coups calmes.' },
  { nom: 'Roi',      piece: 'K', titre: 'Maître',        min: 2400, max: 3300, couleur: '#dc2626', desc: 'Seulement pour les plus courageux.' },
];

export const THEMES = [
  { id: 'tous',       nom: 'Tous',                    test: () => true },
  { id: 'mat',        nom: 'Mats',                    test: (t) => t.includes('mate') },
  { id: 'fourchette', nom: 'Fourchette',              test: (t) => t.includes('fork') },
  { id: 'clouage',    nom: 'Clouage & enfilade',      test: (t) => /pin|skewer/.test(t) },
  { id: 'decouverte', nom: 'Attaque à la découverte', test: (t) => t.includes('discovered') },
  { id: 'sacrifice',  nom: 'Sacrifice',               test: (t) => /sacrifice|deflection|attraction/.test(t) },
  { id: 'prise',      nom: 'Pièce en prise',          test: (t) => /hangingPiece|trappedPiece/.test(t) },
  { id: 'finale',     nom: 'Finale',                  test: (t) => /endgame|promotion|advancedPawn/.test(t) },
];

const NOMS_THEMES = {
  mateIn1: 'Mat en 1', mateIn2: 'Mat en 2', mateIn3: 'Mat en 3', mateIn4: 'Mat en 4', mate: 'Mat',
  fork: 'Fourchette', pin: 'Clouage', skewer: 'Enfilade', discoveredAttack: 'Attaque à la découverte',
  discoveredCheck: 'Échec à la découverte', sacrifice: 'Sacrifice', hangingPiece: 'Pièce en prise',
  deflection: 'Déviation', attraction: 'Attraction', backRankMate: 'Mat du couloir', promotion: 'Promotion',
  advancedPawn: 'Pion avancé', endgame: 'Finale', defensiveMove: 'Coup défensif', quietMove: 'Coup calme',
  trappedPiece: 'Pièce piégée', exposedKing: 'Roi exposé', kingsideAttack: 'Attaque sur le roque',
  opening: 'Ouverture', middlegame: 'Milieu de jeu', zugzwang: 'Zugzwang', intermezzo: 'Coup intermédiaire',
  clearance: 'Dégagement',
};

const ICONE_OK = '<svg class="icone-coup" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M6.8 12.6l3.4 3.4 7-7.6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICONE_KO = '<svg class="icone-coup" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#dc2626"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';

const session = { vus: new Set(), cotes: {}, resolus: {}, record: 0, theme: 'tous' };

let donnees = null;
export function charger() {
  donnees ??= fetch('data/problemes.json')
    .then((r) => {
      if (!r.ok) throw new Error('Fichier des problèmes introuvable');
      return r.json();
    })
    .then((a) => a.map(([id, fen, moves, rating, themes]) => ({ id, fen, coups: moves.split(' '), rating, themes })))
    .catch((e) => {
      donnees = null;
      throw e;
    });
  return donnees;
}

// Choisit un problème non vu, proche de la difficulté visée (avec un peu de hasard).
function choisir(pool, cible) {
  let dispo = pool.filter((p) => !session.vus.has(p.id));
  if (!dispo.length) {
    pool.forEach((p) => session.vus.delete(p.id));
    dispo = pool;
  }
  dispo = [...dispo].sort((a, b) => Math.abs(a.rating - cible) - Math.abs(b.rating - cible));
  const p = dispo[Math.floor(Math.random() * Math.min(6, dispo.length))];
  session.vus.add(p.id);
  return p;
}

export function nomsThemes(p) {
  return p.themes.split(' ').filter((t) => NOMS_THEMES[t] && t !== 'mate').map((t) => NOMS_THEMES[t]);
}

export function matEn(p) {
  const m = p.themes.match(/mateIn(\d)/);
  return m ? Number(m[1]) : null;
}

export function confettis(cible) {
  const r = cible.getBoundingClientRect();
  const couleurs = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#06b6d4'];
  for (let i = 0; i < 28; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = `${r.left + r.width / 2}px`;
    c.style.top = `${r.top + r.height / 2}px`;
    c.style.background = couleurs[i % couleurs.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * r.width * 0.45;
    c.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    c.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
    c.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1000);
  }
}

/* ---------- Résolution d'un problème ---------- */

// Le premier coup de la liste est celui de l'adversaire ; l'élève joue ensuite les coups suivants.
export function lancerProbleme(board, p, { onEtat, onFin, delaiDebut = 700 }) {
  const chess = new Chess(p.fen);
  const coups = p.coups;
  const joueur = chess.turn() === 'w' ? 'b' : 'w';
  let k = 0;
  let fini = false;
  let auto = false;
  let erreur = false;
  let aide = false;
  let dernier = null;
  let badge = null;
  let indice = null;
  let fleches = [];
  const timers = new Set();

  const plusTard = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const peutJouer = () => !fini && !auto && k % 2 === 1 && chess.turn() === joueur;

  function afficher() {
    board.set({ chess, orientation: joueur, movable: peutJouer() ? joueur : null, lastMove: dernier, badge, indice, fleches });
  }

  function jouerUci(u) {
    const m = chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    dernier = { from: m.from, to: m.to };
  }

  function coupAdverse() {
    jouerUci(coups[k]);
    k++;
    badge = null;
    afficher();
    onEtat('tour');
  }

  board.onMove = (from, to) => {
    if (!peutJouer()) return;
    const attendu = coups[k];
    const legaux = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!legaux.length) return;
    let promo;
    if (legaux.some((m) => m.promotion)) promo = attendu.startsWith(from + to) && attendu[4] ? attendu[4] : 'q';
    const precedent = dernier;
    chess.move({ from, to, promotion: promo });
    dernier = { from, to };
    indice = null;
    fleches = [];
    // Un autre coup qui fait mat est aussi accepté.
    if (from + to + (promo || '') === attendu || chess.isCheckmate()) {
      k++;
      badge = { sq: to, html: ICONE_OK };
      if (k >= coups.length || chess.isCheckmate()) {
        fini = true;
        afficher();
        onEtat('resolu');
        onFin({ reussi: !erreur && !aide });
        return;
      }
      afficher();
      onEtat('bon');
      plusTard(coupAdverse, 450);
    } else {
      badge = { sq: to, html: ICONE_KO };
      auto = true;
      afficher();
      const premiere = !erreur;
      erreur = true;
      onEtat('rate', { premiere });
      plusTard(() => {
        chess.undo();
        dernier = precedent;
        badge = null;
        auto = false;
        afficher();
        onEtat('reessaie');
      }, 800);
    }
  };

  afficher();
  plusTard(coupAdverse, delaiDebut);

  return {
    joueur,
    // 1er appui : la pièce à jouer clignote · 2e appui : flèche du coup.
    indice() {
      if (!peutJouer()) return;
      aide = true;
      if (!indice) indice = coups[k].slice(0, 2);
      else fleches = [{ from: coups[k].slice(0, 2), to: coups[k].slice(2, 4) }];
      afficher();
    },
    solution() {
      if (fini || k === 0) return;
      aide = true;
      auto = true;
      fini = true;
      for (const t of timers) clearTimeout(t);
      timers.clear();
      if (badge?.html === ICONE_KO) {
        chess.undo();
        badge = null;
      }
      const suite = () => {
        if (k >= coups.length) {
          afficher();
          onEtat('solution');
          onFin({ reussi: false });
          return;
        }
        jouerUci(coups[k]);
        k++;
        indice = null;
        fleches = [];
        afficher();
        plusTard(suite, 650);
      };
      suite();
    },
    detruire() {
      for (const t of timers) clearTimeout(t);
      board.onMove = () => {};
    },
  };
}

/* ---------- Accueil des problèmes ---------- */

export function showProblemes($app) {
  const lien = (i) => `#/problemes/niveau?n=${i}&theme=${session.theme}`;
  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Problèmes</h1>
      </div>
      ${carteDefi()}
      <a class="rush-card" href="#/problemes/course">
        <span class="rush-icone">⏱</span>
        <span class="rush-texte">
          <strong>Course contre la montre</strong>
          <small>3 minutes, 3 vies. Les problèmes deviennent de plus en plus durs : jusqu'où iras-tu ?</small>
        </span>
        <span class="rush-record">${session.record ? `Record<br><b>${session.record}</b>` : 'Jouer'}</span>
      </a>
      <h2 class="section-titre">Entraînement par niveau</h2>
      <div class="chips" role="radiogroup" aria-label="Thème">
        ${THEMES.map((t) => `<button type="button" role="radio" class="chip" data-theme="${t.id}" aria-checked="${t.id === session.theme}">${t.nom}</button>`).join('')}
      </div>
      <div class="niveaux">
        ${NIVEAUX.map((n, i) => `
          <a class="niveau-card" data-niveau="${i}" href="${lien(i)}">
            <span class="avatar" style="--c:${n.couleur}"><img src="${pieceSrc('w', n.piece)}" alt=""></span>
            <span class="bot-text">
              <strong>${n.nom} <span class="elo">${n.min === 399 ? 400 : n.min} – ${n.max === 3300 ? '3000' : n.max}</span></strong>
              <span class="niveau">${n.titre}</span>
              <small>${n.desc}</small>
            </span>
            ${session.resolus[i] ? `<span class="niveau-score" title="Problèmes réussis sans aide pendant cette session">✓ ${session.resolus[i]} réussi${session.resolus[i] > 1 ? 's' : ''}</span>` : ''}
          </a>`).join('')}
      </div>
    </section>`;

  $app.querySelectorAll('[data-theme]').forEach((b) =>
    b.addEventListener('click', () => {
      session.theme = b.dataset.theme;
      $app.querySelectorAll('[data-theme]').forEach((x) => x.setAttribute('aria-checked', x === b));
      $app.querySelectorAll('[data-niveau]').forEach((a) => (a.href = lien(a.dataset.niveau)));
    }));
  return () => {};
}

/* ---------- Entraînement par niveau ---------- */

export function showEntrainement($app, { niveau, theme }) {
  const n = NIVEAUX[Math.max(0, Math.min(NIVEAUX.length - 1, niveau))];
  const iNiveau = NIVEAUX.indexOf(n);
  const th = THEMES.find((t) => t.id === theme) || THEMES[0];
  let ctrl = null;
  let actif = true;
  let probleme = null;
  let serie = 0;
  let meilleureSerie = 0;
  let reussis = 0;
  let joues = 0;
  let compte = false; // le résultat du problème en cours a-t-il déjà été compté ?
  session.cotes[iNiveau] ??= n.min + 100;

  $app.innerHTML = `
    <section class="game probleme">
      <div class="page-head">
        <a href="#/problemes" class="btn ghost">← Problèmes</a>
        <h1>${n.nom} · ${n.titre}</h1>
        <span class="cad-chip">${th.nom}</span>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div id="board"></div>
          <div id="dessin"></div>
        </div>
        <aside class="panel">
          <div class="statut-pb" id="statut">Chargement des problèmes…</div>
          <div class="stats-pb">
            <div><span id="serie">0</span><small>Série 🔥</small></div>
            <div><span id="reussis">0</span><small>Réussis</small></div>
            <div><span id="cote">${Math.round(session.cotes[iNiveau])}</span><small>Ton niveau</small></div>
          </div>
          <div class="pb-infos" id="infos"></div>
          <div class="actions">
            <button type="button" class="btn" id="btn-indice">💡 Indice</button>
            <button type="button" class="btn" id="btn-solution">Solution</button>
            <button type="button" class="btn primary wide" id="btn-suivant" hidden>Problème suivant →</button>
          </div>
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  monterBarreDessin($('#dessin'), board);
  let pool = [];

  function statut(texte, etat) {
    const $s = $('#statut');
    $s.className = `statut-pb etat-${etat}`;
    $s.innerHTML = texte;
  }

  function majStats() {
    $('#serie').textContent = serie;
    $('#reussis').textContent = `${reussis}/${joues}`;
    $('#cote').textContent = Math.round(session.cotes[iNiveau]);
  }

  // Classement de la session (type Elo) : il monte quand tu réussis, baisse quand tu échoues.
  function compter(reussi) {
    if (compte) return;
    compte = true;
    joues++;
    const attendu = 1 / (1 + 10 ** ((probleme.rating - session.cotes[iNiveau]) / 400));
    session.cotes[iNiveau] = Math.max(n.min - 100, Math.min(n.max + 150, session.cotes[iNiveau] + 40 * ((reussi ? 1 : 0) - attendu)));
    if (reussi) {
      reussis++;
      serie++;
      meilleureSerie = Math.max(meilleureSerie, serie);
      session.resolus[iNiveau] = (session.resolus[iNiveau] || 0) + 1;
      const $serie = $('#serie');
      $serie.classList.remove('pop');
      void $serie.offsetWidth;
      $serie.classList.add('pop');
    } else {
      serie = 0;
    }
    majStats();
  }

  function etat(e, info = {}) {
    if (!actif) return;
    const couleur = ctrl.joueur === 'w' ? 'Blancs' : 'Noirs';
    const mat = matEn(probleme);
    if (e === 'tour') statut(`<strong>Aux ${couleur} de jouer</strong>${mat ? ` · mat en ${mat}` : ''}<br><small>Trouve le meilleur coup.</small>`, 'tour');
    if (e === 'bon') statut('<strong>Bon coup !</strong> Continue…', 'bon');
    if (e === 'rate') {
      if (info.premiere) compter(false);
      statut('<strong>Ce n’est pas le bon coup.</strong><br><small>Réessaie, ou demande un indice.</small>', 'rate');
    }
    if (e === 'reessaie') statut(`<strong>À toi, réessaie !</strong>${mat ? ` · mat en ${mat}` : ''}`, 'tour');
    if (e === 'resolu' || e === 'solution') {
      $('#btn-suivant').hidden = false;
      $('#btn-indice').disabled = true;
      $('#btn-solution').disabled = true;
      $('#infos').innerHTML = `<div><small>Difficulté</small> <b>${probleme.rating}</b></div>
        <div><small>Thèmes</small> ${nomsThemes(probleme).map((t) => `<span class="tag">${t}</span>`).join('') || '–'}</div>`;
    }
    if (e === 'solution') statut('<strong>Voici la solution.</strong><br><small>Regarde bien, puis passe au suivant.</small>', 'rate');
  }

  function fin({ reussi }) {
    compter(reussi);
    signaler('probleme', { reussi, niveau: iNiveau, themes: probleme.themes, serie });
    if (reussi) {
      confettis($('#board'));
      let message = serie >= 3 ? `<strong>Bravo ! Série de ${serie} 🔥</strong>` : '<strong>Bravo, problème résolu !</strong>';
      if (reussis >= 8 && session.cotes[iNiveau] > n.max - 50 && iNiveau < NIVEAUX.length - 1) {
        message += `<br><small>Tu domines ce niveau : essaie <a href="#/problemes/niveau?n=${iNiveau + 1}&theme=${th.id}">${NIVEAUX[iNiveau + 1].nom}</a> !</small>`;
      }
      statut(message, 'resolu');
    } else if (!$('#statut').classList.contains('etat-rate')) {
      statut('<strong>Résolu</strong>, mais avec de l’aide ou une erreur : la série repart à zéro.', 'bon');
    }
  }

  function suivant() {
    ctrl?.detruire();
    compte = false;
    probleme = choisir(pool, session.cotes[iNiveau]);
    $('#btn-suivant').hidden = true;
    $('#btn-indice').disabled = false;
    $('#btn-solution').disabled = false;
    $('#infos').innerHTML = '';
    statut('Regarde le dernier coup de l’adversaire…', 'attente');
    ctrl = lancerProbleme(board, probleme, { onEtat: etat, onFin: fin });
  }

  $('#btn-indice').addEventListener('click', () => {
    if (!compte) compter(false);
    ctrl?.indice();
  });
  $('#btn-solution').addEventListener('click', () => {
    if (!compte) compter(false);
    ctrl?.solution();
  });
  $('#btn-suivant').addEventListener('click', suivant);
  const clavier = (e) => {
    if (e.key === 'Enter' && !$('#btn-suivant').hidden && !document.querySelector('dialog[open]')) suivant();
  };
  document.addEventListener('keydown', clavier);

  charger()
    .then((tous) => {
      if (!actif) return;
      pool = tous.filter((p) => p.rating >= n.min && p.rating < n.max && th.test(p.themes));
      if (pool.length < 5) pool = tous.filter((p) => p.rating >= n.min && p.rating < n.max);
      suivant();
    })
    .catch(() => statut('Impossible de charger les problèmes. Recharge la page.', 'rate'));

  return () => {
    actif = false;
    ctrl?.detruire();
    board.destroy();
    document.removeEventListener('keydown', clavier);
  };
}

/* ---------- Course contre la montre ---------- */

const DUREE_COURSE = 3 * 60 * 1000;
const VIES = 3;

export function showCourse($app) {
  let ctrl = null;
  let actif = true;
  let enCours = false;
  let score = 0;
  let vies = VIES;
  let reste = DUREE_COURSE;
  let depuis = 0;
  let minuterie = null;
  let probleme = null;
  let tous = [];
  const resultats = [];

  $app.innerHTML = `
    <section class="game probleme course">
      <div class="page-head">
        <a href="#/problemes" class="btn ghost">← Problèmes</a>
        <h1>Course contre la montre</h1>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div class="course-bar">
            <span class="course-temps" id="temps">${formatTemps(DUREE_COURSE)}</span>
            <span class="course-vies" id="vies"></span>
            <span class="course-score"><b id="score">0</b> pts</span>
          </div>
          <div class="board-wrap-pb">
            <div id="board"></div>
            <div class="depart" id="depart">
              <strong>Prêt ?</strong>
              <p>3 minutes · 3 vies<br>Une erreur = une vie en moins.</p>
              <button type="button" class="btn primary big" id="btn-go">C'est parti !</button>
            </div>
          </div>
        </div>
        <aside class="panel">
          <div class="statut-pb etat-attente" id="statut">Les problèmes commencent faciles et deviennent de plus en plus durs.</div>
          <div class="course-resultats" id="resultats"></div>
          ${session.record ? `<p class="note">Ton record de la session : <b>${session.record}</b></p>` : ''}
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  board.set({ chess: new Chess(), orientation: 'w', movable: null });

  function statut(texte, etat) {
    $('#statut').className = `statut-pb etat-${etat}`;
    $('#statut').innerHTML = texte;
  }

  function majBarre() {
    $('#temps').textContent = formatTemps(reste);
    $('#temps').classList.toggle('low', reste < 30000);
    $('#vies').innerHTML = Array.from({ length: VIES }, (_, i) => `<span class="${i < vies ? 'on' : ''}">♥</span>`).join('');
    $('#score').textContent = score;
    $('#resultats').innerHTML = resultats.map((r) => `<span class="${r.ok ? 'ok' : 'ko'}" title="Difficulté ${r.rating}">${r.rating}</span>`).join('');
  }

  function tic() {
    const maintenant = performance.now();
    reste -= maintenant - depuis;
    depuis = maintenant;
    if (reste <= 0) {
      reste = 0;
      terminer('Temps écoulé !');
    }
    majBarre();
  }

  // La difficulté visée augmente à chaque problème réussi.
  function suivant() {
    if (!enCours) return;
    ctrl?.detruire();
    probleme = choisir(tous, 450 + score * 85);
    statut('…', 'attente');
    ctrl = lancerProbleme(board, probleme, {
      delaiDebut: 350,
      onEtat: (e) => {
        if (!actif || !enCours) return;
        if (e === 'tour') statut(`<strong>Aux ${ctrl.joueur === 'w' ? 'Blancs' : 'Noirs'} de jouer</strong>${matEn(probleme) ? ` · mat en ${matEn(probleme)}` : ''}`, 'tour');
        if (e === 'bon') statut('<strong>Bien !</strong> Continue…', 'bon');
        if (e === 'rate') {
          ctrl.detruire();
          vies--;
          resultats.push({ ok: false, rating: probleme.rating });
          majBarre();
          if (vies <= 0) return terminer('Plus de vies !');
          statut('<strong>Raté !</strong> Une vie en moins.', 'rate');
          setTimeout(() => actif && suivant(), 700);
        }
      },
      onFin: ({ reussi }) => {
        if (!actif || !enCours || !reussi) return;
        score++;
        resultats.push({ ok: true, rating: probleme.rating });
        signaler('probleme', {
          reussi: true,
          niveau: NIVEAUX.findIndex((n) => probleme.rating >= n.min && probleme.rating < n.max),
          themes: probleme.themes,
        });
        majBarre();
        statut('<strong>Réussi !</strong>', 'resolu');
        setTimeout(() => actif && suivant(), 350);
      },
    });
  }

  async function terminer(raison) {
    if (!enCours) return;
    enCours = false;
    clearInterval(minuterie);
    ctrl?.detruire();
    majBarre();
    const record = score > session.record;
    if (record) session.record = score;
    signaler('course', { score });
    if (score >= 5) confettis($('#board'));
    statut(`<strong>${raison}</strong> Score : ${score}`, 'resolu');
    const r = await modal({
      titre: raison,
      html: `<p class="score-final">${score} <small>problème${score > 1 ? 's' : ''} résolu${score > 1 ? 's' : ''}</small></p>
        <p>${record && score > 0 ? '🏆 Nouveau record de la session !' : `Record de la session : ${session.record}`}</p>`,
      actions: [{ label: 'Rejouer', primaire: true }, { label: 'Retour aux problèmes' }],
    });
    if (!actif) return;
    if (r === '0') demarrer();
    if (r === '1') location.hash = '#/problemes';
  }

  function demarrer() {
    score = 0;
    vies = VIES;
    reste = DUREE_COURSE;
    resultats.length = 0;
    $('#depart').hidden = true;
    enCours = true;
    depuis = performance.now();
    clearInterval(minuterie);
    minuterie = setInterval(tic, 100);
    majBarre();
    suivant();
  }

  majBarre();
  $('#btn-go').disabled = true;
  charger()
    .then((t) => {
      tous = t;
      $('#btn-go').disabled = false;
    })
    .catch(() => statut('Impossible de charger les problèmes. Recharge la page.', 'rate'));
  $('#btn-go').addEventListener('click', demarrer);

  return () => {
    actif = false;
    enCours = false;
    clearInterval(minuterie);
    ctrl?.detruire();
    board.destroy();
  };
}
