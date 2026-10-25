// Espace Prof-AS : verrouillé par un mot de passe, il regroupe le mode projection, le partage d'une position
// par QR code, le mode tournoi et la lecture du dossier de contrôle d'un élève (anti-triche).
// Le verrou évite que les élèves tombent dessus par hasard ; ce n'est pas une vraie sécurité (le site est
// public et tout se passe dans le navigateur). Rien de confidentiel ne doit donc se trouver derrière.
import { Chess } from '../vendor/chess/chess.js';
import { Board, monterBarreDessin } from './board.js';
import { piecePlateau } from './skins.js';
import { modal } from './modal.js';
import { APP } from './config.js';
import { qrSvg } from './qr.js';
import { BOTS } from './bots.js';
import { lireDossier, rangActuel, insigneRang, journalHtml, echapper, HAUTS_FAITS, PALIERS } from './succes.js';
import { precisionPartie } from './analyse.js';

const CLE_PROF = 'echiquier-saint-andre:prof';
const CLE_ESSAIS = 'echiquier-saint-andre:prof-essais';
const NOMS = { k: 'Roi', q: 'Dame', r: 'Tour', b: 'Fou', n: 'Cavalier', p: 'Pion' };

/* ---------- Verrou ---------- */
// config.js contient « pbkdf2:itérations:sel:contrôle ». Le mot de passe donne une clé (PBKDF2, lent exprès pour
// freiner les essais en masse) et le contrôle est le SHA-256 de cette clé. L'onglet déverrouillé garde la clé :
// copier le contrôle public de config.js dans le sessionStorage ne suffit donc pas pour entrer.

const INACTIVITE = 30 * 60_000; // verrouillage automatique après 30 min sans toucher l'appareil
const ESSAIS_LIBRES = 5; // erreurs permises avant d'attendre
const ATTENTE = 30_000; // attente après la 5ᵉ erreur, doublée à chaque erreur suivante…
const ATTENTE_MAX = 15 * 60_000; // …jusqu'à 15 min

const hex = (octets) => [...new Uint8Array(octets)].map((b) => b.toString(16).padStart(2, '0')).join('');
const octetsHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

// null si config.js a encore une empreinte de l'ancien format (SHA-256 simple).
function empreinte() {
  const m = /^pbkdf2:(\d+):([0-9a-f]{32}):([0-9a-f]{64})$/.exec(APP.motDePasseProf);
  return m && { iterations: Number(m[1]), sel: m[2], controle: m[3] };
}

async function deriver(mdp, { iterations, sel }) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(mdp), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: octetsHex(sel), iterations }, base, 256));
}

const controle = async (cle) => hex(await crypto.subtle.digest('SHA-256', octetsHex(cle)));

function lire(stockage, cle) {
  try { return JSON.parse(stockage.getItem(cle)) || null; } catch { return null; }
}
function ecrire(stockage, cle, valeur) {
  try { stockage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ }
}

let cleVerifiee = null; // clé de session déjà contrôlée depuis le chargement de la page

// 'ok', 'a-controler' (clé pas encore contrôlée depuis le chargement) ou null (verrouillé).
function etatSession() {
  const s = lire(sessionStorage, CLE_PROF);
  if (!s || typeof s.cle !== 'string' || !/^[0-9a-f]{64}$/.test(s.cle) || !empreinte()) return null;
  if (!(Date.now() - s.vu < INACTIVITE)) {
    verrouiller();
    return null;
  }
  return s.cle === cleVerifiee ? 'ok' : 'a-controler';
}

async function deverrouille() {
  const etat = etatSession();
  if (etat !== 'a-controler') return etat === 'ok';
  const { cle } = lire(sessionStorage, CLE_PROF);
  if (!crypto.subtle || (await controle(cle)) !== empreinte().controle) {
    verrouiller();
    return false;
  }
  cleVerifiee = cle;
  return true;
}

function verrouiller() {
  cleVerifiee = null;
  try { sessionStorage.removeItem(CLE_PROF); } catch { /* rien à effacer */ }
}

// Toute action sur l'appareil repousse le verrouillage automatique.
let derniereActivite = 0;
function activite() {
  if (Date.now() - derniereActivite < 15_000) return;
  const s = lire(sessionStorage, CLE_PROF);
  if (!s || etatSession() === null) return;
  derniereActivite = Date.now();
  ecrire(sessionStorage, CLE_PROF, { ...s, vu: derniereActivite });
}
for (const ev of ['pointerdown', 'keydown', 'wheel']) document.addEventListener(ev, activite, { capture: true, passive: true });

// Après 30 min d'inactivité, l'espace se reverrouille même s'il est resté affiché.
setInterval(() => {
  if (!lire(sessionStorage, CLE_PROF) || etatSession() !== null) return;
  if (location.hash.startsWith('#/prof')) window.dispatchEvent(new HashChangeEvent('hashchange'));
}, 30_000);

// Attente imposée après trop d'erreurs (gardée dans le localStorage pour résister au rechargement).
function attenteRestante() {
  const e = lire(localStorage, CLE_ESSAIS);
  return e ? Math.max(0, (e.jusqua || 0) - Date.now()) : 0;
}
function noterEchec() {
  const echecs = (lire(localStorage, CLE_ESSAIS)?.echecs || 0) + 1;
  const jusqua = echecs >= ESSAIS_LIBRES ? Date.now() + Math.min(ATTENTE * 2 ** (echecs - ESSAIS_LIBRES), ATTENTE_MAX) : 0;
  ecrire(localStorage, CLE_ESSAIS, { echecs, jusqua });
}

// Affiche la page demandée si l'espace est déverrouillé, sinon le formulaire de mot de passe.
export function gardeProf($app, afficher) {
  if (etatSession() === 'ok') return afficher();
  let fin = null;
  let annule = false;
  $app.innerHTML = '';
  deverrouille().then((ok) => {
    if (!annule) fin = ok ? afficher() : formulaireVerrou($app);
  });
  return () => {
    annule = true;
    fin?.();
  };
}

function formulaireVerrou($app) {
  $app.innerHTML = `
    <section class="page prof-verrou">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Espace Prof-AS</h1>
      </div>
      <form class="verrou-carte" id="form-verrou">
        <span class="verrou-icone" aria-hidden="true">🔒</span>
        <p>Cet espace est réservé aux professeurs de l’AS : tournoi, projection au tableau et dossiers des élèves.</p>
        <label for="mdp">Mot de passe</label>
        <input type="password" id="mdp" class="champ" autocomplete="current-password" required>
        <p class="erreur" id="erreur-mdp" hidden></p>
        <button type="submit" class="btn primary big">Déverrouiller</button>
      </form>
    </section>`;
  const $form = $app.querySelector('#form-verrou');
  const $erreur = $app.querySelector('#erreur-mdp');
  const $mdp = $app.querySelector('#mdp');
  const $bouton = $form.querySelector('button[type="submit"]');
  let enCours = false;
  const message = (texte) => {
    $erreur.textContent = texte;
    $erreur.hidden = !texte;
  };

  // Compte à rebours tant qu'il faut attendre après trop d'erreurs.
  function majAttente() {
    if (enCours) return;
    const reste = attenteRestante();
    $bouton.disabled = reste > 0;
    if (reste > 0) {
      const s = Math.ceil(reste / 1000);
      message(`Trop d’erreurs. Réessaie dans ${s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`}.`);
    } else if ($erreur.dataset.attente) {
      message('');
    }
    $erreur.dataset.attente = reste > 0 ? '1' : '';
  }
  const minuteur = setInterval(majAttente, 1000);
  majAttente();

  if (!empreinte()) {
    message('Le mot de passe doit être recréé : double-clique sur « Mot-de-passe-prof.bat », puis envoie js/config.js sur GitHub.');
    $bouton.disabled = true;
    clearInterval(minuteur);
  }
  $mdp.focus();

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enCours || attenteRestante() > 0 || !empreinte()) return;
    if (!crypto.subtle) return message('Ce navigateur ne peut pas vérifier le mot de passe ici (il faut une adresse https://).');
    enCours = true;
    $bouton.disabled = true;
    $bouton.textContent = 'Vérification…';
    const cle = await deriver($mdp.value, empreinte());
    const bon = (await controle(cle)) === empreinte().controle;
    enCours = false;
    $bouton.textContent = 'Déverrouiller';
    $bouton.disabled = false;
    if (!bon) {
      noterEchec();
      message('Mot de passe incorrect.');
      majAttente();
      $mdp.select();
      return;
    }
    try { localStorage.removeItem(CLE_ESSAIS); } catch { /* rien à effacer */ }
    ecrire(sessionStorage, CLE_PROF, { cle, vu: Date.now() });
    cleVerifiee = cle;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  return () => clearInterval(minuteur);
}

/* ---------- Accueil de l'espace prof ---------- */

export function showProf($app) {
  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Espace Prof-AS</h1>
        <button type="button" class="btn ghost pousse-droite" id="btn-verrouiller">🔒 Verrouiller</button>
      </div>
      <div class="cards">
        <a class="card" href="#/prof/tournoi">
          <span class="card-icon" style="--c:#d97706"><img src="${piecePlateau('w', 'k')}" alt=""></span>
          <span class="card-text"><strong>Mode tournoi</strong><small>Inscris les élèves présents : appariements au système suisse, résultats et classement.</small></span>
        </a>
        <a class="card" href="#/prof/elo">
          <span class="card-icon" style="--c:#16a34a"><img src="${piecePlateau('w', 'r')}" alt=""></span>
          <span class="card-text"><strong>Liste des élèves Elo</strong><small>Le classement Elo du club : chacun démarre à 800 et gagne ou perd des points à chaque match ou tournoi.</small></span>
        </a>
        <a class="card" href="#/prof/elo/matchs">
          <span class="card-icon" style="--c:#7c3aed"><img src="${piecePlateau('w', 'n')}" alt=""></span>
          <span class="card-text"><strong>Matchs Elo</strong><small>Note qui a gagné contre qui : les Elo des deux élèves sont mis à jour aussitôt.</small></span>
        </a>
        <a class="card" href="#/prof/projection">
          <span class="card-icon" style="--c:#2563eb"><img src="${piecePlateau('w', 'q')}" alt=""></span>
          <span class="card-text"><strong>Mode projection</strong><small>Grand échiquier pour le tableau : éditeur de position, flèches, plein écran, et QR code pour partager la position aux élèves.</small></span>
        </a>
        <a class="card" href="#/prof/dossier">
          <span class="card-icon" style="--c:#dc2626"><img src="${piecePlateau('w', 'b')}" alt=""></span>
          <span class="card-text"><strong>👁 L’Œil de Caïssa</strong><small>Le détecteur de triche : lis le dossier d’un élève, son pourcentage de triche détectée, ses alertes, et analyse ses parties gagnées (PGN).</small></span>
        </a>
      </div>
    </section>`;
  $app.querySelector('#btn-verrouiller').addEventListener('click', () => {
    verrouiller();
    location.hash = '#/';
  });
  return null;
}

/* ---------- Dossier de contrôle d'un élève ---------- */
// Le fichier exporté par l'élève (page Hauts faits) est lu sur cet appareil, gardé en mémoire le temps
// de l'onglet pour revenir de l'analyse d'une partie, et jamais enregistré.

let dossier = null; // { nom, e, signe, retires, precisions: { index de la partie: { precision, parfaits } } }

const dateHeure = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Points de suspicion de chaque élément (modifiables facilement) : [points par occurrence, plafond].
const POIDS = {
  sauvegarde: [40, 40], // sauvegarde retouchée dans le navigateur
  horloge: [25, 50], // horloge remise en arrière
  import: [20, 40], // fichier retouché refusé, ou hauts faits incohérents à l'import
  incoherence: [20, 20], // progression incohérente
  partie: [12, 36], // victoire non homologuée (sorties de la page, rythme de moteur)
  defi: [6, 18], // défi du jour raté pour avoir quitté la page
  effacement: [5, 10], // progression effacée (peut servir à cacher quelque chose)
  stockfish: [25, 25], // victoire homologuée contre Stockfish à pleine puissance (≈ 3000 Elo)
  maitre: [10, 10], // victoire homologuée contre le Maître (≈ 2200 Elo)
  precision: [15, 45], // partie gagnée contre un bot fort avec ≥ 90 % de précision (25 points à ≥ 95 %)
};
const LIBELLES = {
  sauvegarde: 'Sauvegarde retouchée dans le navigateur',
  horloge: 'Horloge de l’appareil remise en arrière',
  import: 'Import d’un fichier retouché ou incohérent',
  incoherence: 'Progression incohérente',
  partie: 'Victoires non homologuées',
  defi: 'Défis ratés pour avoir quitté la page',
  effacement: 'Progression effacée',
  stockfish: 'Victoire contre Stockfish à pleine puissance',
  maitre: 'Victoire contre le Maître',
  precision: 'Précision de moteur contre un bot fort',
};
const NIVEAUX_TRICHE = [
  { min: 80, nom: 'Triche très probable', cls: 'n4' },
  { min: 50, nom: 'Suspect', cls: 'n3' },
  { min: 20, nom: 'À surveiller', cls: 'n2' },
  { min: 0, nom: 'Rien de suspect', cls: 'n1' },
];

// Pourcentage de triche détectée, avec le détail des éléments qui y contribuent.
function scoreTriche({ e, signe, retires, precisions }) {
  if (!signe) return { pct: 100, elements: [{ texte: 'Fichier modifié à la main (signature invalide)', points: 100 }] };
  const nb = {};
  const ajouter = (k, n = 1) => (nb[k] = (nb[k] || 0) + n);
  for (const j of e.garde.journal) if (POIDS[j.type]) ajouter(j.type);
  if (retires) ajouter('incoherence');
  if (e.c.victoires.stockfish) ajouter('stockfish');
  if (e.c.victoires.maitre) ajouter('maitre');
  // Bien jouer contre un petit bot est normal : seule la précision contre Dame, Roi, Maître et Stockfish compte.
  const preuves = [...e.garde.preuves].reverse();
  const pointsPrecision = Object.entries(precisions)
    .filter(([i]) => ['dame', 'roi', 'maitre', 'stockfish'].includes(preuves[i]?.bot))
    .reduce((s, [, p]) => s + (p.precision >= 95 ? 25 : p.precision >= 90 ? 15 : 0), 0);
  const elements = Object.entries(nb).map(([k, n]) => ({ texte: `${LIBELLES[k]}${n > 1 ? ` (×${n})` : ''}`, points: Math.min(POIDS[k][0] * n, POIDS[k][1]) }));
  if (pointsPrecision) elements.push({ texte: LIBELLES.precision, points: Math.min(pointsPrecision, POIDS.precision[1]) });
  elements.sort((a, b) => b.points - a.points);
  // 100 % est réservé à la preuve certaine (fichier retouché).
  return { pct: Math.min(99, elements.reduce((s, x) => s + x.points, 0)), elements };
}

export function showDossier($app, { analyser }) {
  let actif = true;
  let calcul = null; // progression du calcul de précision en cours (texte)

  async function calculerPrecisions() {
    const preuves = [...dossier.e.garde.preuves].reverse();
    const d = dossier;
    for (let i = 0; i < preuves.length && actif && dossier === d; i++) {
      if (d.precisions[i]) continue;
      calcul = `Partie ${i + 1} / ${preuves.length}…`;
      afficher();
      try {
        const r = await precisionPartie(preuves[i].pgn, {
          actif: () => actif && dossier === d,
          onProgres: (x) => {
            const $p = $app.querySelector('#calcul');
            if ($p) $p.textContent = `Partie ${i + 1} / ${preuves.length} : ${Math.round(x * 100)} %`;
          },
        });
        if (!actif || dossier !== d) return;
        d.precisions[i] = r || { precision: null };
      } catch {
        calcul = null;
        return afficher('Le moteur n’a pas pu se charger. Recharge la page.');
      }
    }
    calcul = null;
    if (actif && dossier === d) afficher();
  }

  function afficher(erreur = '') {
    $app.innerHTML = `
      <section class="page">
        <div class="page-head">
          <a href="#/prof" class="btn ghost">← Prof-AS</a>
          <h1>👁 L’Œil de Caïssa</h1>
        </div>
        <p class="intro">Caïssa, la déesse des échecs, voit tout. L’élève exporte sa progression (page <b>Hauts faits</b> → « Exporter ma progression ») et te donne le fichier.
          Il est lu sur cet appareil uniquement, sans être enregistré.</p>
        <div class="import-actions">
          <label class="btn primary">
            <input type="file" id="fichier-dossier" accept=".json,application/json" hidden>
            ${dossier ? 'Lire un autre dossier' : 'Lire un dossier'}
          </label>
          ${dossier ? '<button type="button" class="btn" id="btn-fermer-dossier">Fermer le dossier</button>' : ''}
        </div>
        ${erreur ? `<p class="erreur">${erreur}</p>` : ''}
        ${dossier ? contenu() : ''}
      </section>`;
    brancher();
  }

  function jauge() {
    const { pct, elements } = scoreTriche(dossier);
    const niveau = NIVEAUX_TRICHE.find((n) => pct >= n.min);
    const nbPreuves = dossier.e.garde.preuves.length;
    const faites = Object.keys(dossier.precisions).length;
    return `
      <div class="triche-score ${niveau.cls}">
        <div class="triche-tete">
          <span class="triche-pct">${pct} %</span>
          <span><small>L’Œil de Caïssa · triche détectée</small><strong>${niveau.nom}</strong></span>
        </div>
        <div class="hf-prog grand"><span style="width:${pct}%"></span></div>
        ${elements.length ? `<ul class="triche-elements">${elements.map((x) => `<li><span>${x.texte}</span><b>+${x.points}</b></li>`).join('')}</ul>`
          : '<p class="note">Aucun élément suspect dans ce dossier.</p>'}
        ${nbPreuves ? `<p class="note">${faites < nbPreuves
          ? `La précision des parties gagnées n’est ${faites ? 'pas encore calculée pour toutes les parties' : 'pas encore calculée'} : elle peut faire monter le score.`
          : 'Précision de toutes les parties calculée.'}</p>
          ${calcul ? `<p class="note" id="calcul">${calcul}</p>`
            : faites < nbPreuves ? '<button type="button" class="btn" id="btn-precisions">Calculer la précision des parties (Stockfish)</button>' : ''}` : ''}
        <p class="note">Le pourcentage additionne des indices, ce n’est pas une preuve. Seul « fichier modifié à la main » est certain : parles-en avec l’élève, et rejoue avec lui une position de sa partie.</p>
      </div>`;
  }

  function contenu() {
    const { e, signe, retires, nom } = dossier;
    const c = e.c;
    const { rang, pts } = rangActuel(e);
    const nbHf = Object.keys(e.debloques).length;
    const rares = HAUTS_FAITS.filter((h) => e.debloques[h.id] && ['or', 'diamant'].includes(h.palier))
      .sort((a, b) => e.debloques[b.id] - e.debloques[a.id]);
    const preuves = [...e.garde.preuves].reverse();
    const nomBot = (id) => BOTS.find((b) => b.id === id)?.nom || id;
    return `
      <p class="dossier-signature ${signe ? 'ok' : 'ko'}">${signe
        ? `✓ Fichier authentique : <b>${echapper(nom)}</b> n’a pas été retouché.`
        : `⚠ Signature invalide : <b>${echapper(nom)}</b> a été modifié à la main. Les résultats ci-dessous ne sont pas fiables.`}</p>
      ${retires ? `<p class="erreur">${retires} haut(s) fait(s) incohérent(s) avec la progression ont été ignorés.</p>` : ''}

      ${jauge()}

      <div class="rang-card dossier-resume">
        ${insigneRang(rang)}
        <div class="rang-texte">
          <small>Rang</small>
          <strong>${rang.nom}</strong>
          <small>${pts} points · ${nbHf} / ${HAUTS_FAITS.length} hauts faits${e.garde.vu ? ` · dernière activité le ${dateHeure(e.garde.vu)}` : ''}</small>
          <small>${c.partiesBot} partie(s) contre les bots · ${Object.values(c.victoires).reduce((a, b) => a + b, 0)} victoire(s) homologuée(s)
            · <b class="${c.victoiresNonHomologuees ? 'dossier-ko' : ''}">${c.victoiresNonHomologuees} non homologuée(s)</b></small>
        </div>
      </div>

      <div class="donnees">
        <h2>Journal de contrôle</h2>
        ${journalHtml(e)}
      </div>

      <div class="donnees">
        <h2>Parties à vérifier</h2>
        <p>Victoires contre les bots Dame, Roi, Maître et Stockfish, et toutes les victoires non homologuées. « Analyser » ouvre la partie dans l’analyse Stockfish :
          une précision très élevée, coup après coup, contre un bot fort doit faire réagir.</p>
        ${preuves.length ? `<ul class="dossier-parties">${preuves.map((p, i) => `
          <li class="${p.homologuee ? '' : 'suspecte'}">
            <span>
              <b>Contre ${echapper(nomBot(p.bot))}</b>${p.cadence ? ` · ${echapper(p.cadence)}` : ''} · ${dateHeure(p.t)}
              <small>${p.homologuee ? '✓ Homologuée' : `⚠ Non homologuée : ${echapper(p.raison || '')}`}
                ${p.sorties ? ` · ${p.sorties} sortie(s), ${Math.round(p.absence / 1000)} s hors de la page` : ''}
                ${dossier.precisions[i]?.precision != null ? ` · <b class="${dossier.precisions[i].precision >= 90 ? 'dossier-ko' : ''}">précision ${Math.round(dossier.precisions[i].precision)} %</b>, ${Math.round(dossier.precisions[i].parfaits)} % de coups parfaits` : ''}</small>
            </span>
            <span class="dossier-boutons">
              <button type="button" class="btn" data-pgn="${i}">PGN</button>
              <button type="button" class="btn primary" data-analyser="${i}">Analyser</button>
            </span>
          </li>`).join('')}</ul>` : '<p class="note">Aucune partie à vérifier.</p>'}
      </div>

      <div class="donnees">
        <h2>Hauts faits Épiques et Mythiques</h2>
        ${rares.length ? `<ul class="journal">${rares.map((h) => `<li><time>${dateHeure(e.debloques[h.id])}</time> <b>${h.nom}</b> · ${PALIERS[h.palier].nom} · <small>${h.desc}</small></li>`).join('')}</ul>`
          : '<p class="note">Aucun pour l’instant.</p>'}
      </div>`;
  }

  function brancher() {
    const preuves = dossier ? [...dossier.e.garde.preuves].reverse() : [];
    $app.querySelector('#fichier-dossier').addEventListener('change', async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      if (f.size > 1_000_000) return afficher('Ce fichier est trop gros pour une sauvegarde de hauts faits.');
      const lu = lireDossier(await f.text());
      if (lu.erreur) return afficher(lu.erreur);
      dossier = { ...lu, nom: f.name, precisions: {} };
      calcul = null;
      afficher();
    });
    $app.querySelector('#btn-fermer-dossier')?.addEventListener('click', () => {
      dossier = null;
      calcul = null;
      afficher();
    });
    $app.querySelector('#btn-precisions')?.addEventListener('click', calculerPrecisions);
    $app.querySelectorAll('[data-analyser]').forEach((b) => b.addEventListener('click', () => analyser(preuves[Number(b.dataset.analyser)].pgn)));
    $app.querySelectorAll('[data-pgn]').forEach((b) => b.addEventListener('click', () => {
      modal({ titre: 'PGN de la partie', html: `<textarea class="pgn" readonly>${echapper(preuves[Number(b.dataset.pgn)].pgn)}</textarea>`, actions: [{ label: 'Fermer', primaire: true }] });
    }));
  }

  afficher();
  // Le calcul de précision en cours s'arrête à la position suivante.
  return () => {
    actif = false;
    calcul = null;
  };
}

/* ---------- Partage d'une position ---------- */

export function lienPosition(fen) {
  return `${location.origin}${location.pathname}#/position?fen=${encodeURIComponent(fen)}`;
}

export function partagerPosition(fen) {
  const lien = lienPosition(fen);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  modal({
    titre: 'Partager la position',
    html: `
      <p>Les élèves scannent le QR code avec l’appareil photo de leur téléphone : la position s’ouvre et ils peuvent la jouer contre un bot ou à deux.</p>
      <div class="qr-cadre">${qrSvg(lien, { titre: 'QR code de la position' })}</div>
      ${local ? '<p class="erreur">Tu es sur la version de test (localhost) : ce QR code ne marchera pas sur les téléphones. Utilise le site en ligne (GitHub Pages).</p>' : ''}
      <input class="champ lien-partage" readonly value="${lien.replace(/"/g, '&quot;')}" aria-label="Lien de la position">`,
    actions: [{ label: 'Copier le lien' }, { label: 'Fermer', primaire: true }],
  }).then(async (r) => {
    if (r !== '0') return;
    try { await navigator.clipboard.writeText(lien); } catch { /* copie impossible : le lien reste affiché */ }
  });
}

/* ---------- Mode projection ---------- */

export function showProjection($app, { edition: enEdition = false } = {}) {
  const chess = new Chess();
  let orientation = 'w';
  let edition = enEdition;
  let pinceau = 'wq'; // pièce posée en mode édition ('x' = gomme)
  let trait = 'w';
  let erreur = '';

  $app.innerHTML = `
    <section class="game projection" id="projection">
      <div class="page-head">
        <a href="#/prof" class="btn ghost">← Prof-AS</a>
        <h1>Mode projection</h1>
      </div>
      <div class="game-layout">
        <div class="board-col">
          <div id="board"></div>
          <div id="dessin"></div>
        </div>
        <aside class="panel" id="panneau"></aside>
      </div>
    </section>`;

  const $section = $app.querySelector('#projection');
  const $panneau = $app.querySelector('#panneau');
  const board = new Board($app.querySelector('#board'), { onMove: jouerCoup });
  monterBarreDessin($app.querySelector('#dessin'), board);

  /* --- Édition de la position --- */

  function fenEdition() {
    const placement = chess.fen().split(' ')[0];
    const est = (sq, type, color) => {
      const p = chess.get(sq);
      return p && p.type === type && p.color === color;
    };
    let roques = '';
    if (est('e1', 'k', 'w')) roques += (est('h1', 'r', 'w') ? 'K' : '') + (est('a1', 'r', 'w') ? 'Q' : '');
    if (est('e8', 'k', 'b')) roques += (est('h8', 'r', 'b') ? 'k' : '') + (est('a8', 'r', 'b') ? 'q' : '');
    return `${placement} ${trait} ${roques || '-'} - 0 1`;
  }

  // Renvoie un message d'erreur si la position n'est pas jouable, sinon null.
  function verifierPosition(fen) {
    const pieces = chess.board().flat().filter(Boolean);
    for (const c of ['w', 'b']) {
      if (pieces.filter((p) => p.type === 'k' && p.color === c).length !== 1) return `Il faut exactement un roi ${c === 'w' ? 'blanc' : 'noir'}.`;
    }
    try {
      const autre = new Chess(fen.replace(` ${trait} `, ` ${trait === 'w' ? 'b' : 'w'} `), { skipValidation: true });
      if (autre.inCheck()) return `Le roi ${trait === 'w' ? 'noir' : 'blanc'} est en échec alors que ce n’est pas à lui de jouer.`;
      new Chess(fen);
    } catch {
      return 'Cette position n’est pas valable.';
    }
    return null;
  }

  function poser(sq) {
    erreur = '';
    const actuelle = chess.get(sq);
    if (pinceau === 'x') {
      chess.remove(sq);
    } else {
      const [color, type] = pinceau;
      if (actuelle && actuelle.color === color && actuelle.type === type) {
        chess.remove(sq); // retoucher la même pièce l'enlève
      } else if (type === 'p' && /[18]$/.test(sq)) {
        erreur = 'Un pion ne peut pas être sur la première ou la dernière rangée.';
      } else {
        if (type === 'k') {
          const ancien = chess.board().flat().find((p) => p && p.type === 'k' && p.color === color);
          if (ancien) chess.remove(ancien.square);
        }
        chess.remove(sq);
        chess.put({ type, color }, sq);
      }
    }
    maj();
  }

  board.el.addEventListener('pointerup', (e) => {
    if (!edition || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const sq = document.elementFromPoint(e.clientX, e.clientY)?.closest('.sq')?.dataset.sq;
    if (sq) poser(sq);
  });

  function terminerEdition() {
    const fen = fenEdition();
    const pb = verifierPosition(fen);
    if (pb) {
      erreur = pb;
      return maj();
    }
    chess.load(fen);
    edition = false;
    erreur = '';
    maj();
  }

  /* --- Coups --- */

  async function jouerCoup(from, to) {
    const coups = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!coups.length) return;
    let promotion;
    if (coups.some((m) => m.promotion)) {
      const c = chess.turn();
      const r = await modal({
        titre: 'Promotion',
        html: `<div class="promo">${['q', 'r', 'b', 'n'].map((t) =>
          `<button class="promo-btn" value="${t}" aria-label="${NOMS[t]}"><img src="${piecePlateau(c, t)}" alt=""></button>`).join('')}</div>`,
      });
      if (!['q', 'r', 'b', 'n'].includes(r)) return maj();
      promotion = r;
    }
    chess.move({ from, to, promotion });
    maj();
  }

  function statut() {
    const camp = chess.turn() === 'w' ? 'Blancs' : 'Noirs';
    if (chess.isCheckmate()) return `Échec et mat : les ${chess.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent.`;
    if (chess.isStalemate()) return 'Pat : partie nulle.';
    if (chess.isDraw()) return 'Partie nulle.';
    return `${chess.inCheck() ? 'Échec ! ' : ''}Trait aux ${camp}.`;
  }

  /* --- Affichage --- */

  function panneauEdition() {
    const palette = ['w', 'b'].flatMap((c) => ['k', 'q', 'r', 'b', 'n', 'p'].map((t) => `
      <button type="button" class="palette-piece" data-pinceau="${c}${t}" aria-pressed="${pinceau === c + t}" aria-label="${NOMS[t]} ${c === 'w' ? 'blanc' : 'noir'}">
        <img src="${piecePlateau(c, t)}" alt="">
      </button>`)).join('');
    return `
      <div class="status">Touche une pièce, puis les cases où la poser.</div>
      <div class="palette">${palette}
        <button type="button" class="palette-piece gomme" data-pinceau="x" aria-pressed="${pinceau === 'x'}" aria-label="Gomme">✕</button>
      </div>
      <div class="choix-couleur">
        <span id="label-trait">Trait aux</span>
        <div class="segmented" role="radiogroup" aria-labelledby="label-trait">
          ${[['w', 'Blancs'], ['b', 'Noirs']].map(([v, l]) => `<button type="button" role="radio" data-trait="${v}" aria-checked="${trait === v}">${l}</button>`).join('')}
        </div>
      </div>
      ${erreur ? `<p class="erreur">${erreur}</p>` : ''}
      <div class="actions">
        <button type="button" class="btn" id="btn-vider">Vider</button>
        <button type="button" class="btn" id="btn-depart-edition">Départ</button>
        <button type="button" class="btn" id="btn-tourner">⇅ Tourner</button>
        <button type="button" class="btn" id="btn-partager-edition">QR code</button>
        <button type="button" class="btn primary wide" id="btn-fin-edition">Terminer la position</button>
      </div>`;
  }

  function panneauJeu() {
    const hist = chess.history();
    let li = '';
    const coup = (j) => (hist[j] ? `<span${j === hist.length - 1 ? ' class="current"' : ''}>${hist[j]}</span>` : '');
    for (let i = 0; i < hist.length; i += 2) li += `<li>${coup(i)}${coup(i + 1)}</li>`;
    return `
      <div class="status">${statut()}</div>
      <ol class="moves" id="moves">${li || '<li class="vide">Les deux camps se jouent sur ce plateau.</li>'}</ol>
      <div class="actions">
        <button type="button" class="btn" id="btn-annuler" ${hist.length ? '' : 'disabled'}>↶ Annuler</button>
        <button type="button" class="btn" id="btn-tourner">⇅ Tourner</button>
        <button type="button" class="btn" id="btn-editer">✎ Éditer</button>
        <button type="button" class="btn" id="btn-depart">Départ</button>
        <button type="button" class="btn" id="btn-charger">Coller FEN/PGN</button>
        <button type="button" class="btn" id="btn-copier-fen">Copier FEN</button>
        <button type="button" class="btn" id="btn-plein-ecran">⛶ Plein écran</button>
        <button type="button" class="btn primary" id="btn-partager">QR code</button>
      </div>`;
  }

  function maj() {
    const hist = chess.history({ verbose: true });
    const dernier = !edition && hist[hist.length - 1];
    board.set({ chess, orientation, movable: edition ? null : chess.turn(), lastMove: dernier && { from: dernier.from, to: dernier.to } });
    $section.classList.toggle('en-edition', edition);
    $panneau.innerHTML = edition ? panneauEdition() : panneauJeu();
    const $moves = $panneau.querySelector('#moves');
    if ($moves) $moves.scrollTop = $moves.scrollHeight;
    brancher();
  }

  function brancher() {
    const sur = (id, f) => $panneau.querySelector(id)?.addEventListener('click', f);
    $panneau.querySelectorAll('[data-pinceau]').forEach((b) => b.addEventListener('click', () => { pinceau = b.dataset.pinceau; maj(); }));
    $panneau.querySelectorAll('[data-trait]').forEach((b) => b.addEventListener('click', () => { trait = b.dataset.trait; erreur = ''; maj(); }));
    sur('#btn-tourner', () => { orientation = orientation === 'w' ? 'b' : 'w'; maj(); });
    sur('#btn-vider', () => { chess.clear(); erreur = ''; maj(); });
    sur('#btn-depart-edition', () => { chess.reset(); trait = 'w'; erreur = ''; maj(); });
    sur('#btn-fin-edition', terminerEdition);
    sur('#btn-partager-edition', () => {
      const fen = fenEdition();
      const pb = verifierPosition(fen);
      if (pb) {
        erreur = pb;
        return maj();
      }
      partagerPosition(fen);
    });
    sur('#btn-annuler', () => { chess.undo(); maj(); });
    sur('#btn-editer', () => {
      trait = chess.turn();
      chess.load(chess.fen()); // l'historique repart de la position affichée
      edition = true;
      maj();
    });
    sur('#btn-depart', () => { chess.reset(); maj(); });
    sur('#btn-charger', charger);
    sur('#btn-copier-fen', async (e) => {
      try {
        await navigator.clipboard.writeText(chess.fen());
        e.target.textContent = 'Copié ✓';
      } catch {
        modal({ titre: 'FEN', html: `<textarea class="pgn" readonly>${chess.fen()}</textarea>`, actions: [{ label: 'Fermer' }] });
      }
    });
    sur('#btn-plein-ecran', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else $section.requestFullscreen?.().catch(() => {});
    });
    sur('#btn-partager', () => partagerPosition(chess.fen()));
  }

  async function charger() {
    const r = await modal({
      titre: 'Charger une position',
      html: '<p>Colle une position FEN ou une partie PGN :</p><textarea class="pgn" id="texte-charger" spellcheck="false"></textarea>',
      actions: [{ label: 'Annuler' }, { label: 'Charger', primaire: true }],
    });
    if (r !== '1') return;
    const texte = document.getElementById('texte-charger')?.value.trim();
    if (!texte) return;
    try {
      if (/^[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7}(\s|$)/.test(texte)) chess.load(texte);
      else chess.loadPgn(texte);
    } catch {
      modal({ titre: 'Impossible de charger', html: '<p>Ce texte n’est ni une position FEN ni une partie PGN valable.</p>', actions: [{ label: 'Fermer', primaire: true }] });
    }
    maj();
  }

  const quitterPleinEcran = () => maj();
  document.addEventListener('fullscreenchange', quitterPleinEcran);
  maj();

  return () => {
    document.removeEventListener('fullscreenchange', quitterPleinEcran);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    board.destroy();
  };
}
