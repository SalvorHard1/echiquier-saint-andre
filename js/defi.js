// Défi du jour : le même problème pour tout le monde, choisi d'après la date (aucun serveur).
// Plus difficile au fil de la semaine. Seul le premier essai compte, et il est gardé dans les hauts faits (navigateur).
import { Board, pieceSrc, monterBarreDessin } from './board.js';
import { NIVEAUX, charger, lancerProbleme, nomsThemes, matEn, confettis } from './problemes.js';
import { signaler, resultatDefi, serieDefis } from './succes.js';
import { surveiller, alerteTriche } from './vigilance.js';

// Niveau du défi selon le jour (getDay : 0 = dimanche) : facile le lundi, coriace le dimanche.
const NIVEAU_JOUR = [4, 0, 1, 1, 2, 2, 3];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const aujourdhui = () => new Date().toLocaleDateString('fr-CA'); // AAAA-MM-JJ, heure locale
const midi = (date) => new Date(`${date}T12:00`);
const decaler = (date, n) => {
  const d = midi(date);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('fr-CA');
};

export function niveauDuJour(date = aujourdhui()) {
  return NIVEAU_JOUR[midi(date).getDay()];
}

// Même date → même problème, sur tous les appareils.
function problemeDuJour(tous, date) {
  const n = NIVEAUX[niveauDuJour(date)];
  const pool = tous.filter((p) => p.rating >= n.min && p.rating < n.max).sort((a, b) => (a.id < b.id ? -1 : 1));
  const jour = Math.round(midi(date).getTime() / 86400000);
  return pool[(jour * 7919) % pool.length];
}

function avant(minutes) {
  const h = Math.floor(minutes / 60);
  return h ? `${h} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;
}

// Petit encart pour l'accueil et la page des problèmes.
export function carteDefi() {
  const date = aujourdhui();
  const r = resultatDefi(date);
  const n = NIVEAUX[niveauDuJour(date)];
  const serie = serieDefis();
  const etat = r === 1 ? '<span class="defi-etat ok">✓ Réussi</span>' : r === 0 ? '<span class="defi-etat ko">Raté · reviens demain</span>' : '<span class="defi-etat go">À toi de jouer →</span>';
  return `
    <a class="defi-carte ${r === undefined ? 'a-faire' : ''}" href="#/defi">
      <span class="defi-cal"><small>${JOURS[midi(date).getDay()].slice(0, 3)}</small><b>${midi(date).getDate()}</b></span>
      <span class="defi-texte">
        <strong>Défi du jour</strong>
        <small>Le même problème pour toute l’AS · niveau <b>${n.nom}</b></small>
      </span>
      ${serie ? `<span class="defi-serie" title="Défis réussis d’affilée">🔥 ${serie}</span>` : ''}
      ${etat}
    </a>`;
}

export function showDefi($app) {
  const date = aujourdhui();
  const iNiveau = niveauDuJour(date);
  const n = NIVEAUX[iNiveau];
  const dejaJoue = resultatDefi(date) !== undefined;
  let ctrl = null;
  let actif = true;
  let probleme = null;
  let compte = dejaJoue;
  let minuterie = null;
  const jourLong = midi(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  $app.innerHTML = `
    <section class="game probleme defi">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Défi du jour</h1>
        <span class="cad-chip">${jourLong}</span>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div id="board"></div>
          <div id="dessin"></div>
        </div>
        <aside class="panel">
          <div class="defi-niveau" style="--c:${n.couleur}">
            <span class="avatar" style="--c:${n.couleur}"><img src="${pieceSrc('w', n.piece)}" alt=""></span>
            <span><strong>Niveau ${n.nom}</strong><small>${n.titre} · un seul essai compte !</small></span>
          </div>
          <div class="statut-pb" id="statut">Chargement du défi…</div>
          <div class="semaine" id="semaine"></div>
          <div class="pb-infos" id="infos"></div>
          <div class="actions">
            <button type="button" class="btn" id="btn-indice">💡 Indice</button>
            <button type="button" class="btn" id="btn-solution">Solution</button>
          </div>
          <p class="note" id="prochain"></p>
        </aside>
      </div>
    </section>`;

  const $ = (s) => $app.querySelector(s);
  const board = new Board($('#board'), { onMove: () => {} });
  monterBarreDessin($('#dessin'), board);

  function statut(texte, etat) {
    $('#statut').className = `statut-pb etat-${etat}`;
    $('#statut').innerHTML = texte;
  }

  // La semaine en cours, du lundi au dimanche : ✓ réussi, ✗ raté.
  function majSemaine() {
    const lundi = decaler(date, -((midi(date).getDay() + 6) % 7));
    const jours = Array.from({ length: 7 }, (_, i) => decaler(lundi, i));
    $('#semaine').innerHTML = `
      <div class="semaine-tete"><strong>Ma semaine</strong><span>🔥 Série : <b>${serieDefis()}</b></span></div>
      <div class="semaine-jours">
        ${jours.map((j) => {
          const r = resultatDefi(j);
          const cls = j === date ? 'auj' : j > date ? 'futur' : '';
          const marque = r === 1 ? '<i class="ok">✓</i>' : r === 0 ? '<i class="ko">✗</i>' : '';
          return `<span class="jour ${cls}" title="${midi(j).toLocaleDateString('fr-FR', { weekday: 'long' })} · niveau ${NIVEAUX[niveauDuJour(j)].nom}">
            <small>${JOURS[midi(j).getDay()][0].toUpperCase()}</small>
            <img src="${pieceSrc('w', NIVEAUX[niveauDuJour(j)].piece)}" alt="">${marque}</span>`;
        }).join('')}
      </div>`;
  }

  function majProchain() {
    const minuit = midi(decaler(date, 1));
    minuit.setHours(0, 0, 0, 0);
    const reste = Math.max(1, Math.ceil((minuit - Date.now()) / 60000));
    $('#prochain').textContent = `Prochain défi dans ${avant(reste)} (niveau ${NIVEAUX[niveauDuJour(decaler(date, 1))].nom}).`;
  }

  // Premier essai : enregistré une seule fois par jour.
  function enregistrer(reussi) {
    if (compte) return;
    compte = true;
    signaler('defi', { date, reussi });
    majSemaine();
  }

  // Anti-triche : quitter la page pendant le premier essai (pour chercher la solution ailleurs) le fait rater.
  // Page cachée (autre onglet, onglet fermé…) : raté tout de suite, pour qu'un rechargement n'y change rien.
  // Autre fenêtre : raté au retour, si la sortie a duré.
  let sortie = false;
  function quitter() {
    if (compte) return;
    sortie = true;
    enregistrer(false);
    signaler('alerte', { genre: 'defi', texte: `Défi du ${jourLong} compté comme raté : page quittée pendant l’essai.` });
    statut('<strong>Défi raté pour aujourd’hui</strong><br><small>Tu as quitté la page pendant ton essai. Cherche quand même la solution !</small>', 'rate');
  }
  const vigil = surveiller({
    enJeu: () => actif && !!probleme && (!compte || sortie),
    monTour: () => true,
    onCache: quitter,
    onRetour: () => {
      quitter();
      if (!sortie) return;
      sortie = false;
      alerteTriche({
        texte: 'Tu as quitté la page pendant le défi du jour (autre onglet, autre fenêtre ou autre appli).',
        consequence: 'Le défi d’aujourd’hui compte comme raté. Reviens demain !',
      });
    },
  });

  function etat(e, info = {}) {
    if (!actif) return;
    const couleur = ctrl.joueur === 'w' ? 'Blancs' : 'Noirs';
    const mat = matEn(probleme);
    if (e === 'tour' || e === 'reessaie') statut(`<strong>${e === 'tour' ? `Aux ${couleur} de jouer` : 'À toi, réessaie !'}</strong>${mat ? ` · mat en ${mat}` : ''}<br><small>${dejaJoue ? `Défi déjà ${resultatDefi(date) ? 'réussi ✓' : 'tenté'} aujourd’hui : cet essai ne compte pas.` :'Réfléchis bien avant de jouer : une seule chance ! Ne quitte pas la page, sinon le défi compte comme raté.'}</small>`, 'tour');
    if (e === 'bon') statut('<strong>Bon coup !</strong> Continue…', 'bon');
    if (e === 'rate') {
      if (info.premiere && !compte) {
        enregistrer(false);
        statut('<strong>Raté pour aujourd’hui…</strong><br><small>Le défi est perdu, mais cherche quand même la solution !</small>', 'rate');
      } else statut('<strong>Ce n’est pas le bon coup.</strong> Réessaie.', 'rate');
    }
    if (e === 'resolu' || e === 'solution') {
      $('#btn-indice').disabled = true;
      $('#btn-solution').disabled = true;
      $('#infos').innerHTML = `<div><small>Difficulté</small> <b>${probleme.rating}</b></div>
        <div><small>Thèmes</small> ${nomsThemes(probleme).map((t) => `<span class="tag">${t}</span>`).join('') || '–'}</div>`;
      majProchain();
      minuterie = setInterval(majProchain, 30000);
    }
    if (e === 'solution') statut('<strong>Voici la solution.</strong><br><small>Reviens demain pour un nouveau défi !</small>', 'rate');
  }

  function fin({ reussi }) {
    const premierEssai = !compte;
    enregistrer(reussi);
    if (reussi && premierEssai) {
      confettis($('#board'));
      const s = serieDefis();
      statut(`<strong>Défi réussi ! ${s > 1 ? `Série de ${s} jours 🔥` : '🎉'}</strong><br><small>Demande à tes camarades s’ils l’ont trouvé !</small>`, 'resolu');
    } else if (resultatDefi(date) === 1) {
      statut('<strong>Bien joué !</strong><br><small>Tu avais déjà réussi le défi d’aujourd’hui.</small>', 'resolu');
    } else if (!$('#statut').classList.contains('etat-rate') || reussi) {
      statut('<strong>Trouvé !</strong><br><small>Mais le défi compte comme raté (erreur ou aide). Reviens demain !</small>', 'bon');
    }
  }

  $('#btn-indice').addEventListener('click', () => {
    enregistrer(false);
    ctrl?.indice();
  });
  $('#btn-solution').addEventListener('click', () => {
    enregistrer(false);
    ctrl?.solution();
  });

  majSemaine();
  charger()
    .then((tous) => {
      if (!actif) return;
      probleme = problemeDuJour(tous, date);
      if (dejaJoue) {
        const r = resultatDefi(date);
        statut(`<strong>${r ? 'Tu as réussi le défi d’aujourd’hui ✓' : 'Tu as déjà tenté le défi d’aujourd’hui'}</strong><br><small>Tu peux le rejouer, mais seul le premier essai compte.</small>`, r ? 'resolu' : 'attente');
        majProchain();
      } else statut('Regarde le dernier coup de l’adversaire…', 'attente');
      ctrl = lancerProbleme(board, probleme, { onEtat: etat, onFin: fin, delaiDebut: dejaJoue ? 1600 : 900 });
    })
    .catch(() => statut('Impossible de charger le défi. Recharge la page.', 'rate'));

  return () => {
    actif = false;
    vigil.detruire();
    clearInterval(minuterie);
    ctrl?.detruire();
    board.destroy();
  };
}
