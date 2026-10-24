// Mode tournoi de l'espace Prof-AS : système suisse, résultats et classement.
// Les prénoms des élèves restent sur l'appareil du prof (localStorage), jamais envoyés sur Internet.
// Le prof peut tout effacer à la fin du tournoi.
import { modal } from './modal.js';

const CLE = 'echiquier-saint-andre:tournoi';
const POINTS = { '1-0': [1, 0], '0-1': [0, 1], '1/2': [0.5, 0.5] };

/* ---------- Sauvegarde ---------- */

function lire() {
  try {
    const t = JSON.parse(localStorage.getItem(CLE));
    if (t && Array.isArray(t.joueurs) && Array.isArray(t.rondes)) return t;
  } catch { /* stockage indisponible ou illisible */ }
  return null;
}

function ecrire(t) {
  try {
    if (t) localStorage.setItem(CLE, JSON.stringify(t));
    else localStorage.removeItem(CLE);
  } catch { /* navigation privée : le tournoi reste en mémoire */ }
}

const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const demi = (x) => String(x).replace('.5', '½').replace(/^0½$/, '½');

/* ---------- Calculs ---------- */

// Score, adversaires, couleurs et exempts de chaque joueur, d'après les rondes jouées.
function bilan(t) {
  const b = new Map(t.joueurs.map((j) => [j.id, { ...j, points: 0, adversaires: [], couleurs: [], exempt: 0, v: 0, n: 0, d: 0 }]));
  for (const ronde of t.rondes) {
    for (const m of ronde) {
      const blanc = b.get(m.b);
      if (m.n === null) {
        blanc.points += 1;
        blanc.exempt++;
        continue;
      }
      const noir = b.get(m.n);
      blanc.adversaires.push(m.n);
      noir.adversaires.push(m.b);
      blanc.couleurs.push('w');
      noir.couleurs.push('b');
      if (!m.r) continue;
      const [pb, pn] = POINTS[m.r];
      blanc.points += pb;
      noir.points += pn;
      for (const [j, p] of [[blanc, pb], [noir, pn]]) {
        if (p === 1) j.v++;
        else if (p === 0.5) j.n++;
        else j.d++;
      }
    }
  }
  // Départage Buchholz : somme des points des adversaires rencontrés.
  for (const j of b.values()) j.buchholz = j.adversaires.reduce((s, id) => s + b.get(id).points, 0);
  return b;
}

function classement(t) {
  return [...bilan(t).values()].sort((a, c) => c.points - a.points || c.buchholz - a.buchholz || a.id - c.id);
}

// Appariements au système suisse : les joueurs de même score se rencontrent, sans revanche si possible.
function apparier(t) {
  let joueurs = classement(t).filter((j) => !j.absent);
  const ronde = [];
  if (joueurs.length % 2) {
    // L'exempt (1 point) : le moins bien classé qui ne l'a pas encore été.
    const exempt = [...joueurs].reverse().find((j) => !j.exempt) || joueurs[joueurs.length - 1];
    joueurs = joueurs.filter((j) => j !== exempt);
    ronde.push({ b: exempt.id, n: null, r: '1-0' });
  }
  let essais = 0;
  const chercher = (liste, revanchesOk) => {
    if (!liste.length) return [];
    if (++essais > 20000) return null;
    const [a, ...reste] = liste;
    for (let i = 0; i < reste.length; i++) {
      const c = reste[i];
      if (!revanchesOk && a.adversaires.includes(c.id)) continue;
      const suite = chercher(reste.filter((_, k) => k !== i), revanchesOk);
      if (suite) return [[a, c], ...suite];
    }
    return null;
  };
  let paires = chercher(joueurs, false);
  if (!paires) {
    essais = 0;
    paires = chercher(joueurs, true);
  }
  for (const [a, c] of paires) {
    // Les Blancs à celui qui les a eus le moins souvent, sinon à celui qui avait les Noirs la dernière fois.
    // À égalité parfaite, le mieux classé change de couleur à chaque ronde.
    const solde = (j) => j.couleurs.filter((x) => x === 'w').length - j.couleurs.filter((x) => x === 'b').length;
    const [da, dc] = [a.couleurs.at(-1), c.couleurs.at(-1)];
    let blancA;
    if (solde(a) !== solde(c)) blancA = solde(a) < solde(c);
    else if (da !== dc) blancA = da === 'b' || dc === 'w';
    else blancA = t.rondes.length % 2 === 0;
    ronde.unshift(blancA ? { b: a.id, n: c.id, r: null } : { b: c.id, n: a.id, r: null });
  }
  // Échiquier 1 = meilleurs joueurs ; l'exempt en dernier.
  const rang = new Map(classement(t).map((j, i) => [j.id, i]));
  ronde.sort((x, y) => (x.n === null) - (y.n === null) || Math.min(rang.get(x.b), rang.get(x.n) ?? 1e9) - Math.min(rang.get(y.b), rang.get(y.n) ?? 1e9));
  return ronde;
}

/* ---------- Écran ---------- */

export function showTournoi($app) {
  let t = lire();

  function sauver() {
    ecrire(t);
    rendu();
  }

  function rendu() {
    $app.innerHTML = `
      <section class="page tournoi" id="tournoi">
        <div class="page-head">
          <a href="#/prof" class="btn ghost">← Prof-AS</a>
          <h1>${t ? echapper(t.nom) : 'Mode tournoi'}</h1>
          ${t ? '<button type="button" class="btn ghost pousse-droite" id="btn-grand">⛶ Plein écran</button>' : ''}
        </div>
        ${t ? ecranTournoi() : ecranCreation()}
      </section>`;
    brancher();
  }

  function ecranCreation() {
    return `
      <div class="panel tournoi-creation">
        <label for="t-nom">Nom du tournoi</label>
        <input id="t-nom" class="champ" value="Tournoi de l’AS – ${new Date().toLocaleDateString('fr-FR')}">
        <label for="t-joueurs">Élèves présents (un prénom par ligne)</label>
        <textarea id="t-joueurs" class="pgn" spellcheck="false" placeholder="Alice&#10;Bilal&#10;Chloé&#10;…"></textarea>
        <label for="t-rondes">Nombre de rondes</label>
        <input id="t-rondes" class="champ court" type="number" min="1" max="15" value="5">
        <p class="note">Système suisse : à chaque ronde, les élèves de même score se rencontrent, sans jouer deux fois le même adversaire. Avec un nombre impair, un élève est exempt et reçoit 1 point.</p>
        <p class="note">Les prénoms restent sur cet appareil uniquement. Tu pourras tout effacer à la fin.</p>
        <p class="erreur" id="t-erreur" hidden></p>
        <button type="button" class="btn primary big" id="btn-creer">Créer le tournoi</button>
      </div>`;
  }

  function ecranTournoi() {
    const b = bilan(t);
    const nom = (id) => echapper(b.get(id).nom);
    const ronde = t.rondes.at(-1);
    const rondeFinie = !ronde || ronde.every((m) => m.r);
    const fini = rondeFinie && t.rondes.length >= t.nbRondes;
    const tableau = classement(t);

    const appariements = ronde ? `
      <h2 class="section-titre">Ronde ${t.rondes.length} / ${t.nbRondes}</h2>
      <div class="appariements">
        ${ronde.map((m, i) => (m.n === null ? `
          <div class="appariement exempt"><span class="ech">—</span><span class="j">${nom(m.b)}</span><span class="res-exempt">exempt (1 point)</span></div>` : `
          <div class="appariement">
            <span class="ech">${i + 1}</span>
            <span class="j blanc">${nom(m.b)} <small>(${demi(b.get(m.b).points - (m.r ? POINTS[m.r][0] : 0))})</small></span>
            <span class="resultats" role="group" aria-label="Résultat échiquier ${i + 1}">
              ${['1-0', '1/2', '0-1'].map((r) => `<button type="button" data-match="${i}" data-res="${r}" aria-pressed="${m.r === r}">${r === '1/2' ? '½-½' : r}</button>`).join('')}
            </span>
            <span class="j noir">${nom(m.n)} <small>(${demi(b.get(m.n).points - (m.r ? POINTS[m.r][1] : 0))})</small></span>
          </div>`)).join('')}
      </div>` : '';

    const suite = fini
      ? '<p class="status fin">Tournoi terminé ! Bravo à tous.</p>'
      : `<button type="button" class="btn primary big" id="btn-ronde" ${rondeFinie ? '' : 'disabled'}>${ronde ? 'Ronde suivante' : 'Lancer la ronde 1'}</button>
         ${rondeFinie ? '' : '<span class="note">Saisis tous les résultats pour passer à la ronde suivante.</span>'}`;

    return `
      ${appariements}
      <div class="tournoi-suite">${suite}</div>
      <h2 class="section-titre">${fini ? 'Classement final' : 'Classement'}</h2>
      <div class="table-defile">
        <table class="classement">
          <thead><tr><th>#</th><th>Élève</th><th>Points</th><th title="Départage : somme des points des adversaires">Buchholz</th><th>V</th><th>N</th><th>D</th><th></th></tr></thead>
          <tbody>${tableau.map((j, i) => `
            <tr class="${j.absent ? 'absent' : ''}${fini && i < 3 ? ` podium-${i + 1}` : ''}">
              <td>${fini && i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
              <td>${echapper(j.nom)}${j.absent ? ' <small>(absent)</small>' : ''}</td>
              <td><strong>${demi(j.points)}</strong></td>
              <td>${demi(j.buchholz)}</td>
              <td>${j.v}</td><td>${j.n}</td><td>${j.d}</td>
              <td>${fini ? '' : `<button type="button" class="btn ghost mini-btn" data-absent="${j.id}">${j.absent ? 'Revient' : 'Absent'}</button>`}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="tournoi-outils">
        ${fini ? '' : '<button type="button" class="btn" id="btn-ajouter">＋ Ajouter un élève</button>'}
        <button type="button" class="btn" id="btn-copier">Copier le classement</button>
        <button type="button" class="btn" id="btn-imprimer">Imprimer</button>
        <button type="button" class="btn" id="btn-effacer">Effacer le tournoi</button>
      </div>`;
  }

  function brancher() {
    const sur = (id, f) => $app.querySelector(id)?.addEventListener('click', f);

    sur('#btn-creer', () => {
      const noms = [...new Set($app.querySelector('#t-joueurs').value.split('\n').map((n) => n.trim()).filter(Boolean))];
      const nbRondes = Math.max(1, Math.min(15, Number($app.querySelector('#t-rondes').value) || 1));
      const $erreur = $app.querySelector('#t-erreur');
      if (noms.length < 2) {
        $erreur.textContent = 'Il faut au moins deux élèves.';
        $erreur.hidden = false;
        return;
      }
      t = {
        nom: $app.querySelector('#t-nom').value.trim() || 'Tournoi de l’AS',
        nbRondes,
        joueurs: noms.map((nom, id) => ({ id, nom, absent: false })),
        rondes: [],
      };
      sauver();
    });

    $app.querySelectorAll('[data-res]').forEach((el) => el.addEventListener('click', () => {
      const m = t.rondes.at(-1)[Number(el.dataset.match)];
      m.r = m.r === el.dataset.res ? null : el.dataset.res;
      sauver();
    }));

    sur('#btn-ronde', () => {
      if (t.joueurs.filter((j) => !j.absent).length < 2) {
        modal({ titre: 'Pas assez d’élèves', html: '<p>Il faut au moins deux élèves présents pour lancer une ronde.</p>', actions: [{ label: 'Fermer', primaire: true }] });
        return;
      }
      t.rondes.push(apparier(t));
      sauver();
    });

    $app.querySelectorAll('[data-absent]').forEach((el) => el.addEventListener('click', () => {
      const j = t.joueurs.find((x) => x.id === Number(el.dataset.absent));
      j.absent = !j.absent;
      sauver();
    }));

    sur('#btn-ajouter', async () => {
      const r = await modal({
        titre: 'Ajouter un élève',
        html: '<p>Il commence avec 0 point et sera apparié dès la prochaine ronde.</p><input class="champ" id="t-nouveau" placeholder="Prénom">',
        actions: [{ label: 'Annuler' }, { label: 'Ajouter', primaire: true }],
      });
      const nom = document.getElementById('t-nouveau')?.value.trim();
      if (r !== '1' || !nom) return;
      t.joueurs.push({ id: Math.max(...t.joueurs.map((j) => j.id)) + 1, nom, absent: false });
      sauver();
    });

    sur('#btn-copier', async (e) => {
      const texte = [t.nom, ...classement(t).map((j, i) => `${i + 1}. ${j.nom} – ${demi(j.points)} pt (Buchholz ${demi(j.buchholz)})`)].join('\n');
      try {
        await navigator.clipboard.writeText(texte);
        e.target.textContent = 'Copié ✓';
      } catch {
        modal({ titre: 'Classement', html: `<textarea class="pgn" readonly>${echapper(texte)}</textarea>`, actions: [{ label: 'Fermer' }] });
      }
    });

    sur('#btn-imprimer', () => window.print());

    sur('#btn-effacer', async () => {
      const r = await modal({
        titre: 'Effacer le tournoi ?',
        html: '<p>Les prénoms, les résultats et le classement seront supprimés de cet appareil.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Effacer', primaire: true }],
      });
      if (r !== '1') return;
      t = null;
      sauver();
    });

    sur('#btn-grand', () => {
      const $t = $app.querySelector('#tournoi');
      if (document.fullscreenElement) document.exitFullscreen();
      else $t.requestFullscreen?.().catch(() => {});
    });
  }

  rendu();
  return () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
}
