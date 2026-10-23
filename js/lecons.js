// Parcours « Pas à pas » : apprendre les règles en jouant.
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc } from './board.js';
import { CHAPITRES, LECONS, etoilesMax } from './lecons-data.js';
import { signaler, etoilesLecon } from './succes.js';
import { confettis } from './problemes.js';
import { modal } from './modal.js';

const ETOILE = '<svg class="etoile-case" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2.5 14.9,8.6 21.5,9.3 16.5,13.8 17.9,20.4 12,17 6.1,20.4 7.5,13.8 2.5,9.3 9.1,8.6" fill="#facc15" stroke="#a16207" stroke-width="1.2" stroke-linejoin="round"/></svg>';
export const ICONE_OK = '<svg class="icone-coup" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M6.8 12.6l3.4 3.4 7-7.6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const ICONE_KO = '<svg class="icone-coup" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#dc2626"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
const COULEURS_CHAPITRE = { pieces: '#2563eb', prendre: '#0d9488', speciaux: '#9333ea', mat: '#dc2626' };
export const NOMS_PIECES = { k: 'le roi', q: 'la dame', r: 'la tour', b: 'le fou', n: 'le cavalier', p: 'le pion' };

export const etoilesHtml = (n, total = 3) => Array.from({ length: total }, (_, i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join('');

// Résumé d'une leçon en 0 à 3 étoiles.
function note(lecon) {
  const e = etoilesLecon(lecon.id);
  const max = etoilesMax(lecon);
  if (!e) return 0;
  return e >= max ? 3 : e >= max * 0.66 ? 2 : 1;
}

// Remet le trait aux Blancs (dans les exercices, seuls les Blancs jouent).
function traitBlanc(fen) {
  const p = fen.split(' ');
  p[1] = 'w';
  p[3] = '-';
  return p.join(' ');
}

const position = (fen) => new Chess(fen, { skipValidation: true });

// Nombre minimum de coups pour tout ramasser (recherche en largeur).
function minimumCoups(fen, depart, etoiles) {
  const noirs = position(fen).board().flat().filter((p) => p && p.color === 'b').map((p) => p.square);
  const cibles = [...etoiles, ...noirs];
  const plein = (1 << cibles.length) - 1;
  const file = [[fen, depart, plein, 0]];
  const vus = new Set([depart + plein]);
  while (file.length) {
    const [f, sq, masque, d] = file.shift();
    if (masque === 0) return d;
    if (d >= 14) continue;
    const c = position(f);
    for (const m of c.moves({ square: sq, verbose: true })) {
      if (m.promotion && m.promotion !== 'q') continue;
      const i = cibles.indexOf(m.to);
      const nm = i >= 0 ? masque & ~(1 << i) : masque;
      const cle = m.to + nm;
      if (vus.has(cle)) continue;
      vus.add(cle);
      c.move({ from: m.from, to: m.to, promotion: m.promotion });
      file.push([traitBlanc(c.fen()), m.to, nm, d + 1]);
      c.undo();
    }
  }
  return null;
}

/* ---------- Carte du parcours ---------- */

export function showPasAPas($app) {
  const total = LECONS.reduce((s, l) => s + etoilesMax(l), 0);
  const gagnees = LECONS.reduce((s, l) => s + Math.min(etoilesLecon(l.id), etoilesMax(l)), 0);
  const prochaine = LECONS.find((l) => !etoilesLecon(l.id));
  const pct = Math.round((gagnees / total) * 100);

  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Pas à pas</h1>
      </div>
      <div class="pap-hero">
        <div class="pap-hero-texte">
          <strong>Apprends les règles en jouant</strong>
          <small>Ramasse les étoiles, trouve les bons coups, réponds aux quiz. Moins tu fais de coups, plus tu gagnes d’étoiles !</small>
          <div class="hf-prog grand"><span style="width:${pct}%"></span></div>
          <small><b>★ ${gagnees}</b> / ${total} étoiles</small>
        </div>
        ${prochaine
          ? `<a class="btn big pap-continuer" href="#/pas-a-pas/lecon?id=${prochaine.id}">${gagnees ? 'Continuer' : 'Commencer'} : ${prochaine.titre} →</a>`
          : '<span class="pap-fini">🎓 Parcours terminé !</span>'}
      </div>
      ${CHAPITRES.map((ch, ic) => `
        <h2 class="section-titre"><span class="chap-num" style="--c:${COULEURS_CHAPITRE[ch.id]}">${ic + 1}</span>${ch.nom} <small>${ch.desc}</small></h2>
        <div class="pap-lecons">
          ${LECONS.filter((l) => l.chapitre === ch.id).map((l) => {
            const n = note(l);
            return `
              <a class="pap-lecon ${n ? 'faite' : ''} ${l === prochaine ? 'prochaine' : ''}" href="#/pas-a-pas/lecon?id=${l.id}" style="--c:${COULEURS_CHAPITRE[ch.id]}">
                <span class="pap-rond"><img src="${pieceSrc('w', l.piece)}" alt="">${n ? '<i class="pap-ok">✓</i>' : ''}</span>
                <strong>${l.titre}</strong>
                <span class="pap-etoiles">${etoilesHtml(n)}</span>
              </a>`;
          }).join('')}
        </div>`).join('')}
    </section>`;
  return () => {};
}

/* ---------- Une leçon ---------- */

export function showLecon($app, id) {
  const lecon = LECONS.find((l) => l.id === id) || LECONS[0];
  const iLecon = LECONS.indexOf(lecon);
  const suivante = LECONS[iLecon + 1];
  const couleur = COULEURS_CHAPITRE[lecon.chapitre];
  let actif = true;
  let iEtape = -1;
  const scores = [];
  let timer = null;
  let etape = null; // état de l'étape en cours

  $app.innerHTML = `
    <section class="game lecon">
      <div class="page-head">
        <a href="#/pas-a-pas" class="btn ghost">← Parcours</a>
        <h1>${lecon.titre}</h1>
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

  function majEtapes() {
    $('#etapes').innerHTML = lecon.etapes.map((_, i) => {
      const cls = i < scores.length ? `fait e${scores[i]}` : i === iEtape ? 'actuel' : '';
      return `<span class="${cls}" title="Étape ${i + 1}"></span>`;
    }).join('');
    const total = scores.reduce((a, b) => a + b, 0);
    $('#points').innerHTML = `★ ${total} / ${etoilesMax(lecon)}`;
  }

  function contenu(html) {
    $('#contenu').innerHTML = html;
  }

  function message(texte, type) {
    const $m = $('#message');
    if (!$m) return;
    $m.className = `pap-message ${type}`;
    $m.innerHTML = texte;
  }

  function afficherPlateau(extra = {}) {
    board.set({ chess: etape.pos, orientation: 'w', movable: etape.fini ? null : 'w', ...extra });
  }

  /* --- Intro --- */
  function intro() {
    board.set({ chess: position(lecon.etapes.find((e) => e.fen)?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), orientation: 'w', movable: null });
    majEtapes();
    contenu(`
      <div class="pap-intro">
        <span class="pap-rond grand" style="--c:${couleur}"><img src="${pieceSrc('w', lecon.piece)}" alt=""></span>
        <p>${lecon.intro}</p>
        <button type="button" class="btn primary big" id="btn-go">C'est parti !</button>
      </div>`);
    $('#btn-go').addEventListener('click', () => lancerEtape(0));
  }

  /* --- Étapes --- */
  function lancerEtape(i) {
    clearTimeout(timer);
    iEtape = i;
    scores.length = Math.min(scores.length, i);
    $('#board').classList.remove('vide');
    const e = lecon.etapes[i];
    majEtapes();
    if (e.type === 'quiz') return quiz(e);
    if (e.type === 'etoiles') return etoiles(e);
    return coup(e);
  }

  function reussite(nb, texte) {
    etape.fini = true;
    scores[iEtape] = nb;
    majEtapes();
    const derniere = iEtape === lecon.etapes.length - 1;
    message(`<strong>${texte}</strong><span class="gain">${etoilesHtml(nb)}</span>`, 'ok');
    const $b = $('#btn-suivant');
    $b.hidden = false;
    $b.textContent = derniere ? 'Terminer la leçon 🎉' : 'Étape suivante →';
    $b.focus({ preventScroll: true });
    $('#btn-recommencer')?.toggleAttribute('hidden', nb === 3);
  }

  function cadreEtape(consigne, extra = '') {
    contenu(`
      <div class="pap-consigne"><small>Étape ${iEtape + 1} / ${lecon.etapes.length}</small>${consigne}</div>
      ${extra}
      <div class="pap-message" id="message"></div>
      <div class="actions">
        <button type="button" class="btn" id="btn-recommencer">↺ Recommencer</button>
        <button type="button" class="btn primary" id="btn-suivant" hidden>Étape suivante →</button>
      </div>`);
    $('#btn-recommencer').addEventListener('click', () => lancerEtape(iEtape));
    $('#btn-suivant').addEventListener('click', () => (iEtape + 1 < lecon.etapes.length ? lancerEtape(iEtape + 1) : finLecon()));
  }

  // Ramasser les étoiles / prendre les pièces noires.
  function etoiles(e) {
    const pos = position(e.fen);
    const depart = e.piece || pos.board().flat().find((p) => p && p.color === 'w').square;
    const piece = pos.get(depart);
    const optimal = minimumCoups(e.fen, depart, e.etoiles);
    etape = { pos, case: depart, restantes: new Set(e.etoiles), coups: 0, fini: false };
    const noirs = () => etape.pos.board().flat().filter((p) => p && p.color === 'b').length;
    const objectifs = e.etoiles.length ? 'Ramasse les étoiles' : 'Prends les pièces noires';
    cadreEtape(`<p>${e.texte}</p>`, `
      <div class="pap-compteurs">
        <div><b id="nb-coups">0</b><small>coups</small></div>
        <div><b>${optimal ?? '–'}</b><small>coups pour ★★★</small></div>
      </div>`);
    const dessiner = () => afficherPlateau({
      marqueurs: [...etape.restantes].map((sq) => ({ sq, html: ETOILE })),
      lastMove: etape.dernier,
    });
    board.onMove = (from, to) => {
      if (etape.fini) return;
      if (from !== etape.case) {
        message(`Dans cet exercice, on ne déplace que ${NOMS_PIECES[piece.type]}.`, 'info');
        return;
      }
      etape.pos.move({ from, to, promotion: 'q' });
      etape.pos = position(traitBlanc(etape.pos.fen()));
      etape.case = to;
      etape.dernier = { from, to };
      etape.coups++;
      $('#nb-coups').textContent = etape.coups;
      if (etape.restantes.delete(to)) message('⭐ Une étoile !', 'info');
      dessiner();
      if (!etape.restantes.size && !noirs()) {
        const nb = optimal === null || etape.coups <= optimal ? 3 : etape.coups <= optimal + 2 ? 2 : 1;
        reussite(nb, nb === 3 ? 'Parfait ! Le chemin le plus court.' : `Réussi en ${etape.coups} coups. Peux-tu le faire en ${optimal} ?`);
      }
    };
    message(`${objectifs} avec ${NOMS_PIECES[piece.type]}.`, 'info');
    dessiner();
  }

  // Trouver le coup demandé.
  function coup(e) {
    etape = { pos: position(e.fen), essais: 0, fini: false, dernier: e.dernier || null };
    cadreEtape(`<p>${e.texte}</p>`);
    afficherPlateau({ lastMove: etape.dernier });
    board.onMove = async (from, to) => {
      if (etape.fini || etape.attente) return;
      const legaux = etape.pos.moves({ square: from, verbose: true }).filter((m) => m.to === to);
      if (!legaux.length) return;
      let promotion;
      if (legaux.some((m) => m.promotion)) {
        promotion = await choisirPromotion();
        if (!promotion || !actif) return;
      }
      const m = etape.pos.move({ from, to, promotion });
      const [ok, raté] = verifier(e, m);
      if (ok) {
        afficherPlateau({ lastMove: { from, to }, badge: { sq: to, html: ICONE_OK } });
        const nb = etape.essais === 0 ? 3 : etape.essais === 1 ? 2 : 1;
        reussite(nb, ok);
        return;
      }
      etape.essais++;
      etape.attente = true;
      afficherPlateau({ lastMove: { from, to }, badge: { sq: to, html: ICONE_KO } });
      message(raté, 'ko');
      timer = setTimeout(() => {
        if (!actif) return;
        etape.pos.undo();
        etape.attente = false;
        afficherPlateau({ lastMove: etape.dernier });
      }, 1100);
    };
  }

  // Renvoie [message de réussite, null] ou [null, message d'erreur].
  function verifier(e, m) {
    const p = etape.pos;
    switch (e.but) {
      case 'echec':
        return p.inCheck() ? ['Échec ! Le roi noir est attaqué.', null] : [null, 'Ce coup n’attaque pas le roi noir. Réessaie !'];
      case 'mat':
        if (p.isCheckmate()) return ['Échec et mat ! Bravo !', null];
        if (p.isStalemate()) return [null, 'PAT ! Le roi noir ne peut plus bouger mais il n’est pas en échec : partie nulle. Trouve le mat !'];
        return [null, p.inCheck() ? 'C’est échec… mais le roi peut encore s’échapper.' : 'Ce n’est pas mat. Réessaie !'];
      case 'roque': {
        const fait = e.cote ? m.flags.includes(e.cote) : /[kq]/.test(m.flags);
        return fait ? [`Bravo, c’est le ${m.flags.includes('k') ? 'petit' : 'grand'} roque !`, null] : [null, 'Pour roquer, déplace ton roi de deux cases vers la tour.'];
      }
      case 'enpassant':
        return m.flags.includes('e') ? ['Bien joué : prise en passant !', null] : [null, 'Ce n’est pas la prise en passant. Va sur la case juste derrière le pion noir.'];
      case 'promotion':
        if (!m.promotion) return [null, 'Avance ton pion jusqu’au bout de l’échiquier.'];
        if (e.prise && !m.captured) return [null, 'Ici, il faut prendre la tour en diagonale !'];
        return [`Ton pion est devenu ${NOMS_PIECES[m.promotion].replace(/^l[ae] /, (x) => (x === 'la ' ? 'une ' : 'un '))} !`, null];
      case 'parer': {
        const ok = { fuir: m.piece === 'k', prendre: !!m.captured, bloquer: m.piece !== 'k' && !m.captured }[e.methode];
        const conseils = { fuir: 'Ici, déplace ton roi pour le mettre à l’abri.', prendre: 'Essaie plutôt de PRENDRE la pièce qui attaque.', bloquer: 'Essaie de BLOQUER : mets une pièce entre la tour et ton roi.' };
        return ok ? ['Bravo, ton roi est sauvé !', null] : [null, `Ton roi est sauvé, mais… ${conseils[e.methode]}`];
      }
      default:
        return ['Bravo !', null];
    }
  }

  async function choisirPromotion() {
    const r = await modal({
      titre: 'Promotion !',
      html: `<p>En quelle pièce ton pion se transforme-t-il ?</p>
        <div class="promo">${['q', 'r', 'b', 'n'].map((t) => `<button class="promo-btn" value="${t}"><img src="${pieceSrc('w', t)}" alt="${NOMS_PIECES[t]}"></button>`).join('')}</div>`,
    });
    return ['q', 'r', 'b', 'n'].includes(r) ? r : null;
  }

  // Quiz à choix multiple.
  function quiz(e) {
    etape = { pos: position(e.fen || '8/8/8/8/8/8/8/8 w - - 0 1'), essais: 0, fini: true };
    board.set({ chess: etape.pos, orientation: 'w', movable: null });
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
          const nb = etape.essais === 0 ? 3 : etape.essais === 1 ? 2 : 1;
          reussite(nb, `Bonne réponse ! <small>${e.explication}</small>`);
          $('#btn-recommencer').hidden = true;
        } else {
          etape.essais++;
          b.classList.add('faux');
          b.disabled = true;
          message('Non, ce n’est pas ça. Essaie encore !', 'ko');
        }
      }));
  }

  /* --- Fin de la leçon --- */
  function finLecon() {
    $('#board').classList.remove('vide');
    const total = scores.reduce((a, b) => a + b, 0);
    const max = etoilesMax(lecon);
    const avant = etoilesLecon(lecon.id);
    signaler('lecon', { id: lecon.id, etoiles: total });
    const n = total >= max ? 3 : total >= max * 0.66 ? 2 : 1;
    iEtape = lecon.etapes.length;
    majEtapes();
    confettis($('#board'));
    board.onMove = () => {};
    contenu(`
      <div class="pap-fin">
        <strong>Leçon terminée !</strong>
        <span class="pap-etoiles grand">${etoilesHtml(n)}</span>
        <p>${total} étoiles sur ${max}${total > avant && avant ? ' · nouveau record !' : ''}</p>
        ${n < 3 ? '<p><small>Refais la leçon pour gagner toutes les étoiles !</small></p>' : ''}
        <div class="actions">
          ${suivante ? `<a class="btn primary wide" href="#/pas-a-pas/lecon?id=${suivante.id}">Leçon suivante : ${suivante.titre} →</a>` : '<a class="btn primary wide" href="#/pas-a-pas">🎓 Retour au parcours</a>'}
          <button type="button" class="btn" id="btn-refaire">↺ Refaire</button>
          <a class="btn" href="#/pas-a-pas">Parcours</a>
        </div>
      </div>`);
    $('#btn-refaire').addEventListener('click', () => {
      scores.length = 0;
      lancerEtape(0);
    });
  }

  const clavier = (e) => {
    if (e.key !== 'Enter' || document.querySelector('dialog[open]')) return;
    const b = $('#btn-suivant');
    if (b && !b.hidden && document.activeElement !== b) b.click();
  };
  document.addEventListener('keydown', clavier);

  intro();

  return () => {
    actif = false;
    clearTimeout(timer);
    board.destroy();
    document.removeEventListener('keydown', clavier);
  };
}
