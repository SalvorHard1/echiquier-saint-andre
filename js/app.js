import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc, monterBarreDessin } from './board.js';
import { obtenirMoteur } from './engine.js';
import { showAnalyse } from './analyse.js';
import { BOTS } from './bots.js';
import { APP } from './config.js';
import { modal, fermerModal } from './modal.js';
import { showProblemes, showEntrainement, showCourse } from './problemes.js';
import { signaler, showSucces, majCompteur, avisSauvegarde } from './succes.js';
import { showPlateaux } from './plateaux.js';
import { piecePlateau } from './skins.js';
import { showPasAPas, showLecon } from './lecons.js';
import { showCours, showLeconCours } from './cours.js';
import { showDefi, carteDefi } from './defi.js';
import { VERSION, NOUVEAUTES } from './version.js';
import { gardeProf, showProf, showProjection, showDossier } from './prof.js';
import { showTournoi } from './tournoi.js';
import { showPosition, fenValide } from './position.js';
import { parseCadence, selecteurCadence, libelle, icone, formatTemps } from './cadences.js';
import { surveiller, verdict, alerteTriche, bandeau, SEUILS, BOTS_STRICTS } from './vigilance.js';

// Les parties vivent en mémoire et disparaissent à la fermeture de l'onglet.
// Seuls les hauts faits sont gardés, dans le navigateur de l'élève (voir succes.js).
const $app = document.getElementById('app');
let engine = null;
let cleanup = null;
let partieAAnalyser = null; // PGN transmis de la partie à l'analyse (en mémoire uniquement)
const choix = { bot: 'cavalier', couleur: 'w', cadence: 'aucune', cadenceDeux: '5-0' };

const VALEURS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CLE_PARTIE = 'echiquier-saint-andre:partie-en-cours';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

document.querySelectorAll('[data-app-nom]').forEach((el) => (el.textContent = APP.nom));
document.querySelectorAll('[data-app-sous-titre]').forEach((el) => (el.textContent = APP.sousTitre));
document.title = APP.nom;

/* ---------- Navigation ---------- */

function route() {
  cleanup?.();
  cleanup = null;
  fermerModal();
  const [path, query] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query || '');
  window.scrollTo(0, 0);
  document.querySelectorAll('.nav a').forEach((a) => {
    const cible = a.getAttribute('href').slice(1);
    a.classList.toggle('actif', path === cible || path?.startsWith(`${cible}/`) || (cible === '/bots' && path === '/jouer'));
  });
  switch (path) {
    case '/analyse': {
      const pgn = partieAAnalyser;
      partieAAnalyser = null;
      cleanup = showAnalyse($app, { pgn });
      return;
    }
    case '/problemes':
      cleanup = showProblemes($app);
      return;
    case '/succes':
      cleanup = showSucces($app);
      return;
    case '/plateaux':
      cleanup = showPlateaux($app);
      return;
    case '/pas-a-pas':
      cleanup = showPasAPas($app);
      return;
    case '/pas-a-pas/lecon':
      cleanup = showLecon($app, params.get('id'));
      return;
    case '/defi':
      cleanup = showDefi($app);
      return;
    case '/cours':
      cleanup = showCours($app);
      return;
    case '/cours/lecon':
      cleanup = showLeconCours($app, params.get('id'));
      return;
    case '/problemes/niveau':
      cleanup = showEntrainement($app, { niveau: Number(params.get('n')) || 0, theme: params.get('theme') || 'tous' });
      return;
    case '/problemes/course':
      cleanup = showCourse($app);
      return;
    case '/prof':
      cleanup = gardeProf($app, () => showProf($app));
      return;
    case '/prof/projection':
      cleanup = gardeProf($app, () => showProjection($app, { edition: params.get('edition') === '1' }));
      return;
    case '/prof/tournoi':
      cleanup = gardeProf($app, () => showTournoi($app));
      return;
    case '/prof/dossier':
      cleanup = gardeProf($app, () => showDossier($app, {
        analyser: (pgn) => {
          partieAAnalyser = pgn;
          location.hash = '#/analyse';
        },
      }));
      return;
    case '/position':
      cleanup = showPosition($app, params.get('fen'));
      return;
    case '/bots':
      return showBots();
    case '/jouer': {
      const bot = BOTS.find((b) => b.id === params.get('bot')) || BOTS[0];
      const couleur = ['w', 'b', 'hasard'].includes(params.get('couleur')) ? params.get('couleur') : 'w';
      return showGame({ mode: 'bot', bot, couleur, cadence: parseCadence(params.get('t')), fen: fenValide(params.get('fen')) });
    }
    case '/deux':
      return showDeuxSetup();
    case '/deux/jouer':
      return showGame({ mode: 'deux', cadence: parseCadence(params.get('t')), fen: fenValide(params.get('fen')) });
    default:
      return showHome();
  }
}
window.addEventListener('hashchange', route);

/* ---------- Confidentialité ---------- */

document.getElementById('btn-confidentialite').addEventListener('click', () => {
  modal({
    titre: 'Confidentialité',
    html: `
      <ul class="liste">
        <li><strong>Aucun compte</strong>, aucune inscription, aucun nom demandé.</li>
        <li><strong>Rien n'est envoyé sur Internet</strong> : aucune partie, aucun résultat ne quitte ton appareil.</li>
        <li><strong>Seuls tes hauts faits</strong> (les étoiles de « Pas à pas » et des « Cours », les résultats du défi du jour) sont enregistrés, dans le stockage local de ton navigateur, sur cet appareil uniquement. Tu peux les exporter ou tout effacer depuis la page <a href="#/succes">Hauts faits</a>.</li>
        <li>Les parties, analyses et problèmes en cours ne sont pas sauvegardés : fermer l'onglet les efface. Seule une partie en cours est gardée le temps de l'onglet, pour ne pas la perdre si la page se recharge.</li>
        <li>Le <strong>mode tournoi</strong> de l'espace Prof-AS garde les prénoms des élèves inscrits sur l'appareil du prof uniquement, jusqu'à ce qu'il efface le tournoi.</li>
        <li>Une position partagée par QR code voyage dans le lien lui-même : elle ne passe par aucun serveur.</li>
        <li><strong>Aucun cookie</strong>, aucun traceur, aucune statistique de visite, aucune publicité.</li>
        <li><strong>Aucun service extérieur</strong> : le moteur d'échecs tourne directement sur ton appareil.</li>
        <li>Pour marcher <strong>hors ligne</strong>, le navigateur garde une copie des fichiers du site (pages, pièces, moteur, problèmes). Cette copie ne contient aucune donnée personnelle.</li>
        <li>Le site est hébergé par GitHub Pages, qui reçoit techniquement l'adresse IP des visiteurs, comme pour n'importe quel site web.</li>
      </ul>`,
    actions: [{ label: 'Compris', primaire: true }],
  });
});

/* ---------- Accueil ---------- */

function showHome() {
  $app.innerHTML = `
    <section class="home">
      <div class="hero">
        <h1>${APP.nom.replace(/\S+-\S+/g, '<span class="insecable">$&</span>')}</h1>
        <p>${APP.slogan}</p>
      </div>
      ${carteDefi()}
      ${avisSauvegarde()}
      <div class="cards">
        <a class="card card-vedette" href="#/pas-a-pas">
          <span class="card-icon" style="--c:#16a34a"><img src="${pieceSrc('w', 'p')}" alt=""></span>
          <span class="card-text"><strong>Pas à pas</strong><small>Débutant ? Apprends les règles en jouant : étoiles, défis et quiz.</small></span>
        </a>
        <a class="card" href="#/cours">
          <span class="card-icon" style="--c:#ea580c"><img src="${pieceSrc('w', 'b')}" alt=""></span>
          <span class="card-text"><strong>Cours</strong><small>Ouvertures, tactiques, mats types, finales contre Stockfish.</small></span>
        </a>
        <a class="card" href="#/succes">
          <span class="card-icon" style="--c:#d97706"><img src="${pieceSrc('w', 'p')}" alt=""></span>
          <span class="card-text"><strong>Hauts faits</strong><small>Débloque des médailles, grimpe de Fer à Challenger et gagne de nouveaux plateaux.</small></span>
        </a>
        <a class="card" href="#/bots">
          <span class="card-icon" style="--c:#2563eb"><img src="${pieceSrc('w', 'k')}" alt=""></span>
          <span class="card-text"><strong>Jouer contre un bot</strong><small>${BOTS.length} niveaux, du grand débutant à l'imbattable.</small></span>
        </a>
        <a class="card" href="#/deux">
          <span class="card-icon" style="--c:#0d9488"><img src="${pieceSrc('w', 'n')}" alt=""></span>
          <span class="card-text"><strong>Partie à deux</strong><small>Sur le même écran, chacun son tour.</small></span>
        </a>
        <a class="card" href="#/problemes">
          <span class="card-icon" style="--c:#9333ea"><img src="${pieceSrc('w', 'q')}" alt=""></span>
          <span class="card-text"><strong>Problèmes</strong><small>Mats, fourchettes, clouages… 6 niveaux et une course contre la montre.</small></span>
        </a>
        <a class="card" href="#/analyse">
          <span class="card-icon" style="--c:#0891b2"><img src="${pieceSrc('w', 'r')}" alt=""></span>
          <span class="card-text"><strong>Analyser une partie</strong><small>Colle ton PGN : chaque coup est corrigé par Stockfish.</small></span>
        </a>
      </div>
    </section>`;
}

/* ---------- Choix du bot ---------- */

function avatar(bot, taille = '') {
  return `<span class="avatar ${taille}" style="--c:${bot.couleur}"><img src="${pieceSrc(bot.camp || 'w', bot.piece)}" alt=""></span>`;
}

function showBots() {
  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Choisis ton adversaire</h1>
      </div>
      <div class="bots" role="radiogroup" aria-label="Niveau du bot">
        ${BOTS.map((b) => `
          <button type="button" class="bot" role="radio" data-bot="${b.id}" aria-checked="${b.id === choix.bot}">
            ${avatar(b)}
            <span class="bot-text">
              <strong>${b.nom} <span class="elo">${b.elo}</span></strong>
              <span class="niveau">${b.niveau}</span>
              <small>${b.desc}</small>
            </span>
          </button>`).join('')}
      </div>
      <h2 class="section-titre">Cadence</h2>
      ${selecteurCadence(choix.cadence)}
      <div class="play-bar">
        <div class="choix-couleur">
          <span id="label-couleur">Jouer les</span>
          <div class="segmented" role="radiogroup" aria-labelledby="label-couleur">
            ${[['w', 'Blancs'], ['hasard', 'Au hasard'], ['b', 'Noirs']].map(([v, l]) => `
              <button type="button" role="radio" data-couleur="${v}" aria-checked="${v === choix.couleur}">${l}</button>`).join('')}
          </div>
        </div>
        <button type="button" class="btn primary big" id="btn-jouer">Jouer</button>
      </div>
    </section>`;

  $app.querySelectorAll('[data-bot]').forEach((el) =>
    el.addEventListener('click', () => {
      choix.bot = el.dataset.bot;
      $app.querySelectorAll('[data-bot]').forEach((x) => x.setAttribute('aria-checked', x === el));
    }));
  $app.querySelectorAll('[data-couleur]').forEach((el) =>
    el.addEventListener('click', () => {
      choix.couleur = el.dataset.couleur;
      $app.querySelectorAll('[data-couleur]').forEach((x) => x.setAttribute('aria-checked', x === el));
    }));
  brancherCadences('cadence');
  $app.querySelector('#btn-jouer').addEventListener('click', () => {
    location.hash = `#/jouer?bot=${choix.bot}&couleur=${choix.couleur}&t=${choix.cadence}`;
  });
}

function brancherCadences(cle) {
  $app.querySelectorAll('[data-cadence]').forEach((el) =>
    el.addEventListener('click', () => {
      choix[cle] = el.dataset.cadence;
      $app.querySelectorAll('[data-cadence]').forEach((x) => x.setAttribute('aria-checked', x === el));
    }));
}

/* ---------- Partie à deux : réglages ---------- */

function showDeuxSetup() {
  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Partie à deux</h1>
      </div>
      <p class="intro">Sur le même écran, chacun son tour. Choisis la cadence :</p>
      ${selecteurCadence(choix.cadenceDeux)}
      <div class="play-bar end">
        <button type="button" class="btn primary big" id="btn-jouer">Jouer</button>
      </div>
    </section>`;
  brancherCadences('cadenceDeux');
  $app.querySelector('#btn-jouer').addEventListener('click', () => {
    location.hash = `#/deux/jouer?t=${choix.cadenceDeux}`;
  });
}

/* ---------- Partie ---------- */

// fen : position de départ (position partagée par un prof), sinon la position initiale.
function showGame({ mode, bot, couleur, cadence, fen = null }) {
  const vsBot = mode === 'bot';
  const chess = new Chess();
  // Pièces au départ, pour afficher les prises même quand la partie commence d'une position partagée.
  const departs = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  for (const p of new Chess(fen || undefined).board().flat()) if (p && p.type !== 'k') departs[p.color][p.type]++;
  let joueur = 'w';
  let orientation = 'w';
  let generation = 0;
  let reflechit = false;
  let fin = null; // texte du résultat quand la partie est terminée
  let resultatForce = null; // résultat PGN en cas d'abandon ou de temps écoulé
  let moteurOk = true;
  let signalee = false; // la fin de partie a-t-elle déjà été comptée pour les hauts faits ?
  let pireRetard = 0; // plus gros retard de matériel de l'élève pendant la partie
  let reprise = false; // l'élève a-t-il repris un coup contre le bot ? (la victoire ne compte alors pas)
  // Anti-triche contre les bots : sorties de la page pendant le tour de l'élève et temps de chaque coup.
  let tempsCoups = [];
  let debutTour = null;
  let suspect = null; // raison pour laquelle la victoire ne serait pas homologuée

  // Pendules (en ms). Comme sur chess.com, elles ne démarrent qu'après le premier coup de chaque camp.
  let temps = null;
  let tempsHist = [];
  let depuis = 0;
  let minuterie = null;
  let tics = 0;

  // La partie en cours est gardée dans sessionStorage : elle survit à un rechargement de la page,
  // mais s'efface à la fermeture de l'onglet ou quand on quitte la partie.
  const signature = `${mode}:${bot?.id || ''}:${cadence?.id || ''}:${fen || ''}`;

  $app.innerHTML = `
    <section class="game">
      <div class="page-head">
        <a href="${vsBot ? '#/bots' : '#/deux'}" class="btn ghost">← ${vsBot ? 'Bots' : 'Réglages'}</a>
        <h1>${vsBot ? `Contre ${bot.nom}` : 'Partie à deux'}</h1>
        <span class="cad-chip">${cadence ? `${icone(cadence.groupe)}${cadence.groupe.nom} · ${libelle(cadence.id)}` : 'Sans limite'}</span>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div class="player-bar" id="bar-haut"></div>
          <div id="board"></div>
          <div class="player-bar" id="bar-bas"></div>
          <div id="dessin"></div>
        </div>
        <aside class="panel">
          <div class="status" id="status" aria-live="polite"></div>
          <p class="vigilance" id="vigilance" role="alert" hidden></p>
          <ol class="moves" id="moves"></ol>
          <div class="actions">
            <button type="button" class="btn" id="btn-annuler">↶ Annuler</button>
            <button type="button" class="btn" id="btn-tourner">⇅ Tourner</button>
            <button type="button" class="btn" id="btn-nouvelle">＋ Nouvelle</button>
            <button type="button" class="btn" id="btn-abandon">⚑ Abandonner</button>
            <button type="button" class="btn" id="btn-copier">Copier PGN</button>
            <button type="button" class="btn" id="btn-telecharger">Télécharger PGN</button>
            <button type="button" class="btn wide" id="btn-analyser">Analyser la partie</button>
          </div>
        </aside>
      </div>
    </section>`;

  const $ = (sel) => $app.querySelector(sel);
  const board = new Board($('#board'), { onMove: jouerCoupHumain });
  monterBarreDessin($('#dessin'), board);

  const vigil = vsBot ? surveiller({ enJeu: () => !fin, monTour: () => chess.turn() === joueur, onRetour: retourPartie }) : null;
  const seuils = vsBot && (BOTS_STRICTS.includes(bot.id) ? SEUILS.strict : SEUILS.normal);

  function jugerPartie() {
    return vigil ? verdict({ bot: bot.id, sorties: vigil.sorties, absence: vigil.absence, tempsCoups }) : null;
  }

  // L'élève revient sur la partie après l'avoir quittée pendant son tour.
  function retourPartie({ sorties }) {
    const avant = suspect;
    suspect = jugerPartie();
    const reste = seuils.sorties - sorties;
    bandeau($('#vigilance'), suspect
      ? `<b>Partie non homologuée</b> : ${suspect}. Une victoire ne comptera pas pour les hauts faits.`
      : `Tu as quitté la partie pendant ton tour. Encore ${reste} sortie${reste > 1 ? 's' : ''} et ta victoire ne comptera pas.`);
    if (suspect && !avant) {
      signaler('alerte', { genre: 'sortie', texte: `Partie contre ${bot.nom} : ${suspect}.` });
      alerteTriche({
        texte: `Tu as quitté la partie pendant ton tour (autre onglet, autre fenêtre ou autre appli)${BOTS_STRICTS.includes(bot.id) ? `. Contre ${bot.nom}, une seule sortie suffit` : ''}.`,
        consequence: 'Si tu gagnes cette partie, la victoire ne sera pas homologuée : elle comptera comme partie jouée, pas comme victoire.',
      });
    }
    sauvegarder();
  }

  function nomCamp(c) {
    if (vsBot) return c === joueur ? 'Toi' : bot.nom;
    return c === 'w' ? 'Blancs' : 'Noirs';
  }

  function barre(c) {
    const restants = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    let materiel = { w: 0, b: 0 };
    for (const row of chess.board()) for (const p of row) {
      if (!p) continue;
      materiel[p.color] += VALEURS[p.type];
      if (p.color !== c && p.type !== 'k') restants[p.type]++;
    }
    const adv = c === 'w' ? 'b' : 'w';
    const prises = Object.keys(restants)
      .flatMap((t) => Array(Math.max(0, departs[adv][t] - restants[t])).fill(t))
      .map((t) => `<img src="${piecePlateau(adv, t)}" alt="">`).join('');
    const diff = materiel[c] - materiel[adv];
    const actif = !fin && chess.turn() === c;
    const icone = vsBot && c !== joueur
      ? avatar(bot, 'small')
      : `<span class="avatar small neutre"><img src="${pieceSrc(c, 'k')}" alt=""></span>`;
    return `
      ${icone}
      <span class="player-name">${nomCamp(c)}</span>
      ${vsBot && c !== joueur && reflechit ? '<span class="thinking" aria-label="réfléchit"><i></i><i></i><i></i></span>' : ''}
      <span class="captures">${prises}${diff > 0 ? `<span class="plus">+${diff}</span>` : ''}</span>
      ${cadence ? `<span class="clock" data-clock="${c}"></span>` : `<span class="turn-dot ${actif ? 'on' : ''}"></span>`}`;
  }

  /* --- Pendules --- */

  const pendulesActives = () => cadence && !fin && chess.history().length >= 2;

  function consommer() {
    const maintenant = performance.now();
    if (pendulesActives()) temps[chess.turn()] -= maintenant - depuis;
    depuis = maintenant;
  }

  function majPendules() {
    if (!cadence) return;
    for (const el of $app.querySelectorAll('[data-clock]')) {
      const c = el.dataset.clock;
      el.textContent = formatTemps(temps[c]);
      el.classList.toggle('on', !fin && chess.turn() === c);
      el.classList.toggle('low', temps[c] < Math.min(20000, cadence.base * 0.1 + 5000));
    }
  }

  function tic() {
    if (++tics % 10 === 0) sauvegarder();
    consommer();
    const c = chess.turn();
    if (pendulesActives() && temps[c] <= 0) {
      temps[c] = 0;
      tempsEcoule(c);
    }
    majPendules();
  }

  // Le camp qui n'a plus de temps perd, sauf si l'adversaire ne peut plus mater (nulle).
  function tempsEcoule(c) {
    interrompreBot();
    const gagnant = c === 'w' ? 'b' : 'w';
    const pieces = chess.board().flat().filter((p) => p && p.color === gagnant && p.type !== 'k');
    const peutMater = pieces.length > 1 || (pieces.length === 1 && !['b', 'n'].includes(pieces[0].type));
    if (!peutMater) {
      resultatForce = '1/2-1/2';
      return terminer('Temps écoulé, mais plus assez de pièces pour mater : partie nulle.');
    }
    resultatForce = gagnant === 'w' ? '1-0' : '0-1';
    if (vsBot) terminer(c === joueur ? `Temps écoulé ! ${bot.nom} gagne.` : `${bot.nom} n'a plus de temps : tu gagnes 🎉`);
    else terminer(`Temps écoulé pour les ${c === 'w' ? 'Blancs' : 'Noirs'} : les ${gagnant === 'w' ? 'Blancs' : 'Noirs'} gagnent.`);
  }

  // Joue un coup en mettant les pendules à jour (incrément compris).
  function jouer(coup) {
    const camp = chess.turn();
    const actives = pendulesActives();
    consommer();
    chess.move(coup);
    if (cadence) {
      if (actives) temps[camp] += cadence.inc;
      tempsHist.push({ ...temps });
    }
    if (vsBot) {
      const m = { w: 0, b: 0 };
      for (const p of chess.board().flat()) if (p) m[p.color] += VALEURS[p.type];
      pireRetard = Math.min(pireRetard, m[joueur] - m[joueur === 'w' ? 'b' : 'w']);
    }
  }

  function gagnant() {
    if (resultatForce) return { '1-0': 'w', '0-1': 'b' }[resultatForce] || null;
    if (chess.isCheckmate()) return chess.turn() === 'w' ? 'b' : 'w';
    return null;
  }

  function compterPourHautsFaits() {
    // Une partie commencée d'une position partagée (parfois déjà gagnée) ne compte pas.
    if (signalee || fen || !chess.history().length) return;
    signalee = true;
    const g = gagnant();
    suspect = jugerPartie();
    signaler('partie', {
      mode,
      bot: bot?.id,
      resultat: !g ? 'nulle' : g === joueur ? 'victoire' : 'defaite',
      couleur: joueur,
      cadence: cadence?.groupe.id,
      coups: Math.ceil(chess.history().length / 2),
      pireRetard,
      reprise,
      suspect,
      pgn: vsBot ? pgn() : null,
      sorties: vigil?.sorties,
      absence: vigil?.absence,
    });
  }

  function texteStatut() {
    if (fin) return fin;
    if (!moteurOk) return 'Le moteur n’a pas pu se charger. Recharge la page.';
    if (vsBot && reflechit) return `${bot.nom} réfléchit…`;
    const echec = chess.inCheck() ? 'Échec ! ' : '';
    if (vsBot) return `${echec}À toi de jouer.`;
    return `${echec}Aux ${chess.turn() === 'w' ? 'Blancs' : 'Noirs'} de jouer.`;
  }

  function maj() {
    const hist = chess.history({ verbose: true });
    const dernier = hist[hist.length - 1];
    const movable = fin || (vsBot && (reflechit || chess.turn() !== joueur)) ? null : chess.turn();
    board.set({ chess, orientation, movable, lastMove: dernier && { from: dernier.from, to: dernier.to } });

    $('#bar-bas').innerHTML = barre(orientation);
    $('#bar-haut').innerHTML = barre(orientation === 'w' ? 'b' : 'w');
    $('#status').textContent = texteStatut();
    $('#status').classList.toggle('fin', !!fin);

    let li = '';
    // Partie commencée avec les Noirs au trait : la première case des Blancs reste vide (« 1. … »).
    const decale = fen?.split(' ')[1] === 'b' ? 1 : 0;
    const coup = (j) => (j < 0 ? '<span>…</span>' : hist[j] ? `<span${j === hist.length - 1 ? ' class="current"' : ''}>${hist[j].san}</span>` : '');
    for (let i = hist.length ? -decale : 0; i < hist.length; i += 2) li += `<li>${coup(i)}${coup(i + 1)}</li>`;
    const $moves = $('#moves');
    $moves.innerHTML = li || '<li class="vide">Les coups apparaîtront ici.</li>';
    $moves.scrollTop = $moves.scrollHeight;

    $('#btn-annuler').disabled = hist.length === 0;
    $('#btn-abandon').disabled = !!fin || hist.length === 0;
    majPendules();
    sauvegarder();
  }

  function sauvegarder() {
    try {
      if (fin || !chess.history().length) return sessionStorage.removeItem(CLE_PARTIE);
      // monTour : un rechargement de la page pendant le tour de l'élève compte comme une sortie.
      const garde = vigil && { sorties: vigil.sorties, absence: vigil.absence, tempsCoups, monTour: chess.turn() === joueur };
      sessionStorage.setItem(CLE_PARTIE, JSON.stringify({ signature, pgn: chess.pgn(), joueur, orientation, temps, tempsHist, pireRetard, reprise, garde }));
    } catch { /* stockage indisponible : la partie reste en mémoire seulement */ }
  }

  function lireSauvegarde() {
    try {
      const s = JSON.parse(sessionStorage.getItem(CLE_PARTIE));
      return s?.signature === signature ? s : null;
    } catch {
      return null;
    }
  }

  function resultat() {
    if (chess.isCheckmate()) {
      const gagnant = chess.turn() === 'w' ? 'b' : 'w';
      if (vsBot) return gagnant === joueur ? `Échec et mat ! Tu as battu ${bot.nom} 🎉` : `Échec et mat. ${bot.nom} a gagné.`;
      return `Échec et mat ! Les ${gagnant === 'w' ? 'Blancs' : 'Noirs'} gagnent.`;
    }
    if (chess.isStalemate()) return 'Pat : partie nulle.';
    if (chess.isThreefoldRepetition()) return 'Nulle par triple répétition.';
    if (chess.isInsufficientMaterial()) return 'Nulle : plus assez de pièces pour mater.';
    if (chess.isDraw()) return 'Nulle (règle des 50 coups).';
    return null;
  }

  function verifierFin() {
    const r = resultat();
    if (!r) return false;
    terminer(r);
    return true;
  }

  async function terminer(texte) {
    fin = texte;
    maj();
    compterPourHautsFaits();
    await sleep(400);
    if (fin !== texte) return;
    const actions = [
      { id: 'rejouer', label: 'Rejouer', primaire: true },
      ...(vsBot ? [{ id: 'revanche', label: `Revanche avec les ${joueur === 'w' ? 'Noirs' : 'Blancs'}` }] : []),
      { id: 'analyser', label: 'Analyser la partie' },
      { id: 'voir', label: 'Voir le plateau' },
    ];
    if (vsBot) actions.push({ id: 'bots', label: 'Changer de bot' });
    const gagne = vsBot && gagnant() === joueur;
    let note = '';
    if (gagne && reprise) note = '<p><small>Tu as repris des coups pendant la partie : cette victoire ne compte pas pour les hauts faits.</small></p>';
    else if (gagne && suspect) note = `<p class="alerte-consequence">⚠ <b>Victoire non homologuée</b> : ${suspect}. Elle compte comme partie jouée, pas comme victoire. C’est noté dans ton journal de contrôle.</p>`;
    const r = await modal({ titre: 'Partie terminée', html: `<p>${texte}</p>${note}`, actions });
    const choixFin = r === null ? null : actions[Number(r)]?.id;
    if (choixFin === 'rejouer') nouvellePartie();
    if (choixFin === 'revanche') nouvellePartie(null, joueur === 'w' ? 'b' : 'w');
    if (choixFin === 'analyser') analyser();
    if (choixFin === 'bots') location.hash = '#/bots';
  }

  async function choisirPromotion(c) {
    const r = await modal({
      titre: 'Promotion',
      html: `<p>Choisis ta nouvelle pièce :</p>
        <div class="promo">${['q', 'r', 'b', 'n'].map((t) =>
          `<button class="promo-btn" value="${t}" aria-label="${{ q: 'Dame', r: 'Tour', b: 'Fou', n: 'Cavalier' }[t]}"><img src="${piecePlateau(c, t)}" alt=""></button>`).join('')}</div>`,
    });
    return ['q', 'r', 'b', 'n'].includes(r) ? r : null;
  }

  async function jouerCoupHumain(from, to) {
    const coups = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!coups.length) return;
    let promotion;
    if (coups.some((m) => m.promotion)) {
      promotion = await choisirPromotion(chess.turn());
      if (!promotion) return maj();
    }
    if (fin) return maj();
    if (vsBot && debutTour !== null) tempsCoups.push(Math.round(performance.now() - debutTour));
    debutTour = null;
    jouer({ from, to, promotion });
    maj();
    if (!verifierFin() && vsBot) coupBot();
  }

  async function coupBot() {
    const gen = ++generation;
    reflechit = true;
    maj();
    const debut = performance.now();
    let uci = null;
    const coups = chess.moves({ verbose: true });

    // Gestion du temps : le bot s'accorde environ 1/30 de son temps restant (+ l'incrément).
    const reglages = { ...bot };
    let delai = 350 + Math.random() * 350;
    if (cadence) {
      const budget = temps[chess.turn()] / 30 + cadence.inc * 0.8;
      if (reglages.movetime) reglages.movetime = Math.max(50, Math.min(reglages.movetime, budget));
      else if (budget < 400) reglages.movetime = Math.max(50, budget);
      delai = Math.min(delai, budget * 0.3);
    }

    if (Math.random() < bot.hasard) {
      const m = coups[Math.floor(Math.random() * coups.length)];
      uci = m.from + m.to + (m.promotion || '');
    } else {
      try {
        uci = await engine.bestMove(chess.fen(), reglages);
        moteurOk = true;
      } catch (e) {
        console.error(e);
        moteurOk = false;
      }
    }
    // Petit délai pour que le coup du bot ne soit pas instantané.
    const attente = delai - (performance.now() - debut);
    if (attente > 0) await sleep(attente);
    if (gen !== generation || fin) return;
    reflechit = false;
    if (uci) jouer({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    debutTour = performance.now();
    maj();
    verifierFin();
  }

  function interrompreBot() {
    generation++;
    if (reflechit) engine?.stop();
    reflechit = false;
  }

  // s : partie sauvegardée à reprendre (après un rechargement de la page), sinon nouvelle partie.
  // camp : couleur imposée à l'élève (revanche avec les couleurs inversées).
  function nouvellePartie(s = null, camp = null) {
    interrompreBot();
    chess.reset();
    fin = null;
    signalee = false;
    pireRetard = s?.pireRetard || 0;
    reprise = !!s?.reprise;
    resultatForce = null;
    tempsCoups = Array.isArray(s?.garde?.tempsCoups) ? s.garde.tempsCoups : [];
    debutTour = performance.now();
    vigil?.restaurer(s?.garde);
    if (vigil && s?.garde?.monTour) vigil.ajouter();
    suspect = jugerPartie();
    if (vigil) bandeau($('#vigilance'), suspect ? `<b>Partie non homologuée</b> : ${suspect}. Une victoire ne comptera pas pour les hauts faits.` : '');
    if (s) {
      chess.loadPgn(s.pgn);
      joueur = s.joueur;
      orientation = s.orientation;
    } else {
      if (fen) chess.load(fen);
      joueur = vsBot ? camp || (couleur === 'hasard' ? (Math.random() < 0.5 ? 'w' : 'b') : couleur) : 'w';
      orientation = joueur;
      chess.setHeader('Event', `${APP.nom} – ${APP.sousTitre}`);
      chess.setHeader('Date', new Date().toISOString().slice(0, 10).replace(/-/g, '.'));
      chess.setHeader('White', nomCamp('w') === 'Toi' ? 'Élève' : nomCamp('w'));
      chess.setHeader('Black', nomCamp('b') === 'Toi' ? 'Élève' : nomCamp('b'));
      chess.setHeader('TimeControl', cadence ? `${cadence.base / 1000}+${cadence.inc / 1000}` : '-');
    }
    if (cadence) {
      temps = s?.temps ? { ...s.temps } : { w: cadence.base, b: cadence.base };
      tempsHist = s?.tempsHist?.length ? s.tempsHist : [{ ...temps }];
      depuis = performance.now();
      clearInterval(minuterie);
      minuterie = setInterval(tic, 100);
    }
    maj();
    if (vsBot) {
      engine = obtenirMoteur();
      engine.newGame().catch(() => { moteurOk = false; maj(); });
      if (chess.turn() !== joueur) coupBot();
    }
  }

  function annuler() {
    interrompreBot();
    fin = null;
    resultatForce = null;
    const defaire = () => {
      if (chess.undo() && cadence) tempsHist.pop();
    };
    if (vsBot) {
      reprise = true;
      if (chess.turn() !== joueur) defaire();
      else { defaire(); defaire(); }
    } else {
      defaire();
    }
    // Les pendules reviennent au temps qu'elles avaient à ce moment-là.
    if (cadence) {
      temps = { ...tempsHist[tempsHist.length - 1] };
      depuis = performance.now();
    }
    debutTour = performance.now();
    maj();
    if (vsBot && chess.turn() !== joueur) coupBot();
  }

  function pgn() {
    let r = '*';
    if (resultatForce) r = resultatForce;
    else if (chess.isCheckmate()) r = chess.turn() === 'w' ? '0-1' : '1-0';
    else if (fin) r = '1/2-1/2';
    chess.setHeader('Result', r);
    return chess.pgn();
  }

  function analyser() {
    if (!chess.history().length) return;
    interrompreBot();
    partieAAnalyser = pgn();
    location.hash = '#/analyse';
  }

  $('#btn-analyser').addEventListener('click', analyser);
  $('#btn-annuler').addEventListener('click', annuler);
  $('#btn-tourner').addEventListener('click', () => { orientation = orientation === 'w' ? 'b' : 'w'; maj(); });
  $('#btn-nouvelle').addEventListener('click', () => nouvellePartie());
  $('#btn-abandon').addEventListener('click', async () => {
    const r = await modal({ titre: 'Abandonner ?', html: '<p>La partie sera perdue.</p>', actions: [{ label: 'Annuler' }, { label: 'Abandonner', primaire: true }] });
    if (r !== '1') return;
    interrompreBot();
    if (fin) return;
    const perdant = vsBot ? joueur : chess.turn();
    resultatForce = perdant === 'w' ? '0-1' : '1-0';
    terminer(vsBot ? `Tu as abandonné. ${bot.nom} gagne.` : `Les ${perdant === 'w' ? 'Blancs' : 'Noirs'} abandonnent.`);
  });
  $('#btn-copier').addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(pgn());
      e.target.textContent = 'Copié ✓';
      setTimeout(() => (e.target.textContent = 'Copier PGN'), 1500);
    } catch {
      modal({ titre: 'PGN', html: `<textarea class="pgn" readonly>${pgn()}</textarea>`, actions: [{ label: 'Fermer' }] });
    }
  });
  // Le fichier est généré sur l'appareil et téléchargé directement : rien ne transite par un serveur.
  $('#btn-telecharger').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([pgn()], { type: 'application/x-chess-pgn' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `partie-${new Date().toISOString().slice(0, 10)}.pgn`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  try {
    nouvellePartie(lireSauvegarde());
  } catch {
    nouvellePartie(); // sauvegarde illisible : on repart de zéro
  }

  cleanup = () => {
    clearInterval(minuterie);
    interrompreBot();
    vigil?.detruire();
    board.destroy();
    try { sessionStorage.removeItem(CLE_PARTIE); } catch { /* rien à effacer */ }
  };
}

/* ---------- Version et nouveautés ---------- */

function afficherNouveautes() {
  modal({
    titre: `Nouveautés · v${VERSION}`,
    html: `<div class="nouveautes">${NOUVEAUTES.map((n) => `
      <section>
        <h3>v${n.version}${n.date ? ` <small>${new Date(`${n.date}T12:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</small>` : ''}</h3>
        <ul class="liste">${n.changements.map((c) => `<li>${c}</li>`).join('')}</ul>
      </section>`).join('')}</div>`,
    actions: [{ label: 'Fermer', primaire: true }],
  });
}
// Devant le numéro : une dame quand l'application est à jour, un pion quand une mise à jour attend.
const $version = document.getElementById('btn-version');
const pieceVersion = (p) => `<img class="version-piece" src="${pieceSrc('w', p)}" alt="">`;
$version.innerHTML = `${pieceVersion('q')}v${VERSION}`;
$version.title = 'Application à jour · voir les nouveautés';
let versionEnLigne = null; // numéro d'une version plus récente déjà téléchargée, en attente d'un rechargement
$version.addEventListener('click', () => (versionEnLigne ? location.reload() : afficherNouveautes()));

// Le numéro clignote tant que la page tourne avec une ancienne version : un clic recharge sur la nouvelle.
function signalerMiseAJour(nouvelle) {
  versionEnLigne = nouvelle;
  $version.innerHTML = `${pieceVersion('p')}v${VERSION} → Mettre à jour${nouvelle ? ` v${nouvelle}` : ''}`;
  $version.title = 'Une nouvelle version est prête : clique pour l’installer';
  $version.classList.add('maj-dispo');
}

// Après une mise à jour, un petit message propose de voir les nouveautés (le numéro vu est gardé dans le navigateur).
try {
  const CLE_VERSION = 'echiquier-saint-andre:version';
  const vue = localStorage.getItem(CLE_VERSION);
  if (vue && vue !== VERSION) {
    const $maj = Object.assign(document.createElement('button'), { type: 'button', className: 'toast-maj' });
    $maj.innerHTML = `<strong>Mise à jour v${VERSION} installée 🎉</strong><small>Voir les nouveautés</small>`;
    $maj.addEventListener('click', () => {
      $maj.remove();
      afficherNouveautes();
    });
    document.body.appendChild($maj);
    setTimeout(() => $maj.remove(), 9000);
  }
  localStorage.setItem(CLE_VERSION, VERSION);
} catch { /* stockage indisponible : pas de message */ }

/* ---------- Hors ligne et installation ---------- */

// Le service worker garde les fichiers du site sur l'appareil : l'application marche ensuite sans Internet.
// Quand une nouvelle version est en ligne, le nouveau service worker la télécharge puis prend la main
// (« controllerchange ») : la page ouverte tourne encore avec l'ancienne, on le signale.
if ('serviceWorker' in navigator && isSecureContext) {
  const avaitUnControleur = !!navigator.serviceWorker.controller; // sinon : toute première visite, pas une mise à jour
  navigator.serviceWorker.register('sw.js')
    .then((reg) => {
      // Une application installée (iPhone, iPad) peut rester ouverte des jours sans être rechargée : on vérifie
      // toutes les 30 minutes et à chaque retour sur l'application.
      const verifier = () => reg.update().catch(() => {});
      setInterval(verifier, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) verifier(); });
    })
    .catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (!avaitUnControleur || versionEnLigne !== null) return;
    let nouvelle = '';
    try {
      nouvelle = (await (await fetch('js/version.js')).text()).match(/VERSION = '([^']+)'/)?.[1] || '';
    } catch { /* hors ligne : on signale quand même la mise à jour, sans numéro */ }
    if (nouvelle !== VERSION) signalerMiseAJour(nouvelle);
  });
  navigator.serviceWorker.ready.then(() => {
    document.getElementById('hors-ligne').hidden = false;
    document.getElementById('hors-ligne-sep').hidden = false;
  });
}

let invitation = null; // proposée par Chrome, Edge et Android
const $installer = document.getElementById('btn-installer');
const dejaInstallee = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
$installer.hidden = dejaInstallee;
$installer.nextElementSibling.hidden = dejaInstallee;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  invitation = e;
});
window.addEventListener('appinstalled', () => {
  $installer.hidden = true;
  $installer.nextElementSibling.hidden = true;
});
$installer.addEventListener('click', async () => {
  if (invitation) {
    invitation.prompt();
    await invitation.userChoice;
    invitation = null;
    return;
  }
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  modal({
    titre: 'Installer l’application',
    html: `
      <p>Une fois installée, l’application s’ouvre comme les autres, depuis l’écran d’accueil, et <strong>fonctionne sans Internet</strong>.</p>
      <ul class="liste">
        ${apple
          ? `<li><strong>iPhone / iPad (Safari)</strong> : touche le bouton <b>Partager</b> (carré avec une flèche), puis <b>« Sur l’écran d’accueil »</b>. Ouvre ensuite l’application depuis son icône : ta progression y est protégée (sinon Safari l’efface après 7 jours sans visite).</li>
             <li><strong>Pour garder ta progression</strong> : l’application installée a sa propre mémoire. Avant d’installer, va dans <b>Hauts faits</b> → « Exporter ma progression », puis, dans l’application installée, « Importer un fichier ».</li>`
          : `<li><strong>Android (Chrome)</strong> : menu <b>⋮</b> puis <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>.</li>
             <li><strong>Ordinateur (Chrome, Edge)</strong> : l’icône <b>Installer</b> à droite de la barre d’adresse.</li>
             <li><strong>iPhone / iPad</strong> : dans Safari, <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b>.</li>`}
      </ul>
      <p><small>Même sans l’installer, il suffit d’avoir ouvert le site une fois avec Internet pour qu’il marche ensuite hors ligne.</small></p>`,
    actions: [{ label: 'Compris', primaire: true }],
  });
});

route();
majCompteur();
signaler('visite');
