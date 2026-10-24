// Anti-triche : repère les sorties de la page (autre onglet, autre fenêtre, autre appli) pendant que
// l'élève doit jouer, et un rythme de jeu trop régulier (coups recopiés d'un moteur).
// Tout se passe sur l'appareil : rien n'est envoyé sur Internet.
import { modal } from './modal.js';

// Seuils au-delà desquels une victoire contre un bot n'est pas homologuée (modifiables facilement).
// Contre les bots les plus forts, la moindre sortie suffit.
export const SEUILS = {
  normal: { sorties: 3, absence: 30_000 },
  strict: { sorties: 1, absence: 10_000 },
};
export const BOTS_STRICTS = ['maitre', 'stockfish'];
const ABSENCE_MIN = 1500; // une sortie plus courte (clic dans la barre d'adresse…) est ignorée
const RYTHME = { coups: 15, moyenne: 2000, variation: 0.35 };

// enJeu() : la surveillance est-elle utile ? · monTour() : est-ce à l'élève de jouer ?
// onRetour(sortie) : appelé quand l'élève revient après une sortie comptée pendant son tour.
// onCache() : appelé dès que la page est cachée (autre onglet, appli, onglet fermé) pendant son tour.
export function surveiller({ enJeu, monTour, onRetour, onCache }) {
  let depuis = null;
  let sorties = 0;
  let absence = 0;

  function partir() {
    if (depuis === null && enJeu()) depuis = performance.now();
  }
  function revenir() {
    if (depuis === null) return;
    const duree = performance.now() - depuis;
    depuis = null;
    // Le bot ne joue pas tant que l'élève n'a pas joué : un retour pendant son tour couvre toute l'absence.
    if (duree < ABSENCE_MIN || !enJeu() || !monTour()) return;
    sorties++;
    absence += duree;
    onRetour?.({ sorties, absence, duree });
  }
  const visibilite = () => {
    if (!document.hidden) return revenir();
    if (enJeu() && monTour()) onCache?.();
    partir();
  };
  window.addEventListener('blur', partir);
  window.addEventListener('focus', revenir);
  document.addEventListener('visibilitychange', visibilite);

  return {
    get sorties() { return sorties; },
    get absence() { return absence; },
    get absent() { return depuis !== null; },
    restaurer(s) {
      sorties = s?.sorties || 0;
      absence = s?.absence || 0;
      depuis = null;
    },
    // Une sortie détectée autrement (rechargement de la page pendant le tour de l'élève).
    ajouter(duree = ABSENCE_MIN) {
      sorties++;
      absence += duree;
    },
    detruire() {
      window.removeEventListener('blur', partir);
      window.removeEventListener('focus', revenir);
      document.removeEventListener('visibilitychange', visibilite);
    },
  };
}

// Coefficient de variation des temps de réflexion : un humain varie beaucoup (reprises immédiates,
// longues réflexions), quelqu'un qui recopie un moteur met presque toujours le même temps.
export function variation(temps) {
  if (!temps.length) return null;
  const moy = temps.reduce((a, b) => a + b, 0) / temps.length;
  const ecart = Math.sqrt(temps.reduce((a, t) => a + (t - moy) ** 2, 0) / temps.length);
  return { moyenne: moy, cv: moy ? ecart / moy : 0 };
}

// Renvoie la raison pour laquelle la victoire n'est pas homologuée, ou null.
export function verdict({ bot, sorties, absence, tempsCoups = [] }) {
  const s = BOTS_STRICTS.includes(bot) ? SEUILS.strict : SEUILS.normal;
  if (sorties >= s.sorties) return `tu as quitté la partie ${sorties} fois pendant ton tour`;
  if (absence >= s.absence) return `tu as quitté la partie ${Math.round(absence / 1000)} s pendant ton tour`;
  const v = variation(tempsCoups);
  if (tempsCoups.length >= RYTHME.coups && v.moyenne >= RYTHME.moyenne && v.cv < RYTHME.variation) {
    return 'ton temps de réflexion était presque identique à chaque coup, comme quand on recopie un moteur';
  }
  return null;
}

// Fenêtre d'alerte affichée quand une triche est détectée.
export function alerteTriche({ titre = 'Alerte anti-triche', texte, consequence }) {
  return modal({
    titre: `<span class="alerte-titre">⚠ ${titre}</span>`,
    html: `<div class="alerte-triche">
        <p>${texte}</p>
        ${consequence ? `<p class="alerte-consequence">${consequence}</p>` : ''}
        <p><small>Cette alerte est notée dans ton journal de contrôle (page Hauts faits). Ton prof peut le consulter.</small></p>
      </div>`,
    actions: [{ label: 'J’ai compris', primaire: true }],
  });
}

// Petit bandeau d'avertissement, sans bloquer le jeu.
export function bandeau($el, texte) {
  $el.innerHTML = texte ? `<span aria-hidden="true">⚠</span> ${texte}` : '';
  $el.hidden = !texte;
}
