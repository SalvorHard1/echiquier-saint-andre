// Page « Plateaux » : choisir son skin d'échiquier et son animation de pièces parmi ceux débloqués,
// voir comment gagner les autres.
import { SKINS, FAMILLES, skinParId, apercu, pieceSkin, piecePlateau, lirePref, ecrirePref, utiliser } from './skins.js';
import { ANIMATIONS, animationParId, utiliserAnimation, apercuAnimation, jouerApercu } from './animations.js';
import { RANGS, PALIERS, rangActuel, estDebloque, progressionHautFait, afficherToast, insigneRang } from './succes.js';

export function skinDebloque(s) {
  if (s.rang) return RANGS.indexOf(rangActuel().rang) >= RANGS.findIndex((r) => r.nom === s.rang);
  return estDebloque(s.hautFait);
}

const animationDebloquee = (a) => !a.hautFait || estDebloque(a.hautFait);

const famillesDebloquees = () => [...new Set(SKINS.filter(skinDebloque).map((s) => s.pieces))];

// Remet un choix valide (après « Tout effacer » par exemple), applique le skin et annonce les nouveaux.
function synchroniser(annoncer) {
  const pref = lirePref();
  const debloques = SKINS.filter(skinDebloque).map((s) => s.id);
  if (!debloques.includes(pref.plateau)) pref.plateau = 'classique';
  if (pref.pieces && !famillesDebloquees().includes(pref.pieces)) pref.pieces = null;
  // Premier passage : rien à annoncer, on note simplement ce qui est déjà gagné.
  const vus = Array.isArray(pref.vus) ? pref.vus : debloques;
  if (annoncer) {
    for (const id of debloques.filter((x) => !vus.includes(x))) {
      const s = skinParId(id);
      afficherToast({ classe: 'toast-skin', visuel: apercu(s), titre: 'Nouveau plateau débloqué', nom: s.nom, texte: 'Choisis-le dans « Mes plateaux ».', href: '#/plateaux' });
    }
  }
  pref.vus = debloques;

  const anims = ANIMATIONS.filter(animationDebloquee).map((a) => a.id);
  if (!anims.includes(pref.anim)) pref.anim = 'glisse';
  const animsVues = Array.isArray(pref.animVus) ? pref.animVus : anims;
  if (annoncer) {
    for (const id of anims.filter((x) => !animsVues.includes(x))) {
      afficherToast({ classe: 'toast-skin', visuel: apercuAnimation(animationParId(id), piecePlateau), titre: 'Nouvelle animation débloquée', nom: animationParId(id).nom, texte: 'Choisis-la dans « Mes plateaux ».', href: '#/plateaux' });
    }
  }
  pref.animVus = anims;

  ecrirePref(pref);
  utiliser(pref.plateau, pref.pieces);
  utiliserAnimation(pref.anim);
}

synchroniser(false);
document.addEventListener('hauts-faits-maj', () => synchroniser(true));

function condition(s) {
  if (s.rang && !s.hautFait) {
    const r = RANGS.find((x) => x.nom === s.rang);
    return { texte: `Rang ${r.nom} · ${r.points} points`, pct: Math.min(100, (rangActuel().pts / r.points) * 100) };
  }
  const p = progressionHautFait(s.hautFait);
  return { texte: `${s.rang ? `Rang ${s.rang} · ` : ''}${p.nom}${p.objectif > 1 ? ` · ${p.v} / ${p.objectif}` : ''}`, pct: (p.v / p.objectif) * 100 };
}

export function showPlateaux($app) {
  const pref = lirePref();

  const carte = (s) => {
    const ok = skinDebloque(s);
    const choisi = ok && pref.plateau === s.id;
    const c = ok ? null : condition(s);
    return `
      <button type="button" class="skin-carte ${choisi ? 'choisi' : ''}" data-skin="${s.id}" ${ok ? '' : 'aria-disabled="true"'} aria-pressed="${choisi}">
        ${apercu(s)}
        ${s.rang ? `<span class="skin-rang">${insigneRang(RANGS.find((r) => r.nom === s.rang))}Rang ${s.rang}</span>` : ''}
        <strong>${s.nom}</strong>
        <small>${s.desc} · pièces ${FAMILLES[s.pieces].nom.toLowerCase()}</small>
        ${choisi ? '<span class="skin-etat ok">✓ Utilisé</span>'
          : ok ? '<span class="skin-etat">Choisir</span>'
            : `<span class="hf-prog"><span style="width:${c.pct}%"></span></span><span class="skin-etat">🔒 ${c.texte}</span>`}
      </button>`;
  };

  const carteAnim = (a) => {
    const ok = animationDebloquee(a);
    const choisi = ok && pref.anim === a.id;
    const p = ok ? null : progressionHautFait(a.hautFait);
    return `
      <button type="button" class="skin-carte ${choisi ? 'choisi' : ''}" data-anim-choix="${a.id}" ${ok ? '' : 'aria-disabled="true"'} aria-pressed="${choisi}">
        ${apercuAnimation(a, piecePlateau)}
        <span class="anim-rarete">${PALIERS[a.palier].nom}</span>
        <strong>${a.nom}</strong>
        <small>${a.desc}</small>
        ${choisi ? '<span class="skin-etat ok">✓ Utilisée</span>'
          : ok ? '<span class="skin-etat">Choisir</span>'
            : `<span class="hf-prog"><span style="width:${(p.v / p.objectif) * 100}%"></span></span><span class="skin-etat">🔒 ${p.nom}${p.objectif > 1 ? ` · ${p.v} / ${p.objectif}` : ''}</span>`}
      </button>`;
  };

  const familles = famillesDebloquees();
  const plateau = skinParId(pref.plateau);

  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/succes" class="btn ghost">← Hauts faits</a>
        <h1>Plateaux</h1>
      </div>
      <p class="page-intro">Monte en rang et réussis des hauts faits difficiles pour gagner de nouveaux plateaux, avec leurs propres pièces.</p>

      <h2 class="skin-titre">Plateaux de rang</h2>
      <div class="skin-grille">${SKINS.filter((s) => s.rang).map(carte).join('')}</div>

      <h2 class="skin-titre">Plateaux de spécialité</h2>
      <div class="skin-grille">${SKINS.filter((s) => !s.rang).map(carte).join('')}</div>

      <h2 class="skin-titre">Pièces</h2>
      ${familles.length < 2
        ? '<p class="page-intro">Chaque plateau arrive avec ses propres pièces. Dès que tu auras gagné un deuxième plateau, tu pourras choisir ici quelles pièces poser sur ton plateau, par exemple les pièces d’un plateau sur les cases d’un autre.</p>'
        : `<p class="page-intro">Par défaut, chaque plateau utilise ses propres pièces. Tu peux aussi y poser les pièces d’un autre plateau déjà gagné.</p>
      <div class="chips" role="radiogroup" aria-label="Pièces">
        <button type="button" role="radio" class="chip" data-pieces="" aria-checked="${!pref.pieces || pref.pieces === plateau.pieces}">Pièces du plateau</button>
        ${Object.entries(FAMILLES).filter(([id]) => familles.includes(id) && id !== plateau.pieces).map(([id, f]) =>
          `<button type="button" role="radio" class="chip chip-piece" data-pieces="${id}" aria-checked="${pref.pieces === id}"><img src="${pieceSkin(plateau, id, 'w', 'n')}" alt="">${f.nom}</button>`).join('')}
      </div>`}
      <p class="page-intro">${Object.keys(FAMILLES).length - familles.length} styles de pièces à découvrir en gagnant d’autres plateaux.</p>

      <h2 class="skin-titre">Animations des pièces</h2>
      <p class="page-intro">La façon dont tes pièces se déplacent et prennent, sur n’importe quel plateau. Passe sur une carte pour la voir.</p>
      <div class="skin-grille">${ANIMATIONS.map(carteAnim).join('')}</div>
    </section>`;

  $app.querySelectorAll('[data-anim-choix]').forEach((b) => {
    const jouer = () => jouerApercu(b.querySelector('.anim-apercu'));
    b.addEventListener('mouseenter', jouer);
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return jouer();
      ecrirePref({ ...lirePref(), anim: b.dataset.animChoix });
      synchroniser(false);
      showPlateaux($app);
      jouerApercu($app.querySelector(`[data-anim-choix="${b.dataset.animChoix}"] .anim-apercu`));
    });
  });

  $app.querySelectorAll('[data-skin]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      ecrirePref({ ...lirePref(), plateau: b.dataset.skin });
      synchroniser(false);
      showPlateaux($app);
    }));

  $app.querySelectorAll('[data-pieces]').forEach((b) =>
    b.addEventListener('click', () => {
      ecrirePref({ ...lirePref(), pieces: b.dataset.pieces || null });
      synchroniser(false);
      showPlateaux($app);
    }));

  return () => {};
}
