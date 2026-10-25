// Historique « Mes parties » : les dernières parties jouées sur cet appareil, pour les revoir et les analyser.
// Gardé dans le localStorage du navigateur de l'élève uniquement, sans nom (comme les hauts faits).
import { modal } from './modal.js';
import { BOTS } from './bots.js';
import { pieceSrc } from './board.js';

const CLE = 'echiquier-saint-andre:historique';
export const MAX_PARTIES = 50; // au-delà, les plus anciennes s'effacent (sauf les parties gardées ⭐)
export const COUPS_MIN = 6; // une partie quittée avant ce nombre de demi-coups n'est pas gardée

function lire() {
  try {
    const h = JSON.parse(localStorage.getItem(CLE));
    if (Array.isArray(h)) return h;
  } catch { /* stockage indisponible ou illisible */ }
  return [];
}

function ecrire(h) {
  try { localStorage.setItem(CLE, JSON.stringify(h)); } catch { /* navigation privée : rien n'est gardé */ }
}

// Ajoute la partie, ou la met à jour si elle est déjà dans l'historique (même id : partie reprise après « Annuler »).
// p : { id, mode: 'bot'|'deux', bot, joueur, resultat: '1-0'|'0-1'|'1/2-1/2'|'*', fin, pgn, coups, cadence, fen }
export function enregistrerPartie(p) {
  let h = lire();
  const i = h.findIndex((x) => x.id === p.id);
  if (i >= 0) h[i] = { ...h[i], ...p };
  else h.unshift({ t: Date.now(), ...p });
  // On efface les plus anciennes non gardées.
  while (h.length > MAX_PARTIES) {
    const j = h.findLastIndex((x) => !x.garde);
    if (j < 0) break;
    h.splice(j, 1);
  }
  ecrire(h);
}

const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Résultat vu par l'élève : victoire, défaite, nulle ou partie inachevée.
function issue(p) {
  if (p.resultat === '*') return { cls: 'inachevee', texte: 'Inachevée' };
  if (p.resultat === '1/2-1/2') return { cls: 'nulle', texte: 'Nulle' };
  const gagnant = p.resultat === '1-0' ? 'w' : 'b';
  if (p.mode !== 'bot') return { cls: 'neutre', texte: `${gagnant === 'w' ? 'Blancs' : 'Noirs'} gagnent` };
  return gagnant === p.joueur ? { cls: 'victoire', texte: 'Victoire' } : { cls: 'defaite', texte: 'Défaite' };
}

export function showHistorique($app, { analyser }) {
  let h = lire();
  let filtre = 'toutes';

  function sauver() {
    ecrire(h);
    rendu();
  }

  function carte(p) {
    const bot = p.mode === 'bot' && BOTS.find((b) => b.id === p.bot);
    const { cls, texte } = issue(p);
    const titre = bot ? `Contre ${echapper(bot.nom)}` : 'Partie à deux';
    const icone = bot
      ? `<span class="avatar small" style="--c:${bot.couleur}"><img src="${pieceSrc(bot.camp || 'w', bot.piece)}" alt=""></span>`
      : `<span class="avatar small neutre"><img src="${pieceSrc('w', 'n')}" alt=""></span>`;
    const quand = new Date(p.t).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <li class="partie-h">
        ${icone}
        <span class="partie-infos">
          <b>${titre}</b>
          <small>${quand} · ${p.coups} coup${p.coups > 1 ? 's' : ''}${bot ? ` · avec les ${p.joueur === 'w' ? 'Blancs' : 'Noirs'}` : ''}${p.cadence ? ` · ${echapper(p.cadence)}` : ''}${p.fen ? ' · position partagée' : ''}</small>
          ${p.fin ? `<small class="partie-fin">${echapper(p.fin)}</small>` : ''}
        </span>
        <span class="issue ${cls}">${texte}</span>
        <span class="partie-boutons">
          <button type="button" class="btn ghost mini-btn" data-garder="${p.id}" aria-pressed="${!!p.garde}" title="${p.garde ? 'Ne plus garder' : 'Garder cette partie (elle ne s’effacera pas)'}">${p.garde ? '⭐' : '☆'}</button>
          <button type="button" class="btn ghost mini-btn" data-pgn="${p.id}">PGN</button>
          <button type="button" class="btn ghost mini-btn" data-suppr="${p.id}" aria-label="Supprimer cette partie">✕</button>
          <button type="button" class="btn primary" data-analyser="${p.id}">Revoir et analyser</button>
        </span>
      </li>`;
  }

  function rendu() {
    const filtres = {
      toutes: () => true,
      victoires: (p) => issue(p).cls === 'victoire',
      defaites: (p) => issue(p).cls === 'defaite',
      gardees: (p) => p.garde,
    };
    const liste = h.filter(filtres[filtre]);
    const bilan = { v: 0, n: 0, d: 0 };
    for (const p of h) {
      const c = issue(p).cls;
      if (c === 'victoire') bilan.v++;
      else if (c === 'defaite') bilan.d++;
      else if (c === 'nulle') bilan.n++;
    }
    $app.innerHTML = `
      <section class="page">
        <div class="page-head">
          <a href="#/" class="btn ghost">← Accueil</a>
          <h1>Mes parties</h1>
        </div>
        <p class="intro">Tes ${MAX_PARTIES} dernières parties (contre les bots et à deux) sont gardées sur cet appareil.
          « Revoir et analyser » rejoue la partie coup par coup avec Stockfish, qui corrige tes erreurs.
          Touche ☆ pour garder une partie pour toujours.</p>
        ${h.length ? `
          <div class="historique-tete">
            <div class="segmented" role="radiogroup" aria-label="Filtrer">
              ${[['toutes', `Toutes (${h.length})`], ['victoires', `Victoires (${bilan.v})`], ['defaites', `Défaites (${bilan.d})`], ['gardees', '⭐ Gardées']]
                .map(([v, l]) => `<button type="button" role="radio" data-filtre="${v}" aria-checked="${filtre === v}">${l}</button>`).join('')}
            </div>
          </div>
          ${liste.length ? `<ul class="historique">${liste.map(carte).join('')}</ul>` : '<p class="note">Aucune partie ici.</p>'}
          <div class="tournoi-outils"><button type="button" class="btn" id="btn-tout-effacer">Effacer l’historique</button></div>`
          : '<p class="note">Aucune partie pour l’instant. Joue <a href="#/bots">contre un bot</a> ou <a href="#/deux">à deux</a> : tes parties apparaîtront ici.</p>'}
      </section>`;
    brancher();
  }

  function brancher() {
    const partie = (id) => h.find((p) => p.id === Number(id));
    $app.querySelectorAll('[data-filtre]').forEach((b) => b.addEventListener('click', () => { filtre = b.dataset.filtre; rendu(); }));
    $app.querySelectorAll('[data-analyser]').forEach((b) => b.addEventListener('click', () => analyser(partie(b.dataset.analyser).pgn)));
    $app.querySelectorAll('[data-garder]').forEach((b) => b.addEventListener('click', () => {
      const p = partie(b.dataset.garder);
      p.garde = !p.garde;
      sauver();
    }));
    $app.querySelectorAll('[data-pgn]').forEach((b) => b.addEventListener('click', () => {
      modal({ titre: 'PGN de la partie', html: `<textarea class="pgn" readonly>${echapper(partie(b.dataset.pgn).pgn)}</textarea>`, actions: [{ label: 'Fermer', primaire: true }] });
    }));
    $app.querySelectorAll('[data-suppr]').forEach((b) => b.addEventListener('click', async () => {
      const r = await modal({ titre: 'Supprimer cette partie ?', actions: [{ label: 'Annuler' }, { label: 'Supprimer', primaire: true }] });
      if (r !== '1') return;
      h = h.filter((p) => p.id !== Number(b.dataset.suppr));
      sauver();
    }));
    $app.querySelector('#btn-tout-effacer')?.addEventListener('click', async () => {
      const r = await modal({
        titre: 'Effacer l’historique ?',
        html: '<p>Toutes les parties gardées sur cet appareil seront supprimées, même les ⭐. Tes hauts faits ne changent pas.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Effacer', primaire: true }],
      });
      if (r !== '1') return;
      h = [];
      sauver();
    });
  }

  rendu();
  return null;
}
