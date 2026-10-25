// « S'entraîner aux ouvertures » (Cours > Les ouvertures) : l'adversaire choisit une variante du répertoire,
// l'élève doit jouer les bons coups. Ensuite, la partie peut continuer contre Stockfish, puis être analysée.
// Les variantes ratées reviennent plus souvent (répétition espacée, gardée dans le navigateur de l'élève).
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc } from './board.js';
import { obtenirMoteur } from './engine.js';
import { REPERTOIRE } from './ouvertures-data.js';
import { chancesBlancs, classer, iconeCoup } from './analyse.js';
import { ICONE_OK, ICONE_KO } from './lecons.js';

const CLE = 'echiquier-saint-andre:ouvertures';
const COULEUR = '#0891b2'; // celle du chapitre « Les ouvertures »
const BOITE_MAX = 3; // une variante est maîtrisée après 3 réussites sans faute
const POIDS = [6, 3, 2, 1]; // chance d'être tirée selon la boîte (les variantes jamais vues : 8)
const COUPS_STOCKFISH = 8; // coups de l'élève contre Stockfish après la sortie du livre
const sansSigne = (san) => san.replace(/[+#?!]/g, '');
const cleLigne = (l) => l.coups.map(([c]) => c).join(' ');
const numero = (i, san) => `${Math.floor(i / 2) + 1}${i % 2 ? '…' : '.'} ${san}`;

// Vérifie qu'à une même position, toutes les variantes attendent le même coup de l'élève.
for (const o of REPERTOIRE) {
  const attendu = {};
  for (const l of o.lignes) {
    l.coups.forEach(([san], i) => {
      const cle = l.coups.slice(0, i).map(([c]) => c).join(' ');
      if ((i % 2 === 0) !== (o.camp === 'w')) return;
      if (attendu[cle] && attendu[cle] !== san) console.warn(`Ouverture ${o.id} : deux coups différents après « ${cle} »`);
      attendu[cle] = san;
    });
  }
}

/* ---------- Progression (répétition espacée) ---------- */

function lire() {
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (d && typeof d === 'object' && !Array.isArray(d)) return d;
  } catch { /* stockage indisponible ou illisible */ }
  return {};
}

function ecrire(d) {
  try { localStorage.setItem(CLE, JSON.stringify(d)); } catch { /* navigation privée : rien n'est gardé */ }
}

const statLigne = (d, o, l) => d[o.id]?.[cleLigne(l)] || null;

function noter(o, l, reussi) {
  const d = lire();
  const s = (d[o.id] ??= {})[cleLigne(l)] ??= { b: 0, ok: 0, ko: 0 };
  if (reussi) {
    s.ok++;
    s.b = Math.min(BOITE_MAX, s.b + 1);
  } else {
    s.ko++;
    s.b = Math.max(0, s.b - 1);
  }
  ecrire(d);
  return s;
}

export function maitrise(o, d = lire()) {
  const boites = o.lignes.map((l) => statLigne(d, o, l)?.b || 0);
  return {
    pct: Math.round((boites.reduce((a, b) => a + b, 0) / (BOITE_MAX * o.lignes.length)) * 100),
    maitrisees: boites.filter((b) => b >= BOITE_MAX).length,
  };
}

// Tire une variante : les nouvelles et les ratées d'abord, jamais deux fois la même de suite.
function tirerLigne(o, derniere) {
  const d = lire();
  const choix = o.lignes.filter((l) => l !== derniere || o.lignes.length === 1);
  const poids = choix.map((l) => {
    const s = statLigne(d, o, l);
    return s ? POIDS[s.b] : 8;
  });
  let r = Math.random() * poids.reduce((a, b) => a + b, 0);
  for (let i = 0; i < choix.length; i++) if ((r -= poids[i]) < 0) return choix[i];
  return choix[choix.length - 1];
}

const pointsMaitrise = (b = 0) => `<span class="ouv-boites" title="${b} / ${BOITE_MAX}">${Array.from({ length: BOITE_MAX }, (_, i) => `<i class="${i < b ? 'on' : ''}"></i>`).join('')}</span>`;

/* ---------- Carte du chapitre « Les ouvertures » ---------- */

export function carteOuvertures() {
  const d = lire();
  const pct = Math.round(REPERTOIRE.reduce((s, o) => s + maitrise(o, d).pct, 0) / REPERTOIRE.length);
  return `
    <a class="cours-carte ouv-carte" href="#/cours/ouvertures" style="--c:${COULEUR}">
      <span class="pap-rond"><img src="${pieceSrc('w', 'N')}" alt=""></span>
      <span class="cours-texte">
        <strong>S’entraîner aux ouvertures</strong>
        <small>L’adversaire change de réponse à chaque fois : trouve les bons coups, puis affronte Stockfish.</small>
        <span class="cours-meta"><span class="niveau-puce" style="--c:${COULEUR}">Entraînement</span><span class="ouv-pct">${pct} % maîtrisé</span></span>
      </span>
    </a>`;
}

/* ---------- Choix de l'ouverture ---------- */

export function showOuvertures($app) {
  const d = lire();
  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/cours" class="btn ghost">← Cours</a>
        <h1>S’entraîner aux ouvertures</h1>
      </div>
      <p class="muted ouv-intro">Choisis une ouverture. L’adversaire jouera une de ses variantes au hasard : à toi de trouver les coups de ton répertoire.
        Les variantes que tu rates reviennent plus souvent. Une variante est maîtrisée après ${BOITE_MAX} réussites sans faute.</p>
      <div class="cours-liste">
        ${REPERTOIRE.map((o) => {
          const m = maitrise(o, d);
          return `
            <a class="cours-carte ${m.maitrisees === o.lignes.length ? 'faite' : ''}" href="#/cours/ouvertures/jouer?o=${o.id}" style="--c:${COULEUR}">
              <span class="pap-rond"><img src="${pieceSrc(o.camp, o.piece)}" alt=""></span>
              <span class="cours-texte">
                <strong>${o.nom}</strong>
                <small>Avec les ${o.camp === 'w' ? 'Blancs' : 'Noirs'} · ${o.lignes.length} variantes</small>
                <span class="hf-prog"><span style="width:${m.pct}%"></span></span>
                <small>${m.maitrisees} / ${o.lignes.length} variantes maîtrisées</small>
              </span>
            </a>`;
        }).join('')}
      </div>
    </section>`;
  return () => {};
}

/* ---------- Entraînement ---------- */

export function showEntrainementOuverture($app, id, { analyser }) {
  const o = REPERTOIRE.find((x) => x.id === id) || REPERTOIRE[0];
  const camp = o.camp;
  const moteur = obtenirMoteur();
  let actif = true;
  let jeton = 0; // invalide les réponses (minuteries, moteur) d'une variante abandonnée
  let timer = null;
  let ligne = null;
  let et = null; // état de la variante en cours

  $app.innerHTML = `
    <section class="game lecon">
      <div class="page-head">
        <a href="#/cours/ouvertures" class="btn ghost">← Ouvertures</a>
        <h1>${o.nom}</h1>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div id="board"></div>
        </div>
        <aside class="panel" style="--c:${COULEUR}">
          <div id="contenu"></div>
          <div class="ouv-variantes">
            <h2>Variantes</h2>
            <ul id="variantes"></ul>
          </div>
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  const afficher = (extra = {}) => board.set({
    chess: et.pos, orientation: camp, lastMove: et.dernier,
    movable: et.attente || et.phase === 'fin' || et.phase === 'bilan' ? null : camp, ...extra,
  });

  function majVariantes() {
    const d = lire();
    $('#variantes').innerHTML = o.lignes.map((l) => {
      const s = statLigne(d, o, l);
      const revelee = l === ligne && (et.phase === 'fin' || et.phase === 'sf' || et.phase === 'bilan');
      return `<li class="${revelee ? 'actuelle' : ''}"><span>${l.nom}</span>${pointsMaitrise(s?.b)}</li>`;
    }).join('');
  }

  const message = (html, type = 'info') => {
    const $m = $('#message');
    $m.className = `pap-message ${type}`;
    $m.innerHTML = html;
  };

  function cadre(consigne, boutons, extra = '') {
    $('#contenu').innerHTML = `
      <div class="pap-consigne"><small>${o.nom} · avec les ${camp === 'w' ? 'Blancs' : 'Noirs'}</small><p>${consigne}</p></div>
      ${extra}
      <div class="pap-message" id="message"></div>
      <div class="actions">${boutons}</div>`;
  }

  /* --- Phase 1 : les coups du répertoire --- */
  function nouvelleVariante(meme = false) {
    clearTimeout(timer);
    jeton++;
    moteur.stop();
    ligne = meme && ligne ? ligne : tirerLigne(o, ligne);
    et = { pos: new Chess(), i: 0, erreurs: 0, aide: 0, attente: false, dernier: null, phase: 'livre' };
    cadre('Joue les coups de ton répertoire. L’adversaire peut répondre de plusieurs façons !', `
      <button type="button" class="btn btn-aide" id="btn-aide">💡 Indice</button>
      <button type="button" class="btn" id="btn-autre">↻ Autre variante</button>`);
    $('#btn-aide').addEventListener('click', indice);
    $('#btn-autre').addEventListener('click', () => nouvelleVariante());
    majVariantes();
    board.onMove = coupEleve;
    if (camp === 'b') {
      et.attente = true;
      afficher();
      message('L’adversaire commence…');
      const monJeton = jeton;
      timer = setTimeout(() => monJeton === jeton && coupAdverse(''), 600);
    } else {
      afficher();
      message('À toi de jouer le premier coup !');
    }
  }

  function indice() {
    if (et.phase !== 'livre' || et.attente) return;
    et.aide = Math.min(2, et.aide + 1);
    const m = new Chess(et.pos.fen()).move(ligne.coups[et.i][0]);
    if (et.aide === 1) {
      message('💡 Regarde bien la pièce en surbrillance.');
      afficher({ indice: m.from });
    } else {
      message('💡 Joue le coup de la flèche.');
      afficher({ indice: m.from, fleches: [{ from: m.from, to: m.to, couleur: 'bleu' }] });
      $('#btn-aide').hidden = true;
    }
  }

  function coupAdverse(avant) {
    if (!actif) return;
    const [san, note] = ligne.coups[et.i];
    const m = et.pos.move(san);
    et.dernier = { from: m.from, to: m.to };
    et.attente = false;
    et.i++;
    $('#btn-aide').hidden = false;
    afficher();
    message(`${avant}L’adversaire ${et.i > 1 ? 'répond' : 'joue'} <b>${numero(et.i - 1, m.san)}</b>${note ? ` : ${note}` : ''}<br>À toi !`);
  }

  function coupEleve(from, to) {
    if (et.phase !== 'livre' || et.attente) return;
    const m = jouerAuPlateau(from, to);
    if (!m) return;
    const precedent = et.dernier;
    et.dernier = { from, to };
    const [attendu, note, erreurs] = ligne.coups[et.i];
    if (sansSigne(m.san) === sansSigne(attendu)) {
      et.i++;
      afficher({ badge: { sq: to, html: ICONE_OK } });
      const fait = `✓ <b>${numero(et.i - 1, m.san)}</b>${note ? ` : ${note}` : ''}<br>`;
      if (et.i >= ligne.coups.length) return finVariante(fait);
      et.attente = true;
      message(`${fait}L’adversaire réfléchit…`);
      const monJeton = jeton;
      timer = setTimeout(() => monJeton === jeton && coupAdverse(fait), note ? 1000 : 650);
      return;
    }
    et.erreurs++;
    et.attente = true;
    afficher({ badge: { sq: to, html: ICONE_KO } });
    message(erreurs?.[sansSigne(m.san)] || 'Ce n’est pas le coup de ton répertoire. Réessaie, ou demande un indice !', 'ko');
    const monJeton = jeton;
    timer = setTimeout(() => {
      if (!actif || monJeton !== jeton) return;
      et.pos.undo();
      et.dernier = precedent;
      et.attente = false;
      afficher();
    }, 1300);
  }

  // Joue le coup du plateau dans la position (promotion en dame). Renvoie le coup chess.js ou null.
  function jouerAuPlateau(from, to) {
    const legaux = et.pos.moves({ square: from, verbose: true }).filter((x) => x.to === to);
    if (!legaux.length) return null;
    return et.pos.move({ from, to, promotion: legaux.some((x) => x.promotion) ? 'q' : undefined });
  }

  function finVariante(fait) {
    et.phase = 'fin';
    const reussi = et.erreurs === 0 && et.aide === 0;
    const s = noter(o, ligne, reussi);
    afficher();
    majVariantes();
    const bilan = reussi
      ? `Variante réussie sans faute ! ${s.b >= BOITE_MAX ? 'Elle est maîtrisée.' : `Encore ${BOITE_MAX - s.b} réussite${BOITE_MAX - s.b > 1 ? 's' : ''} pour la maîtriser.`}`
      : `Variante terminée avec ${et.erreurs ? `${et.erreurs} erreur${et.erreurs > 1 ? 's' : ''}` : ''}${et.erreurs && et.aide ? ' et ' : ''}${et.aide ? `${et.aide} indice${et.aide > 1 ? 's' : ''}` : ''} : elle reviendra plus souvent.`;
    cadre(`Variante : <b>${ligne.nom}</b>`, `
      <button type="button" class="btn primary wide" id="btn-suivante">Variante suivante →</button>
      <button type="button" class="btn" id="btn-sf">Continuer contre Stockfish</button>
      <button type="button" class="btn" id="btn-rejouer">↺ Rejouer</button>`);
    message(`${fait}<strong>${bilan}</strong><br><small>Tu sors du livre ici. Continue contre Stockfish pour voir si tu sais jouer la suite : il analysera tes coups.</small>`, reussi ? 'ok' : 'info');
    $('#btn-suivante').addEventListener('click', () => nouvelleVariante());
    $('#btn-rejouer').addEventListener('click', () => nouvelleVariante(true));
    $('#btn-sf').addEventListener('click', contreStockfish);
  }

  /* --- Phase 2 : la suite contre Stockfish --- */
  function contreStockfish() {
    et.phase = 'sf';
    et.debut = et.pos.history().length;
    et.coupsSf = 0;
    cadre(`Continue la partie : ${COUPS_STOCKFISH} coups contre Stockfish, puis il analysera tes coups.`, `
      <button type="button" class="btn" id="btn-analyser">🔍 Analyser maintenant</button>
      <button type="button" class="btn" id="btn-suivante">Variante suivante →</button>`,
    `<div class="pap-compteurs ouv-compteur"><div><b id="nb-coups">0</b><small>coups joués sur ${COUPS_STOCKFISH}</small></div></div>`);
    $('#btn-analyser').addEventListener('click', analyserCoups);
    $('#btn-suivante').addEventListener('click', () => nouvelleVariante());
    majVariantes();
    board.onMove = coupEleveSf;
    moteur.newGame().catch(() => {});
    if (et.pos.turn() !== camp) coupStockfish();
    else {
      afficher();
      message('À toi de jouer !');
    }
  }

  const partieFinie = () => et.pos.isGameOver();

  function coupEleveSf(from, to) {
    if (et.phase !== 'sf' || et.attente) return;
    const m = jouerAuPlateau(from, to);
    if (!m) return;
    et.dernier = { from, to };
    et.coupsSf++;
    $('#nb-coups').textContent = et.coupsSf;
    if (partieFinie() || et.coupsSf >= COUPS_STOCKFISH) {
      afficher();
      return analyserCoups();
    }
    coupStockfish();
  }

  async function coupStockfish() {
    const monJeton = jeton;
    et.attente = true;
    afficher();
    message('Stockfish réfléchit…');
    try {
      const uci = await moteur.bestMove(et.pos.fen(), { skill: 10, movetime: 300 });
      if (!actif || monJeton !== jeton || et.phase !== 'sf') return;
      const r = et.pos.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      et.dernier = { from: r.from, to: r.to };
      et.attente = false;
      afficher();
      if (partieFinie()) return analyserCoups();
      message(`Stockfish joue <b>${numero(et.pos.history().length - 1, r.san)}</b>.${et.pos.inCheck() ? ' Échec ! Protège ton roi.' : ''} À toi !`);
    } catch {
      if (actif && monJeton === jeton) message('Le moteur n’a pas pu démarrer.', 'ko');
    }
  }

  /* --- Phase 3 : l'analyse --- */
  async function analyserCoups() {
    const monJeton = jeton;
    et.phase = 'bilan';
    et.attente = true;
    afficher();
    const coups = et.pos.history({ verbose: true });
    const debut = et.debut ?? coups.length;
    cadre('Stockfish analyse tes coups…', '');
    message('<span class="ouv-progres"><span id="progres" style="width:0%"></span></span>');

    // Évaluations (point de vue des Blancs) de chaque position depuis la sortie du livre.
    const fens = [];
    const p = new Chess();
    coups.forEach((m, i) => {
      if (i === debut) fens[i] = p.fen();
      p.move(m.san);
      if (i >= debut) fens[i + 1] = p.fen();
    });
    if (debut >= coups.length) fens[debut] = p.fen();
    const evals = [];
    const meilleurs = [];
    for (let i = debut; i <= coups.length; i++) {
      const pos = new Chess(fens[i]);
      if (pos.isCheckmate()) evals[i] = { gagnant: pos.turn() === 'w' ? 'b' : 'w' };
      else if (pos.isDraw()) evals[i] = { cp: 0 };
      else {
        let r;
        try {
          r = await moteur.analyse(fens[i], { depth: 12, movetime: 400 });
        } catch {
          if (actif && monJeton === jeton) message('Le moteur n’a pas pu démarrer.', 'ko');
          return;
        }
        if (!actif || monJeton !== jeton) return;
        const signe = pos.turn() === 'w' ? 1 : -1;
        evals[i] = !r.score ? { cp: 0 } : r.score.type === 'mate' ? { mate: signe * r.score.value } : { cp: signe * r.score.value };
        meilleurs[i] = r.best;
      }
      const $p = $('#progres');
      if ($p) $p.style.width = `${Math.round(((i - debut + 1) / (coups.length - debut + 1)) * 100)}%`;
    }

    const pourMoi = (ev) => (camp === 'w' ? chancesBlancs(ev) : 100 - chancesBlancs(ev));
    const lignes = [];
    for (let i = debut; i < coups.length; i++) {
      const m = coups[i];
      if (m.color !== camp) continue;
      const perte = Math.max(0, pourMoi(evals[i]) - pourMoi(evals[i + 1]));
      const uci = `${m.from}${m.to}${m.promotion || ''}`;
      const cat = classer(perte, meilleurs[i] === uci);
      let mieux = '';
      if ((cat === 'correct' || cat === 'mauvais') && meilleurs[i]) {
        const b = new Chess(fens[i]).move({ from: meilleurs[i].slice(0, 2), to: meilleurs[i].slice(2, 4), promotion: meilleurs[i][4] });
        mieux = `<small>Meilleur : <b>${b.san}</b></small>`;
      }
      lignes.push(`<li>${iconeCoup(cat)}<span>${numero(i, m.san)}</span>${mieux}</li>`);
    }
    bilan(lignes, pourMoi(evals[coups.length]));
  }

  function bilan(lignes, chances) {
    et.attente = true;
    afficher();
    const avis = chances >= 90 ? 'Tu es en train de gagner !'
      : chances >= 65 ? 'Tu as un bel avantage.'
        : chances >= 55 ? 'Tu as un léger avantage.'
          : chances > 45 ? 'La position est équilibrée.'
            : chances > 35 ? 'Tu es un peu moins bien.'
              : chances > 10 ? 'Tu es en difficulté.' : 'Ta position est perdue.';
    cadre(`Bilan après la variante <b>${ligne.nom}</b>`, `
      <button type="button" class="btn primary wide" id="btn-suivante">Variante suivante →</button>
      <button type="button" class="btn" id="btn-detail">🔍 Analyse détaillée</button>
      <button type="button" class="btn" id="btn-rejouer">↺ Rejouer</button>`);
    message(`<strong>${avis}</strong>${lignes.length ? `<ul class="ouv-bilan">${lignes.join('')}</ul>` : '<small>Tu n’as joué aucun coup après le livre.</small>'}`, chances >= 45 ? 'ok' : 'info');
    $('#btn-suivante').addEventListener('click', () => nouvelleVariante());
    $('#btn-rejouer').addEventListener('click', () => nouvelleVariante(true));
    $('#btn-detail').addEventListener('click', () => {
      const [blancs, noirs] = camp === 'w' ? ['Élève', 'Stockfish'] : ['Stockfish', 'Élève'];
      et.pos.setHeader('Event', `Entraînement : ${o.nom}`);
      et.pos.setHeader('White', blancs);
      et.pos.setHeader('Black', noirs);
      analyser(et.pos.pgn());
    });
  }

  nouvelleVariante();

  return () => {
    actif = false;
    jeton++;
    clearTimeout(timer);
    moteur.stop();
    board.destroy();
  };
}
