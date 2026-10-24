// Position partagée par un prof (lien ou QR code) : l'élève la voit et peut la jouer contre un bot ou à deux.
// La position voyage dans l'adresse (après le #) : rien ne passe par un serveur.
import { Chess } from '../vendor/chess/chess.js';
import { Board, pieceSrc } from './board.js';
import { BOTS } from './bots.js';

export function fenValide(fen) {
  if (!fen) return null;
  try {
    return new Chess(fen).fen();
  } catch {
    return null;
  }
}

export function showPosition($app, fenBrute) {
  const fen = fenValide(fenBrute);
  if (!fen) {
    $app.innerHTML = `
      <section class="page">
        <div class="page-head">
          <a href="#/" class="btn ghost">← Accueil</a>
          <h1>Position partagée</h1>
        </div>
        <p class="erreur">Ce lien ne contient pas de position valable. Demande à ton prof de le partager à nouveau.</p>
      </section>`;
    return null;
  }
  const chess = new Chess(fen);
  const trait = chess.turn();
  let bot = 'cavalier';

  $app.innerHTML = `
    <section class="game">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Position partagée</h1>
      </div>
      <div class="game-layout">
        <div class="board-col"><div id="board"></div></div>
        <aside class="panel">
          <div class="status">${chess.isGameOver() ? 'La partie est terminée dans cette position.' : `Trait aux ${trait === 'w' ? 'Blancs' : 'Noirs'}.`}</div>
          <p class="note">Joue la suite avec les ${trait === 'w' ? 'Blancs' : 'Noirs'} contre un bot, ou à deux sur cet écran.</p>
          <div class="bots-mini" role="radiogroup" aria-label="Niveau du bot">
            ${BOTS.map((b) => `
              <button type="button" role="radio" data-bot="${b.id}" aria-checked="${b.id === bot}" title="${b.niveau}">
                <span class="avatar small" style="--c:${b.couleur}"><img src="${pieceSrc(b.camp || 'w', b.piece)}" alt=""></span>${b.nom}
              </button>`).join('')}
          </div>
          <div class="actions">
            <button type="button" class="btn primary wide" id="btn-bot" ${chess.isGameOver() ? 'disabled' : ''}>Jouer contre le bot</button>
            <button type="button" class="btn wide" id="btn-deux" ${chess.isGameOver() ? 'disabled' : ''}>Jouer à deux</button>
          </div>
        </aside>
      </div>
    </section>`;

  const board = new Board($app.querySelector('#board'), { onMove: () => {} });
  board.set({ chess, orientation: trait, movable: null });
  $app.querySelectorAll('[data-bot]').forEach((el) => el.addEventListener('click', () => {
    bot = el.dataset.bot;
    $app.querySelectorAll('[data-bot]').forEach((x) => x.setAttribute('aria-checked', x === el));
  }));
  const f = encodeURIComponent(fen);
  $app.querySelector('#btn-bot').addEventListener('click', () => { location.hash = `#/jouer?bot=${bot}&couleur=${trait}&t=aucune&fen=${f}`; });
  $app.querySelector('#btn-deux').addEventListener('click', () => { location.hash = `#/deux/jouer?t=aucune&fen=${f}`; });
  return () => board.destroy();
}
