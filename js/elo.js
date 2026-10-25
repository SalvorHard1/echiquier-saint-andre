// Classement Elo de l'espace Prof-AS : la liste des élèves du club et le journal de leurs parties.
// Les prénoms restent sur l'appareil du prof (localStorage), jamais envoyés sur Internet.
// Seul le journal des parties est enregistré : les Elo sont recalculés depuis 800 en le relisant,
// si bien que corriger ou supprimer une partie remet tout le classement juste.
import { modal } from './modal.js';

const CLE = 'echiquier-saint-andre:elo';
export const ELO_DEPART = 800;
const K_DEBUT = 40; // pendant les premières parties : l'élève trouve vite son niveau…
const PARTIES_DEBUT = 10;
const K = 20; // …puis le classement se stabilise
const SCORES = { '1-0': [1, 0], '0-1': [0, 1], '1/2': [0.5, 0.5] };

/* ---------- Sauvegarde ---------- */

const valide = (d) => d && Array.isArray(d.eleves) && Array.isArray(d.parties);

export function lireElo() {
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (valide(d)) return d;
  } catch { /* stockage indisponible ou illisible */ }
  return { eleves: [], parties: [] };
}

export function ecrireElo(d) {
  try { localStorage.setItem(CLE, JSON.stringify(d)); } catch { /* navigation privée : rien n'est gardé */ }
}

const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const prochainId = (liste) => liste.reduce((m, x) => Math.max(m, x.id), -1) + 1;
const memeJour = (t, u = Date.now()) => new Date(t).toDateString() === new Date(u).toDateString();
const signe = (x) => (Math.round(x) > 0 ? `+${Math.round(x)}` : Math.round(x) < 0 ? `−${-Math.round(x)}` : '0');
const normaliser = (s) => s.trim().toLocaleLowerCase('fr-FR');

export const eleveParNom = (d, nom) => d.eleves.find((e) => normaliser(e.nom) === normaliser(nom));

export function ajouterEleve(d, nom) {
  const e = { id: prochainId(d.eleves), nom: nom.trim() };
  d.eleves.push(e);
  return e;
}

/* ---------- Calcul ---------- */

const attendu = (ra, rb) => 1 / (1 + 10 ** ((rb - ra) / 400));
const facteurK = (nbParties) => (nbParties < PARTIES_DEBUT ? K_DEBUT : K);

// Gain ou perte de chaque camp pour chaque résultat possible, avant de jouer.
function enjeux(a, b) {
  const ea = attendu(a.elo, b.elo);
  return Object.fromEntries(Object.entries(SCORES).map(([r, [sa, sb]]) => [r, [facteurK(a.parties) * (sa - ea), facteurK(b.parties) * (sb - (1 - ea))]]));
}

// Relit le journal dans l'ordre : Elo, bilan et progression du jour de chaque élève, et écart de chaque partie.
export function calculElo(d) {
  const joueurs = new Map(d.eleves.map((e) => [e.id, { ...e, elo: ELO_DEPART, parties: 0, v: 0, n: 0, d: 0, jour: 0, partiesJour: 0, max: ELO_DEPART }]));
  const ecarts = new Map();
  for (const p of [...d.parties].sort((x, y) => x.t - y.t)) {
    const a = joueurs.get(p.b);
    const b = joueurs.get(p.n);
    if (!a || !b || !SCORES[p.r]) continue;
    const [da, db] = enjeux(a, b)[p.r];
    ecarts.set(p.id, [da, db]);
    const aujourdhui = memeJour(p.t);
    for (const [j, dj, s] of [[a, da, SCORES[p.r][0]], [b, db, SCORES[p.r][1]]]) {
      j.elo += dj;
      j.max = Math.max(j.max, j.elo);
      j.parties++;
      if (s === 1) j.v++;
      else if (s === 0.5) j.n++;
      else j.d++;
      if (aujourdhui) {
        j.jour += dj;
        j.partiesJour++;
      }
    }
  }
  return { joueurs, ecarts };
}

export function classementElo(d) {
  const { joueurs } = calculElo(d);
  return [...joueurs.values()].filter((j) => !j.retire).sort((a, b) => b.elo - a.elo || b.parties - a.parties || a.nom.localeCompare(b.nom, 'fr'));
}

// Une partie du mode tournoi : ajoutée, corrigée ou retirée (r = null) du journal selon le résultat saisi.
export function partieTournoi(cle, b, n, r) {
  const d = lireElo();
  const i = d.parties.findIndex((p) => p.cle === cle);
  if (!r) {
    if (i >= 0) d.parties.splice(i, 1);
  } else if (i >= 0) {
    d.parties[i].r = r;
  } else {
    d.parties.push({ id: prochainId(d.parties), t: Date.now(), b, n, r, cle });
  }
  ecrireElo(d);
}

/* ---------- Écrans ---------- */

function onglets(actif) {
  return `
    <nav class="segmented elo-onglets" aria-label="Classement Elo">
      <a href="#/prof/elo" role="tab" aria-selected="${actif === 'liste'}">🏆 Liste des élèves</a>
      <a href="#/prof/elo/matchs" role="tab" aria-selected="${actif === 'matchs'}">⚔ Matchs Elo</a>
    </nav>`;
}

function enTete(titre, extra = '') {
  return `
    <div class="page-head">
      <a href="#/prof" class="btn ghost">← Prof-AS</a>
      <h1>${titre}</h1>
      ${extra}
    </div>`;
}

/* --- Onglet « Liste des élèves » --- */

export function showEloListe($app) {
  let d = lireElo();
  let voirRetires = false;

  function sauver() {
    ecrireElo(d);
    rendu();
  }

  function rendu() {
    const tableau = classementElo(d);
    const retires = d.eleves.filter((e) => e.retire);
    const progres = tableau.filter((j) => j.partiesJour && Math.round(j.jour) > 0).sort((a, b) => b.jour - a.jour).slice(0, 3);
    $app.innerHTML = `
      <section class="page elo" id="elo">
        ${enTete('Classement Elo', tableau.length ? '<button type="button" class="btn ghost pousse-droite" id="btn-grand">⛶ Plein écran</button>' : '')}
        ${onglets('liste')}
        ${progres.length ? `
          <div class="elo-progres">
            <strong>Meilleures progressions du jour</strong>
            ${progres.map((j) => `<span>${echapper(j.nom)} <b>${signe(j.jour)}</b></span>`).join('')}
          </div>` : ''}
        ${tableau.length ? `
          <div class="table-defile">
            <table class="classement">
              <thead><tr><th>#</th><th>Élève</th><th>Elo</th><th title="Gain ou perte des parties d’aujourd’hui">Aujourd’hui</th><th>Parties</th><th>V</th><th>N</th><th>D</th><th></th></tr></thead>
              <tbody>${tableau.map((j, i) => `
                <tr class="${i < 3 && j.parties ? `podium-${i + 1}` : ''}">
                  <td>${i < 3 && j.parties ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                  <td>${echapper(j.nom)}</td>
                  <td><strong>${Math.round(j.elo)}</strong></td>
                  <td class="${j.jour > 0.5 ? 'elo-plus' : j.jour < -0.5 ? 'elo-moins' : ''}">${j.partiesJour ? signe(j.jour) : ''}</td>
                  <td>${j.parties}</td><td>${j.v}</td><td>${j.n}</td><td>${j.d}</td>
                  <td class="elo-actions">
                    <button type="button" class="btn ghost mini-btn" data-renommer="${j.id}">Renommer</button>
                    <button type="button" class="btn ghost mini-btn" data-retirer="${j.id}">Retirer</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` : '<p class="note">Aucun élève pour l’instant : ajoute la liste du club ci-dessous. Chacun démarre à 800.</p>'}

        <div class="panel tournoi-creation elo-ajout">
          <label for="elo-noms">Ajouter des élèves (un prénom par ligne)</label>
          <textarea id="elo-noms" class="pgn" spellcheck="false" placeholder="Alice&#10;Bilal&#10;Chloé&#10;…"></textarea>
          <p class="erreur" id="elo-erreur" hidden></p>
          <button type="button" class="btn primary" id="btn-ajouter">Ajouter (${ELO_DEPART} Elo)</button>
          <p class="note">Les prénoms restent sur cet appareil uniquement. Pense à exporter une sauvegarde de temps en temps : sur iPad et Safari, le navigateur efface les données d’un site après 7 jours sans visite (sauf si l’application est installée sur l’écran d’accueil).</p>
        </div>

        ${retires.length ? `
          <p><button type="button" class="btn ghost" id="btn-retires">${voirRetires ? 'Masquer' : 'Voir'} les élèves retirés (${retires.length})</button></p>
          ${voirRetires ? `<ul class="elo-retires">${retires.map((e) => `<li>${echapper(e.nom)} <button type="button" class="btn ghost mini-btn" data-remettre="${e.id}">Remettre</button></li>`).join('')}</ul>` : ''}` : ''}

        <div class="tournoi-outils">
          <button type="button" class="btn" id="btn-copier" ${tableau.length ? '' : 'disabled'}>Copier le classement</button>
          <button type="button" class="btn" id="btn-imprimer" ${tableau.length ? '' : 'disabled'}>Imprimer</button>
          <button type="button" class="btn" id="btn-exporter">Exporter une sauvegarde</button>
          <label class="btn"><input type="file" id="fichier-elo" accept=".json,application/json" hidden>Importer une sauvegarde</label>
          <button type="button" class="btn" id="btn-saison" ${d.parties.length ? '' : 'disabled'}>Nouvelle saison</button>
          <button type="button" class="btn" id="btn-effacer" ${d.eleves.length ? '' : 'disabled'}>Tout effacer</button>
        </div>
      </section>`;
    brancher(tableau);
  }

  function brancher(tableau) {
    const sur = (id, f) => $app.querySelector(id)?.addEventListener('click', f);
    const eleve = (id) => d.eleves.find((e) => e.id === Number(id));

    sur('#btn-ajouter', () => {
      const $erreur = $app.querySelector('#elo-erreur');
      const noms = [...new Set($app.querySelector('#elo-noms').value.split('\n').map((n) => n.trim()).filter(Boolean))];
      const doublons = noms.filter((n) => eleveParNom(d, n));
      if (!noms.length) return;
      if (doublons.length) {
        $erreur.textContent = `Déjà dans la liste : ${doublons.join(', ')}. Ajoute une initiale pour les distinguer (ex. « Léo M. »).`;
        $erreur.hidden = false;
        return;
      }
      for (const n of noms) ajouterEleve(d, n);
      sauver();
    });

    $app.querySelectorAll('[data-renommer]').forEach((b) => b.addEventListener('click', async () => {
      const e = eleve(b.dataset.renommer);
      const r = await modal({
        titre: 'Renommer',
        html: `<input class="champ" id="elo-nouveau" value="${echapper(e.nom)}">`,
        actions: [{ label: 'Annuler' }, { label: 'Renommer', primaire: true }],
      });
      const nom = document.getElementById('elo-nouveau')?.value.trim();
      if (r !== '1' || !nom) return;
      const autre = eleveParNom(d, nom);
      if (autre && autre !== e) {
        modal({ titre: 'Prénom déjà pris', html: `<p>« ${echapper(nom)} » est déjà dans la liste.</p>`, actions: [{ label: 'Fermer', primaire: true }] });
        return;
      }
      e.nom = nom;
      sauver();
    }));

    // Retirer garde les parties jouées : le Elo de ses adversaires ne change pas.
    $app.querySelectorAll('[data-retirer]').forEach((b) => b.addEventListener('click', async () => {
      const e = eleve(b.dataset.retirer);
      const r = await modal({
        titre: `Retirer ${echapper(e.nom)} ?`,
        html: '<p>Il disparaît du classement et des matchs, mais ses parties restent comptées pour ses adversaires. Tu pourras le remettre.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Retirer', primaire: true }],
      });
      if (r !== '1') return;
      e.retire = true;
      sauver();
    }));

    sur('#btn-retires', () => {
      voirRetires = !voirRetires;
      rendu();
    });
    $app.querySelectorAll('[data-remettre]').forEach((b) => b.addEventListener('click', () => {
      delete eleve(b.dataset.remettre).retire;
      sauver();
    }));

    sur('#btn-copier', async (e) => {
      const texte = ['Classement Elo de l’AS', ...tableau.map((j, i) => `${i + 1}. ${j.nom} – ${Math.round(j.elo)} (${j.parties} partie${j.parties > 1 ? 's' : ''})`)].join('\n');
      try {
        await navigator.clipboard.writeText(texte);
        e.target.textContent = 'Copié ✓';
      } catch {
        modal({ titre: 'Classement', html: `<textarea class="pgn" readonly>${echapper(texte)}</textarea>`, actions: [{ label: 'Fermer' }] });
      }
    });

    sur('#btn-imprimer', () => window.print());

    sur('#btn-exporter', () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `classement-elo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    $app.querySelector('#fichier-elo').addEventListener('change', async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      let lu = null;
      try { lu = JSON.parse(await f.text()); } catch { /* fichier illisible */ }
      if (!valide(lu)) {
        modal({ titre: 'Fichier refusé', html: '<p>Ce fichier n’est pas une sauvegarde du classement Elo.</p>', actions: [{ label: 'Fermer', primaire: true }] });
        return;
      }
      const r = await modal({
        titre: 'Importer cette sauvegarde ?',
        html: `<p>${lu.eleves.length} élève(s) et ${lu.parties.length} partie(s). Elle remplace le classement actuel de cet appareil.</p>`,
        actions: [{ label: 'Annuler' }, { label: 'Importer', primaire: true }],
      });
      if (r !== '1') return;
      d = lu;
      sauver();
    });

    sur('#btn-saison', async () => {
      const r = await modal({
        titre: 'Nouvelle saison ?',
        html: '<p>Toutes les parties sont effacées et chaque élève repart à 800. La liste des élèves est gardée. Exporte une sauvegarde avant si tu veux garder la saison passée.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Nouvelle saison', primaire: true }],
      });
      if (r !== '1') return;
      d.parties = [];
      sauver();
    });

    sur('#btn-effacer', async () => {
      const r = await modal({
        titre: 'Tout effacer ?',
        html: '<p>Les prénoms, les parties et le classement seront supprimés de cet appareil.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Effacer', primaire: true }],
      });
      if (r !== '1') return;
      d = { eleves: [], parties: [] };
      sauver();
    });

    sur('#btn-grand', () => {
      const $s = $app.querySelector('#elo');
      if (document.fullscreenElement) document.exitFullscreen();
      else $s.requestFullscreen?.().catch(() => {});
    });
  }

  rendu();
  return () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
}

/* --- Onglet « Matchs Elo » --- */

export function showEloMatchs($app) {
  let d = lireElo();
  let blancs = null;
  let noirs = null;
  let message = '';

  function rendu() {
    const { joueurs, ecarts } = calculElo(d);
    const presents = [...joueurs.values()].filter((j) => !j.retire).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const options = (choisi, autre) => `<option value="">— Choisir —</option>${presents
      .map((j) => `<option value="${j.id}" ${j.id === choisi ? 'selected' : ''} ${j.id === autre ? 'disabled' : ''}>${echapper(j.nom)} (${Math.round(j.elo)})</option>`).join('')}`;
    const prets = blancs !== null && noirs !== null;
    const jeu = prets && enjeux(joueurs.get(blancs), joueurs.get(noirs));
    const nom = (id) => echapper(joueurs.get(id)?.nom ?? '?');
    const historique = [...d.parties].sort((x, y) => y.t - x.t);
    const jours = [];
    for (const p of historique) {
      const jour = new Date(p.t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (jours.at(-1)?.jour !== jour) jours.push({ jour, parties: [] });
      jours.at(-1).parties.push(p);
    }

    $app.innerHTML = `
      <section class="page elo">
        ${enTete('Matchs Elo')}
        ${onglets('matchs')}
        ${presents.length < 2 ? '<p class="note">Il faut au moins deux élèves dans la <a href="#/prof/elo">liste</a> pour saisir un match.</p>' : `
          <div class="panel elo-saisie">
            <div class="elo-camps">
              <label><span><span class="pastille blanc"></span>Blancs</span><select class="champ" id="sel-blancs">${options(blancs, noirs)}</select></label>
              <label><span><span class="pastille noir"></span>Noirs</span><select class="champ" id="sel-noirs">${options(noirs, blancs)}</select></label>
            </div>
            <span class="resultats elo-resultats" role="group" aria-label="Résultat">
              ${[['1-0', 'Blancs gagnent'], ['1/2', 'Nulle'], ['0-1', 'Noirs gagnent']].map(([r, l]) => `
                <button type="button" data-res="${r}" ${prets ? '' : 'disabled'}>
                  <b>${r === '1/2' ? '½-½' : r}</b><small>${l}</small>
                  ${jeu ? `<small class="elo-enjeu">${signe(jeu[r][0])} / ${signe(jeu[r][1])}</small>` : ''}
                </button>`).join('')}
            </span>
            <p class="note">${prets ? 'Touche le résultat pour l’enregistrer. Sous chaque bouton : Elo gagné ou perdu par les Blancs / les Noirs.' : 'Choisis les deux joueurs, puis le résultat.'}</p>
            ${message ? `<p class="status elo-message">${message}</p>` : ''}
          </div>`}

        <h2 class="section-titre">Parties jouées <small>${d.parties.length}</small></h2>
        ${jours.length ? jours.map(({ jour, parties }) => `
          <h3 class="elo-jour">${jour}</h3>
          <ul class="elo-historique">${parties.map((p) => {
            const [eb, en] = ecarts.get(p.id) || [0, 0];
            return `
            <li>
              <span class="j blanc">${nom(p.b)} <small class="${eb > 0.5 ? 'elo-plus' : eb < -0.5 ? 'elo-moins' : ''}">${signe(eb)}</small></span>
              <b>${p.r === '1/2' ? '½-½' : p.r}</b>
              <span class="j noir">${nom(p.n)} <small class="${en > 0.5 ? 'elo-plus' : en < -0.5 ? 'elo-moins' : ''}">${signe(en)}</small></span>
              <small class="elo-source">${p.cle ? 'Tournoi' : new Date(p.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
              <button type="button" class="btn ghost mini-btn" data-suppr="${p.id}" aria-label="Supprimer cette partie">✕</button>
            </li>`;
          }).join('')}</ul>`).join('') : '<p class="note">Aucune partie pour l’instant.</p>'}
      </section>`;
    brancher(joueurs);
  }

  function brancher(joueurs) {
    const choix = (id) => (id === '' ? null : Number(id));
    $app.querySelector('#sel-blancs')?.addEventListener('change', (e) => { blancs = choix(e.target.value); message = ''; rendu(); });
    $app.querySelector('#sel-noirs')?.addEventListener('change', (e) => { noirs = choix(e.target.value); message = ''; rendu(); });

    $app.querySelectorAll('[data-res]').forEach((b) => b.addEventListener('click', () => {
      if (blancs === null || noirs === null) return;
      const r = b.dataset.res;
      const [eb, en] = enjeux(joueurs.get(blancs), joueurs.get(noirs))[r];
      d.parties.push({ id: prochainId(d.parties), t: Date.now(), b: blancs, n: noirs, r });
      ecrireElo(d);
      const nom = (id) => echapper(joueurs.get(id).nom);
      message = `✓ Enregistré : ${nom(blancs)} ${signe(eb)}, ${nom(noirs)} ${signe(en)}.`;
      blancs = null;
      noirs = null;
      rendu();
    }));

    $app.querySelectorAll('[data-suppr]').forEach((b) => b.addEventListener('click', async () => {
      const p = d.parties.find((x) => x.id === Number(b.dataset.suppr));
      const nom = (id) => echapper(joueurs.get(id)?.nom ?? '?');
      const r = await modal({
        titre: 'Supprimer cette partie ?',
        html: `<p>${nom(p.b)} – ${nom(p.n)} (${p.r === '1/2' ? '½-½' : p.r}). Les Elo sont recalculés comme si elle n’avait pas été jouée.</p>
          ${p.cle ? '<p class="note">Elle vient du mode tournoi : si le tournoi est encore en cours, change plutôt le résultat là-bas.</p>' : ''}`,
        actions: [{ label: 'Annuler' }, { label: 'Supprimer', primaire: true }],
      });
      if (r !== '1') return;
      d.parties = d.parties.filter((x) => x !== p);
      ecrireElo(d);
      message = '';
      rendu();
    }));
  }

  rendu();
  return null;
}
