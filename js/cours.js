// « Cours » : progresser après les règles (ouvertures, tactiques, mats types, finales contre Stockfish, stratégie).
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc } from './board.js';
import { obtenirMoteur } from './engine.js';
import { CHAPITRES_COURS, COURS, NIVEAUX_COURS, etoilesMaxCours } from './cours-data.js';
import { signaler, etoilesCours } from './succes.js';
import { confettis } from './problemes.js';
import { modal } from './modal.js';
import { ICONE_OK, ICONE_KO, NOMS_PIECES, etoilesHtml } from './lecons.js';

const position = (fen) => new Chess(fen, { skipValidation: true });
const sansSigne = (san) => san.replace(/[+#?!]/g, '');
const fleches = (liste = []) => liste.map(([from, to, couleur]) => ({ from, to, couleur }));
const cases = (liste = []) => liste.map(([sq, couleur]) => ({ sq, couleur }));
let filtreNiveau = 'tous';

// « apres » : position obtenue en jouant ces coups depuis le départ (et dernier coup surligné).
for (const c of COURS) for (const e of c.etapes) {
  if (!e.apres) continue;
  const p = new Chess();
  let m = null;
  for (const coup of e.apres) m = p.move(coup);
  e.fen = p.fen();
  e.dernier = m && { from: m.from, to: m.to };
}

// Résumé d'un cours en 0 à 3 étoiles.
function note(cours) {
  const e = etoilesCours(cours.id);
  const max = etoilesMaxCours(cours);
  if (!e) return 0;
  return e >= max ? 3 : e >= max * 0.66 ? 2 : 1;
}

const puceNiveau = (n) => `<span class="niveau-puce" style="--c:${NIVEAUX_COURS[n].couleur}">${NIVEAUX_COURS[n].nom}</span>`;

/* ---------- Liste des cours ---------- */

export function showCours($app) {
  const total = COURS.reduce((s, l) => s + etoilesMaxCours(l), 0);
  const gagnees = COURS.reduce((s, l) => s + Math.min(etoilesCours(l.id), etoilesMaxCours(l)), 0);
  const finis = COURS.filter((l) => etoilesCours(l.id)).length;
  const pct = Math.round((gagnees / total) * 100);

  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Cours</h1>
      </div>
      <div class="pap-hero cours-hero">
        <div class="pap-hero-texte">
          <strong>Deviens plus fort, cours après cours</strong>
          <small>Ouvertures, tactiques, mats, finales contre Stockfish : chaque cours explique une idée, puis te met au défi.</small>
          <div class="hf-prog grand"><span style="width:${pct}%"></span></div>
          <small><b>★ ${gagnees}</b> / ${total} étoiles · ${finis} / ${COURS.length} cours terminés</small>
        </div>
      </div>
      <div class="chips cours-chips" role="radiogroup" aria-label="Niveau">
        ${[['tous', 'Tous les niveaux'], ...Object.entries(NIVEAUX_COURS).map(([id, n]) => [id, n.nom])].map(([id, nom]) => `
          <button type="button" role="radio" class="chip" data-niveau="${id}" aria-checked="${id === filtreNiveau}">${nom}</button>`).join('')}
      </div>
      <div id="liste-cours"></div>
    </section>`;

  const dessiner = () => {
    $app.querySelector('#liste-cours').innerHTML = CHAPITRES_COURS.map((ch, ic) => {
      const liste = COURS.filter((l) => l.chapitre === ch.id && (filtreNiveau === 'tous' || l.niveau === filtreNiveau));
      if (!liste.length) return '';
      return `
        <h2 class="section-titre"><span class="chap-num" style="--c:${ch.couleur}">${ic + 1}</span>${ch.nom} <small>${ch.desc}</small></h2>
        <div class="cours-liste">
          ${liste.map((l) => {
            const n = note(l);
            return `
              <a class="cours-carte ${n ? 'faite' : ''}" href="#/cours/lecon?id=${l.id}" style="--c:${ch.couleur}">
                <span class="pap-rond"><img src="${pieceSrc('w', l.piece)}" alt="">${n ? '<i class="pap-ok">✓</i>' : ''}</span>
                <span class="cours-texte">
                  <strong>${l.titre}</strong>
                  <small>${l.resume}</small>
                  <span class="cours-meta">${puceNiveau(l.niveau)}${l.etapes.some((e) => e.type === 'finale') ? '<span class="niveau-puce sf">contre Stockfish</span>' : ''}<span class="pap-etoiles">${etoilesHtml(n)}</span></span>
                </span>
              </a>`;
          }).join('')}
        </div>`;
    }).join('');
  };
  $app.querySelectorAll('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      filtreNiveau = b.dataset.niveau;
      $app.querySelectorAll('[data-niveau]').forEach((x) => x.setAttribute('aria-checked', x === b));
      dessiner();
    }));
  dessiner();
  return () => {};
}

/* ---------- Un cours ---------- */

export function showLeconCours($app, id) {
  const cours = COURS.find((l) => l.id === id) || COURS[0];
  const chapitre = CHAPITRES_COURS.find((c) => c.id === cours.chapitre);
  const suivant = COURS[COURS.indexOf(cours) + 1];
  const couleur = chapitre.couleur;
  let actif = true;
  let iEtape = -1;
  const scores = []; // étoiles par étape (null pour une explication)
  let timer = null;
  let etape = null;
  let jeton = 0; // invalide les réponses du moteur d'une étape abandonnée

  $app.innerHTML = `
    <section class="game lecon">
      <div class="page-head">
        <a href="#/cours" class="btn ghost">← Cours</a>
        <h1>${cours.titre}</h1>
        <span class="pap-points" id="points"></span>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div id="board"></div>
        </div>
        <aside class="panel" style="--c:${couleur}">
          <div class="etapes-points" id="etapes"></div>
          <div id="contenu"></div>
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  const max = etoilesMaxCours(cours);

  function majEtapes() {
    $('#etapes').innerHTML = cours.etapes.map((e, i) => {
      const cls = i < scores.length ? (scores[i] === null ? 'fait lu' : `fait e${scores[i]}`) : i === iEtape ? 'actuel' : '';
      return `<span class="${cls}" title="Étape ${i + 1}"></span>`;
    }).join('');
    $('#points').innerHTML = `★ ${scores.reduce((a, b) => a + (b || 0), 0)} / ${max}`;
  }

  const contenu = (html) => ($('#contenu').innerHTML = html);

  function message(texte, type) {
    const $m = $('#message');
    if (!$m) return;
    $m.className = `pap-message ${type}`;
    $m.innerHTML = texte;
  }

  /* --- Intro --- */
  function intro() {
    const premiere = cours.etapes.find((e) => e.fen);
    board.set({ chess: position(premiere.fen), orientation: 'w', movable: null });
    majEtapes();
    const nb = (t) => cours.etapes.filter((e) => e.type === t).length;
    const contenuCours = [
      nb('explication') && `${nb('explication')} explication${nb('explication') > 1 ? 's' : ''}`,
      nb('exercice') && `${nb('exercice')} exercice${nb('exercice') > 1 ? 's' : ''}`,
      nb('quiz') && `${nb('quiz')} quiz`,
      nb('finale') && 'une partie contre Stockfish',
    ].filter(Boolean).join(' · ');
    contenu(`
      <div class="pap-intro">
        <span class="pap-rond grand" style="--c:${couleur}"><img src="${pieceSrc('w', cours.piece)}" alt=""></span>
        <div class="cours-meta centre">${puceNiveau(cours.niveau)}<span class="niveau-puce" style="--c:${couleur}">${chapitre.nom}</span></div>
        <p><b>${cours.resume}</b></p>
        <p class="muted">${contenuCours}</p>
        <button type="button" class="btn primary big" id="btn-go">C'est parti !</button>
      </div>`);
    $('#btn-go').addEventListener('click', () => lancerEtape(0));
  }

  /* --- Étapes --- */
  function lancerEtape(i) {
    clearTimeout(timer);
    jeton++;
    iEtape = i;
    scores.length = Math.min(scores.length, i);
    $('#board').classList.remove('vide');
    board.onMove = () => {};
    const e = cours.etapes[i];
    majEtapes();
    ({ explication, quiz, exercice, finale })[e.type](e);
  }

  function cadreEtape(consigne, extra = '', boutons = '') {
    const derniere = iEtape === cours.etapes.length - 1;
    contenu(`
      <div class="pap-consigne"><small>Étape ${iEtape + 1} / ${cours.etapes.length}</small>${consigne}</div>
      ${extra}
      <div class="pap-message" id="message"></div>
      <div class="actions">
        ${boutons}
        <button type="button" class="btn" id="btn-recommencer">↺ Recommencer</button>
        <button type="button" class="btn primary" id="btn-suivant" hidden>${derniere ? 'Terminer le cours 🎉' : 'Étape suivante →'}</button>
      </div>`);
    $('#btn-recommencer').addEventListener('click', () => lancerEtape(iEtape));
    $('#btn-suivant').addEventListener('click', () => (iEtape + 1 < cours.etapes.length ? lancerEtape(iEtape + 1) : finCours()));
  }

  function reussite(nb, texte) {
    etape.fini = true;
    scores[iEtape] = nb;
    majEtapes();
    message(`<strong>${texte}</strong><span class="gain">${etoilesHtml(nb)}</span>`, 'ok');
    $('#btn-suivant').hidden = false;
    $('#btn-suivant').focus({ preventScroll: true });
    $('#btn-recommencer').hidden = nb === 3;
    $app.querySelectorAll('.btn-aide').forEach((b) => (b.hidden = true));
  }

  // Explication : texte + schéma, avec éventuellement une démonstration coup par coup.
  function explication(e) {
    const depart = position(e.fen);
    const coups = e.coups || [];
    etape = { k: 0 };
    const demo = coups.length ? `
      <div class="demo">
        <div class="demo-nav">
          <button type="button" class="btn" data-demo="debut" aria-label="Début">⏮</button>
          <button type="button" class="btn" data-demo="-1" aria-label="Coup précédent">◀</button>
          <span class="demo-coup" id="demo-coup"></span>
          <button type="button" class="btn primary" data-demo="1" aria-label="Coup suivant">▶</button>
        </div>
        <p class="demo-note" id="demo-note"></p>
      </div>` : '';
    cadreEtape(`<p class="cours-texte-long">${e.texte}</p>`, demo);
    $('#btn-recommencer').hidden = true;
    scores[iEtape] = null;
    $('#btn-suivant').hidden = false;

    const afficher = () => {
      const pos = position(e.fen);
      let dernier = null;
      for (let j = 0; j < etape.k; j++) {
        const m = pos.move(coups[j]);
        dernier = { from: m.from, to: m.to };
      }
      board.set({
        chess: etape.k ? pos : depart,
        orientation: e.orientation || (depart.turn() === 'b' && !coups.length ? 'b' : 'w'),
        movable: null,
        lastMove: dernier,
        fleches: etape.k ? [] : fleches(e.fleches),
        cases: etape.k ? [] : cases(e.cases),
      });
      if (!coups.length) return;
      const n = etape.k;
      $('#demo-coup').textContent = n ? `${Math.ceil(n / 2)}${n % 2 ? '.' : '…'} ${coups[n - 1]}` : 'Départ';
      $('#demo-note').innerHTML = n ? e.notes?.[n - 1] || '' : 'Appuie sur ▶ pour jouer le premier coup.';
      $app.querySelector('[data-demo="1"]').disabled = n >= coups.length;
      $app.querySelector('[data-demo="-1"]').disabled = n === 0;
      $app.querySelector('[data-demo="debut"]').disabled = n === 0;
      // Tant que la démonstration n'est pas finie, « Étape suivante » reste discret.
      $('#btn-suivant').classList.toggle('primary', n >= coups.length);
    };
    $app.querySelectorAll('[data-demo]').forEach((b) =>
      b.addEventListener('click', () => {
        etape.k = b.dataset.demo === 'debut' ? 0 : Math.max(0, Math.min(coups.length, etape.k + Number(b.dataset.demo)));
        afficher();
      }));
    majEtapes();
    afficher();
  }

  // Quiz à choix multiple.
  function quiz(e) {
    etape = { essais: 0, fini: true };
    board.set({ chess: position(e.fen || '8/8/8/8/8/8/8/8 w - - 0 1'), orientation: 'w', movable: null, lastMove: e.dernier, fleches: fleches(e.fleches), cases: cases(e.cases) });
    $('#board').classList.toggle('vide', !e.fen);
    cadreEtape(`<p class="quiz-question">${e.question}</p>`, `
      <div class="quiz-choix">
        ${e.choix.map((c, i) => `<button type="button" class="btn quiz-btn" data-i="${i}">${c}</button>`).join('')}
      </div>`);
    $('#btn-recommencer').hidden = true;
    $app.querySelectorAll('.quiz-btn').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.closest('.quiz-choix').classList.contains('repondu')) return;
        if (Number(b.dataset.i) === e.bonne) {
          b.classList.add('bon');
          b.closest('.quiz-choix').classList.add('repondu');
          reussite(etape.essais === 0 ? 3 : etape.essais === 1 ? 2 : 1, `Bonne réponse ! <small>${e.explication}</small>`);
          $('#btn-recommencer').hidden = true;
        } else {
          etape.essais++;
          b.classList.add('faux');
          b.disabled = true;
          message('Non, ce n’est pas ça. Essaie encore !', 'ko');
        }
      }));
  }

  async function choisirPromotion(couleurJoueur) {
    const r = await modal({
      titre: 'Promotion !',
      html: `<p>En quelle pièce ton pion se transforme-t-il ?</p>
        <div class="promo">${['q', 'r', 'b', 'n'].map((t) => `<button class="promo-btn" value="${t}"><img src="${pieceSrc(couleurJoueur, t)}" alt="${NOMS_PIECES[t]}"></button>`).join('')}</div>`,
    });
    return ['q', 'r', 'b', 'n'].includes(r) ? r : null;
  }

  // Lit le coup joué au plateau (avec choix de la promotion). Renvoie le coup chess.js ou null.
  async function lireCoup(pos, from, to) {
    const legaux = pos.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!legaux.length) return null;
    let promotion;
    if (legaux.some((m) => m.promotion)) {
      promotion = await choisirPromotion(pos.turn());
      if (!promotion || !actif) return null;
    }
    return pos.move({ from, to, promotion });
  }

  // Exercice : trouver le bon coup (ou la bonne suite de coups).
  function exercice(e) {
    const pos = position(e.fen);
    const camp = pos.turn();
    etape = { pos, i: 0, erreurs: 0, aide: 0, fini: false, attente: false, dernier: e.dernier || null };
    const afficher = (extra = {}) => board.set({ chess: etape.pos, orientation: camp, movable: etape.fini || etape.attente ? null : camp, lastMove: etape.dernier, ...extra });
    cadreEtape(`<p>${e.texte}</p>`, '', `<button type="button" class="btn btn-aide" id="btn-aide">💡 Indice</button>`);
    $('#btn-recommencer').hidden = true;
    message(`Tu joues les ${camp === 'w' ? 'Blancs' : 'Noirs'}${e.solution.length > 1 ? ` · ${Math.ceil(e.solution.length / 2)} coups à trouver` : ''}.`, 'info');

    const attendu = () => {
      const c = position(etape.pos.fen());
      return c.move(e.solution[etape.i]);
    };
    $('#btn-aide').addEventListener('click', () => {
      if (etape.fini) return;
      etape.aide = Math.min(2, etape.aide + 1);
      const m = attendu();
      if (etape.aide === 1) {
        message(`💡 ${e.aide || `Regarde bien ${NOMS_PIECES[m.piece]}.`}`, 'info');
        afficher({ indice: m.from });
      } else {
        message('💡 Joue le coup de la flèche.', 'info');
        afficher({ indice: m.from, fleches: [{ from: m.from, to: m.to, couleur: 'bleu' }] });
        $('#btn-aide').hidden = true;
      }
    });

    const gagner = (texte) => {
      const base = etape.erreurs === 0 ? 3 : etape.erreurs === 1 ? 2 : 1;
      etape.attente = true;
      reussite(Math.max(1, Math.min(base, 3 - etape.aide)), texte);
    };

    board.onMove = async (from, to) => {
      if (etape.fini || etape.attente) return;
      const m = await lireCoup(etape.pos, from, to);
      if (!m || !actif) return;
      const precedent = etape.dernier;
      etape.dernier = { from, to };
      const derniere = etape.i >= e.solution.length - 1;
      const bon = sansSigne(m.san) === sansSigne(e.solution[etape.i]) || (e.but === 'mat' && derniere && etape.pos.isCheckmate());
      const autres = [...(etape.i === 0 ? e.accepte || [] : []), ...(derniere ? e.accepteFin || [] : [])];
      const autre = autres.some((s) => sansSigne(s) === sansSigne(m.san));
      if (bon || autre) {
        afficher({ badge: { sq: to, html: ICONE_OK } });
        const noteMoi = !autre && e.notes?.[etape.i];
        if (autre || derniere) return gagner(`${etape.pos.isCheckmate() ? 'Échec et mat ! ' : 'Bravo ! '}<small>${noteMoi ? `${noteMoi} ` : ''}${e.bravo || ''}</small>`);
        // Réponse de l'adversaire, puis on attend le coup suivant.
        etape.attente = true;
        message(noteMoi ? `✓ <b>${m.san}</b> : ${noteMoi}` : 'Bien joué ! Et maintenant ?', 'info');
        timer = setTimeout(() => {
          if (!actif || etape.fini) return;
          const r = etape.pos.move(e.solution[etape.i + 1]);
          const noteLui = e.notes?.[etape.i + 1];
          etape.i += 2;
          etape.dernier = { from: r.from, to: r.to };
          etape.attente = false;
          $('#btn-aide').hidden = false;
          afficher();
          message(`${noteMoi ? `✓ <b>${m.san}</b> : ${noteMoi}<br>` : ''}L’adversaire répond <b>${r.san}</b>${noteLui ? ` : ${noteLui}` : ''}<br>À toi !`, 'info');
        }, noteMoi ? 1000 : 650);
        return;
      }
      etape.erreurs++;
      etape.attente = true;
      afficher({ badge: { sq: to, html: ICONE_KO } });
      const conseil = e.erreurs?.[sansSigne(m.san)] || e.erreurs?.[m.san]
        || (etape.pos.isStalemate() ? 'PAT ! La partie serait nulle.'
          : e.ligne ? 'Ce n’est pas le coup de l’ouverture. Réessaie, ou demande un indice !' : 'Ce n’est pas le meilleur coup. Réessaie !');
      message(conseil, 'ko');
      timer = setTimeout(() => {
        if (!actif) return;
        etape.pos.undo();
        etape.dernier = precedent;
        etape.attente = false;
        afficher();
      }, 1300);
    };
    afficher();
  }

  // Finale : jouer contre Stockfish jusqu'au but.
  function finale(e) {
    const pos = position(e.fen);
    const camp = pos.turn();
    const adverse = camp === 'w' ? 'b' : 'w';
    const monJeton = jeton;
    const moteur = obtenirMoteur();
    const deux = e.limite + Math.ceil(e.limite / 2);
    etape = { pos, coups: 0, fini: false, attente: false, dernier: null };
    const buts = { mat: 'Fais échec et mat', promotion: 'Mène un pion à dame (sans te le faire prendre)', capture: 'Prends toutes les pièces adverses' };
    cadreEtape(`<p>${e.texte}</p>`, `
      <div class="pap-compteurs">
        <div><b id="nb-coups">0</b><small>coups joués</small></div>
        <div><b>${e.limite}</b><small>coups max pour ★★★</small></div>
      </div>
      <p class="muted petit">Objectif : ${buts[e.but]}. ★★ jusqu’à ${deux} coups.</p>`);
    $('#btn-recommencer').hidden = false;
    const afficher = (extra = {}) => board.set({ chess: etape.pos, orientation: camp, movable: etape.fini || etape.attente ? null : camp, lastMove: etape.dernier, ...extra });

    const perdu = (texte) => {
      etape.fini = true;
      afficher();
      message(`${texte} <b>Clique sur « Recommencer » pour réessayer.</b>`, 'ko');
    };
    const seulRoi = (couleur) => etape.pos.board().flat().every((p) => !p || p.color !== couleur || p.type === 'k');

    // Renvoie true si l'étape est terminée (gagnée ou perdue).
    const verifierFin = (dernierCoup) => {
      const p = etape.pos;
      if (e.but === 'mat' && p.isCheckmate() && p.turn() === adverse) {
        reussite(etape.coups <= e.limite ? 3 : etape.coups <= deux ? 2 : 1, `Échec et mat en ${etape.coups} coups ! <small>${etape.coups <= e.limite ? 'Parfait, c’est la bonne technique.' : `Peux-tu le faire en ${e.limite} coups ou moins ?`}</small>`);
        return true;
      }
      if (e.but === 'promotion' && dernierCoup?.promotion && dernierCoup.color === camp) {
        if (p.moves({ verbose: true }).some((m) => m.to === dernierCoup.to)) {
          perdu('Ta nouvelle dame peut être prise tout de suite !');
          return true;
        }
        reussite(etape.coups <= e.limite ? 3 : etape.coups <= deux ? 2 : 1, `Promotion réussie en ${etape.coups} coups ! <small>${etape.coups <= e.limite ? 'Bravo, tu maîtrises l’opposition.' : 'Essaie d’être plus rapide.'}</small>`);
        return true;
      }
      if (e.but === 'capture' && seulRoi(adverse)) {
        reussite(etape.coups <= e.limite ? 3 : etape.coups <= deux ? 2 : 1, `Pion rattrapé en ${etape.coups} coups : la partie est nulle, tu as sauvé les Noirs ! <small>Ton roi était dans le carré.</small>`);
        return true;
      }
      if (p.isCheckmate()) {
        perdu('Ton roi est mat…');
        return true;
      }
      if (p.isStalemate()) {
        perdu('PAT ! Le roi adverse n’est pas en échec mais ne peut plus bouger : partie nulle.');
        return true;
      }
      if (e.but !== 'capture' && (p.isInsufficientMaterial() || seulRoi(camp))) {
        perdu('Tu n’as plus assez de pièces pour gagner : partie nulle.');
        return true;
      }
      if (e.but === 'capture' && p.board().flat().some((x) => x && x.color === adverse && x.type === 'q') && !p.moves({ verbose: true }).some((m) => m.captured === 'q')) {
        perdu('Le pion est devenu dame et tu ne peux pas la prendre.');
        return true;
      }
      if (p.isDraw()) {
        perdu('Partie nulle.');
        return true;
      }
      return false;
    };

    board.onMove = async (from, to) => {
      if (etape.fini || etape.attente) return;
      const m = await lireCoup(etape.pos, from, to);
      if (!m || !actif || monJeton !== jeton) return;
      etape.coups++;
      etape.dernier = { from, to };
      $('#nb-coups').textContent = etape.coups;
      $('#nb-coups').classList.toggle('depasse', etape.coups > e.limite);
      if (verifierFin(m)) return afficher();
      etape.attente = true;
      afficher();
      message('Stockfish réfléchit…', 'info');
      try {
        const uci = await moteur.bestMove(etape.pos.fen(), { skill: 20, movetime: 300 });
        if (!actif || monJeton !== jeton) return;
        const r = etape.pos.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        etape.dernier = { from: r.from, to: r.to };
        etape.attente = false;
        if (verifierFin(r)) return afficher();
        message(etape.pos.inCheck() ? 'Échec ! Protège ton roi.' : 'À toi !', 'info');
        afficher();
      } catch {
        if (!actif) return;
        perdu('Le moteur n’a pas pu démarrer.');
      }
    };
    message('À toi de jouer !', 'info');
    afficher();
    moteur.newGame().catch(() => {});
  }

  /* --- Fin du cours --- */
  function finCours() {
    $('#board').classList.remove('vide');
    const total = scores.reduce((a, b) => a + (b || 0), 0);
    const avant = etoilesCours(cours.id);
    signaler('cours', { id: cours.id, etoiles: total });
    const n = total >= max ? 3 : total >= max * 0.66 ? 2 : 1;
    iEtape = cours.etapes.length;
    majEtapes();
    confettis($('#board'));
    board.onMove = () => {};
    contenu(`
      <div class="pap-fin">
        <strong>Cours terminé !</strong>
        <span class="pap-etoiles grand">${etoilesHtml(n)}</span>
        <p>${total} étoiles sur ${max}${total > avant && avant ? ' · nouveau record !' : ''}</p>
        ${n < 3 ? '<p><small>Refais le cours pour gagner toutes les étoiles !</small></p>' : ''}
        <div class="actions">
          ${suivant ? `<a class="btn primary wide" href="#/cours/lecon?id=${suivant.id}">Cours suivant : ${suivant.titre} →</a>` : '<a class="btn primary wide" href="#/cours">🎓 Retour aux cours</a>'}
          <button type="button" class="btn" id="btn-refaire">↺ Refaire</button>
          <a class="btn" href="#/cours">Tous les cours</a>
        </div>
      </div>`);
    $('#btn-refaire').addEventListener('click', () => {
      scores.length = 0;
      lancerEtape(0);
    });
  }

  const clavier = (ev) => {
    if (document.querySelector('dialog[open]')) return;
    if (ev.key === 'Enter') {
      const b = $('#btn-suivant');
      if (b && !b.hidden && document.activeElement !== b) b.click();
    }
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') $app.querySelector(`[data-demo="${ev.key === 'ArrowRight' ? 1 : -1}"]:not(:disabled)`)?.click();
  };
  document.addEventListener('keydown', clavier);

  intro();

  return () => {
    actif = false;
    jeton++;
    clearTimeout(timer);
    board.destroy();
    document.removeEventListener('keydown', clavier);
  };
}
