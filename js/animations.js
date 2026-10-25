// Animations des pièces : la façon dont une pièce se déplace et dont elle prend, débloquées par des hauts faits.
// Chaque animation est une classe CSS (a-<id>) posée sur la case d'arrivée ; tout est en CSS, hors ligne.
// Les décalages sont en % de la taille d'une case (translate en % = taille de la pièce), donc le même code
// sert à l'échiquier et aux petits aperçus de la page « Plateaux ».

/* ---------- Catalogue ---------- */
// palier : rareté (mêmes noms que les hauts faits) · hautFait : id du haut fait qui la débloque
// fx : effets ajoutés à la case d'arrivée · duree : ms avant de tout nettoyer

export const ANIMATIONS = [
  { id: 'glisse', nom: 'Glissé', desc: 'Le mouvement de base, net et rapide', palier: 'bronze', duree: 400 },
  { id: 'saut', nom: 'Saut 8-bit', desc: 'Façon jeu de plateforme rétro : un bond, une pièce d’or', palier: 'bronze', hautFait: 'premiere-partie', fx: ['texte'], texte: '+1', duree: 1200 },
  { id: 'pixel', nom: 'Arcade', desc: 'Pas à pas comme sur les bornes des années 80', palier: 'argent', hautFait: 'course-10', duree: 1000 },
  { id: 'capsule', nom: 'Capsule', desc: 'La pièce prise finit enfermée dans une capsule', palier: 'argent', hautFait: 'mats-10', fx: ['capsule'], duree: 1900 },
  { id: 'turbo', nom: 'Turbo', desc: 'Supersonique, en vrille', palier: 'argent', hautFait: 'victoire-bullet', fx: ['fantomes'], duree: 500 },
  { id: 'blocs', nom: 'Blocs', desc: 'La pièce tombe du ciel et casse tout', palier: 'or', hautFait: 'pb-100', fx: ['eclats'], duree: 1300 },
  { id: 'carte', nom: 'Carte de duel', desc: 'On lève la carte, on la claque sur la table', palier: 'or', hautFait: 'parties-50', fx: ['poussiere'], duree: 1200 },
  { id: 'ko', nom: 'K.O.', desc: 'Jeu de combat : la pièce prise s’envole', palier: 'or', hautFait: 'mat-express', fx: ['texte', 'secousse'], texte: 'K.O.', duree: 1300 },
  { id: 'portail', nom: 'Portail', desc: 'Un portail orange, un portail bleu', palier: 'diamant', hautFait: 'defi-serie-7', fx: ['portails'], duree: 1000 },
  { id: 'glitch', nom: 'Glitch', desc: 'Un bug dans la matrice', palier: 'diamant', hautFait: 'bat-maitre', duree: 1100 },
];

export const animationParId = (id) => ANIMATIONS.find((a) => a.id === id) || ANIMATIONS[0];

let actif = ANIMATIONS[0];
export function utiliserAnimation(id) {
  actif = animationParId(id);
}
export const animationActive = () => actif;

/* ---------- Jouer une animation ---------- */

const span = (classe, html = '') => Object.assign(document.createElement('span'), { className: `anim-fx ${classe}`, innerHTML: html });

// dest / origine : éléments des cases · piece : l'image arrivée sur dest · dx, dy : position de départ par
// rapport à l'arrivée, en cases · victime : src de la pièce prise (ou null) · glisse : false si la pièce a été
// lâchée à la main (on ne refait pas le trajet) · secouer : élément à faire trembler.
export function animer({ anim = actif, dest, origine, piece, dx, dy, victime = null, glisse = true, secouer = null }) {
  const fx = anim.fx || [];
  dest.classList.add('anim-dest', `a-${anim.id}`);
  if (!glisse) dest.classList.add('anim-lache');
  // Sur la case : la pièce, ses fantômes et la pièce prise en héritent.
  dest.style.setProperty('--dx', `${dx * 100}%`);
  dest.style.setProperty('--dy', `${dy * 100}%`);
  piece.classList.add('anim-piece');

  if (glisse && fx.includes('fantomes')) {
    for (const i of [2, 1]) {
      const f = piece.cloneNode();
      f.classList.add('anim-fx', 'fantome', `f${i}`);
      dest.insertBefore(f, piece);
    }
  }
  if (glisse && fx.includes('portails') && origine) {
    origine.classList.add('anim-origine', `a-${anim.id}`);
    origine.appendChild(span('anneau a1'));
  }
  if (victime) {
    dest.classList.add('anim-prise');
    const v = Object.assign(document.createElement('img'), { className: 'piece victime', src: victime, alt: '' });
    v.draggable = false;
    dest.insertBefore(v, piece);
    if (fx.includes('texte')) dest.appendChild(span('texte', anim.texte));
    if (fx.includes('eclats')) for (const [x, y] of [[-70, -60], [65, -70], [-60, 55], [70, 50]]) dest.appendChild(Object.assign(span('eclat'), { style: `--x:${x}%;--y:${y}%` }));
    if (fx.includes('capsule')) dest.appendChild(span('capsule', '<i></i>'));
    if (fx.includes('secousse') && secouer) {
      secouer.classList.remove('anim-secousse');
      void secouer.offsetWidth;
      secouer.classList.add('anim-secousse');
    }
  }
  if (fx.includes('portails') && glisse) dest.appendChild(span('anneau a2'));
  if (fx.includes('poussiere') && glisse) dest.appendChild(span('anneau poussiere'));
}

// Retire tout ce qu'animer() a ajouté (quand l'animation est finie).
export function nettoyer(...cases) {
  for (const c of cases) {
    if (!c) continue;
    c.querySelectorAll('.anim-fx, .victime').forEach((e) => e.remove());
    c.querySelector('.anim-piece')?.classList.remove('anim-piece');
    c.className = c.className.split(' ').filter((k) => !k.startsWith('anim-') && !k.startsWith('a-')).join(' ');
  }
}

/* ---------- Aperçu (page « Plateaux ») ---------- */
// Petit plateau 4×2 : un cavalier blanc prend un pion noir. pieceSrc(color, type) donne l'image selon le skin.

export function apercuAnimation(anim, pieceSrc) {
  const img = (src) => `<img class="piece" src="${src}" alt="" draggable="false">`;
  const depart = { 3: img(pieceSrc('b', 'p')), 4: img(pieceSrc('w', 'n')) };
  const cases = Array.from({ length: 8 }, (_, i) => `<span class="${(Math.floor(i / 4) + i) % 2 ? 'dark' : 'light'}">${depart[i] || ''}</span>`).join('');
  return `<span class="anim-apercu" data-anim="${anim.id}" data-n="${pieceSrc('w', 'n')}" data-p="${pieceSrc('b', 'p')}" aria-hidden="true">${cases}</span>`;
}

export function jouerApercu(el) {
  const anim = animationParId(el.dataset.anim);
  const cases = el.children;
  nettoyer(cases[3], cases[4]);
  cases[4].innerHTML = '';
  cases[3].innerHTML = `<img class="piece" src="${el.dataset.n}" alt="" draggable="false">`;
  void el.offsetWidth;
  animer({ anim, dest: cases[3], origine: cases[4], piece: cases[3].firstChild, dx: -3, dy: 1, victime: el.dataset.p, secouer: el });
  clearTimeout(el._fin);
  el._fin = setTimeout(() => {
    nettoyer(cases[3], cases[4]);
    el.classList.remove('anim-secousse');
  }, anim.duree);
}
