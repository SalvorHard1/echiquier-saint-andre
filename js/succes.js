// Hauts faits : objectifs à débloquer, enregistrés UNIQUEMENT dans le navigateur de l'élève (localStorage).
// Aucune donnée n'est envoyée sur Internet. L'élève peut exporter, importer ou tout effacer.
import { modal } from './modal.js';
import { LECONS, etoilesMax } from './lecons-data.js';
import { COURS, etoilesMaxCours } from './cours-data.js';

const CLE = 'echiquier-saint-andre:hauts-faits';

/* ---------- Icônes (repère 24×24, en blanc) ---------- */

const ICONES = {
  epees: '<g fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M5 4l12 12M19 4L7 16"/><path d="M14 18l4-4M10 18l-4-4"/><path d="M18 18l2 2M6 18l-2 2"/></g>',
  trophee: '<path d="M7 3h10v5a5 5 0 0 1-10 0z"/><rect x="10.8" y="12.5" width="2.4" height="4"/><rect x="7.5" y="16.5" width="9" height="3" rx="1"/><path d="M7 5H4.5a2.5 2.5 0 0 0 2.6 4M17 5h2.5a2.5 2.5 0 0 1-2.6 4" fill="none" stroke-width="1.8"/>',
  flamme: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/>',
  eclair: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  chrono: '<circle cx="12" cy="14" r="7.5" fill="none" stroke-width="2.2"/><path d="M12 14V10M9.5 2.5h5M12 2.5v4" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
  cible: '<circle cx="12" cy="12" r="9" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="1.8"/>',
  couronne: '<polygon points="3,8 7.5,12 12,5 16.5,12 21,8 19,18 5,18"/><rect x="5" y="19" width="14" height="2" rx="1"/>',
  etoile: '<polygon points="12,2.5 14.9,8.6 21.5,9.3 16.5,13.8 17.9,20.4 12,17 6.1,20.4 7.5,13.8 2.5,9.3 9.1,8.6"/>',
  loupe: '<circle cx="10" cy="10" r="6" fill="none" stroke-width="2.4"/><path d="M14.5 14.5L20 20" fill="none" stroke-width="2.8" stroke-linecap="round"/>',
  fleche: '<path d="M4 20L16 8" fill="none" stroke-width="2.6" stroke-linecap="round"/><polygon points="20,4 19,12.5 11.5,5"/>',
  calendrier: '<rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke-width="2" stroke-linecap="round"/><rect x="7" y="13" width="3" height="3"/>',
  ampoule: '<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.1.8 1.7V17h6v-1c0-.6.3-1.2.8-1.7A6.5 6.5 0 0 0 12 2.5z"/><rect x="9" y="18" width="6" height="2" rx=".8"/><rect x="10" y="20.6" width="4" height="1.6" rx=".8"/>',
  bouclier: '<path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/>',
  montagne: '<polygon points="2,20 9,8 13,14 16,10 22,20"/>',
  duo: '<circle cx="8" cy="8" r="3.2"/><circle cx="16" cy="8" r="3.2"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0zM10.5 19a5.5 5.5 0 0 1 11 0z"/>',
};

export const PALIERS = {
  bronze: { nom: 'Bronze', a: '#f6c08f', b: '#a65a24', points: 10 },
  argent: { nom: 'Argent', a: '#f8fafc', b: '#8b98ab', points: 25 },
  or: { nom: 'Or', a: '#fde68a', b: '#d08a06', points: 50 },
  diamant: { nom: 'Diamant', a: '#a5f3fc', b: '#7c3aed', points: 100 },
};

export const RANGS = [
  { nom: 'Pion', piece: 'P', points: 0 },
  { nom: 'Cavalier', piece: 'N', points: 60 },
  { nom: 'Fou', piece: 'B', points: 180 },
  { nom: 'Tour', piece: 'R', points: 400 },
  { nom: 'Dame', piece: 'Q', points: 750 },
  { nom: 'Roi', piece: 'K', points: 1150 },
];

export const CATEGORIES = [
  { id: 'pasapas', nom: 'Pas à pas' },
  { id: 'cours', nom: 'Cours' },
  { id: 'defi', nom: 'Défi du jour' },
  { id: 'parties', nom: 'Parties' },
  { id: 'problemes', nom: 'Problèmes' },
  { id: 'course', nom: 'Course' },
  { id: 'analyse', nom: 'Analyse' },
  { id: 'divers', nom: 'Divers' },
];

/* ---------- Liste des hauts faits ---------- */
// valeur(c) : progression actuelle à partir des compteurs · objectif : valeur à atteindre.

const victoire = (id) => (c) => c.victoires[id] || 0;

const leconsFinies = (c, filtre = () => true) => LECONS.filter((l) => filtre(l) && (c.lecons[l.id] || 0) > 0).length;
const leconsParfaites = (c) => LECONS.filter((l) => (c.lecons[l.id] || 0) >= etoilesMax(l)).length;
const NB_PIECES = LECONS.filter((l) => l.chapitre === 'pieces').length;
const coursFinis = (c, filtre = () => true) => COURS.filter((l) => filtre(l) && (c.cours[l.id] || 0) > 0).length;
const coursParfaits = (c) => COURS.filter((l) => (c.cours[l.id] || 0) >= etoilesMaxCours(l)).length;
const nbCours = (chapitre) => COURS.filter((l) => l.chapitre === chapitre).length;
const defisReussis = (c) => Object.values(c.defis).filter((v) => v === 1).length;

export const HAUTS_FAITS = [
  // Pas à pas
  { id: 'lecon-1', cat: 'pasapas', palier: 'bronze', icone: 'etoile', nom: 'Apprenti', desc: 'Termine ta première leçon « Pas à pas ».', objectif: 1, valeur: (c) => leconsFinies(c) },
  { id: 'lecons-pieces', cat: 'pasapas', palier: 'argent', piece: 'N', nom: 'Je connais les pièces', desc: 'Termine toutes les leçons du chapitre « Les pièces ».', objectif: NB_PIECES, valeur: (c) => leconsFinies(c, (l) => l.chapitre === 'pieces') },
  { id: 'lecons-toutes', cat: 'pasapas', palier: 'or', icone: 'trophee', nom: 'Diplômé', desc: 'Termine toutes les leçons du parcours « Pas à pas ».', objectif: LECONS.length, valeur: (c) => leconsFinies(c) },
  { id: 'lecons-parfait', cat: 'pasapas', palier: 'diamant', icone: 'etoile', nom: 'Sans faute', desc: 'Obtiens toutes les étoiles du parcours « Pas à pas ».', objectif: LECONS.length, valeur: leconsParfaites },

  // Cours
  { id: 'cours-1', cat: 'cours', palier: 'bronze', icone: 'ampoule', nom: 'Élève studieux', desc: 'Termine ton premier cours.', objectif: 1, valeur: (c) => coursFinis(c) },
  { id: 'cours-repertoire', cat: 'cours', palier: 'argent', piece: 'B', nom: 'Théoricien', desc: 'Termine tous les cours du chapitre « Les ouvertures ».', objectif: nbCours('repertoire'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'repertoire') },
  { id: 'cours-tactique', cat: 'cours', palier: 'argent', piece: 'N', nom: 'Œil de lynx', desc: 'Termine tous les cours du chapitre « Les tactiques ».', objectif: nbCours('tactique'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'tactique') },
  { id: 'cours-mats', cat: 'cours', palier: 'argent', icone: 'couronne', nom: 'Bourreau des rois', desc: 'Termine tous les cours du chapitre « Les mats types ».', objectif: nbCours('mats'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'mats') },
  { id: 'cours-finales', cat: 'cours', palier: 'or', piece: 'R', nom: 'Finaliste', desc: 'Termine tous les cours du chapitre « Les finales » (contre Stockfish !).', objectif: nbCours('finales'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'finales') },
  { id: 'cours-tous', cat: 'cours', palier: 'or', icone: 'trophee', nom: 'Premier de la classe', desc: 'Termine tous les cours.', objectif: COURS.length, valeur: (c) => coursFinis(c) },
  { id: 'cours-parfait', cat: 'cours', palier: 'diamant', icone: 'etoile', nom: 'Professeur', desc: 'Obtiens toutes les étoiles de tous les cours.', objectif: COURS.length, valeur: coursParfaits },

  // Défi du jour
  { id: 'defi-1', cat: 'defi', palier: 'bronze', icone: 'calendrier', nom: 'Défi relevé', desc: 'Réussis ton premier défi du jour.', objectif: 1, valeur: (c) => defisReussis(c) },
  { id: 'defi-serie-3', cat: 'defi', palier: 'argent', icone: 'flamme', nom: 'Sur ma lancée', desc: 'Réussis le défi du jour 3 jours de suite.', objectif: 3, valeur: (c) => c.meilleureSerieDefi },
  { id: 'defi-serie-7', cat: 'defi', palier: 'or', icone: 'flamme', nom: 'Semaine parfaite', desc: 'Réussis le défi du jour 7 jours de suite.', objectif: 7, valeur: (c) => c.meilleureSerieDefi },
  { id: 'defi-dimanche', cat: 'defi', palier: 'or', icone: 'montagne', nom: 'Dimanche coriace', desc: 'Réussis le défi du dimanche, le plus dur de la semaine.', objectif: 1, valeur: (c) => c.defisDimanche },
  { id: 'defi-30', cat: 'defi', palier: 'diamant', icone: 'couronne', nom: 'Abonné au défi', desc: 'Réussis 30 défis du jour.', objectif: 30, valeur: (c) => defisReussis(c) },

  // Parties contre les bots
  { id: 'premiere-partie', cat: 'parties', palier: 'bronze', icone: 'epees', nom: 'Premier pas', desc: 'Termine ta première partie contre un bot.', objectif: 1, valeur: (c) => c.partiesBot },
  { id: 'parties-10', cat: 'parties', palier: 'argent', icone: 'epees', nom: 'Habitué', desc: 'Termine 10 parties contre les bots.', objectif: 10, valeur: (c) => c.partiesBot },
  { id: 'parties-50', cat: 'parties', palier: 'or', icone: 'epees', nom: 'Marathonien', desc: 'Termine 50 parties contre les bots.', objectif: 50, valeur: (c) => c.partiesBot },
  { id: 'bat-pion', cat: 'parties', palier: 'bronze', piece: 'P', nom: 'Tombeur de Pion', desc: 'Bats le bot Pion.', objectif: 1, valeur: victoire('pion') },
  { id: 'bat-cavalier', cat: 'parties', palier: 'bronze', piece: 'N', nom: 'Tombeur de Cavalier', desc: 'Bats le bot Cavalier.', objectif: 1, valeur: victoire('cavalier') },
  { id: 'bat-fou', cat: 'parties', palier: 'argent', piece: 'B', nom: 'Tombeur de Fou', desc: 'Bats le bot Fou.', objectif: 1, valeur: victoire('fou') },
  { id: 'bat-tour', cat: 'parties', palier: 'argent', piece: 'R', nom: 'Tombeur de Tour', desc: 'Bats le bot Tour.', objectif: 1, valeur: victoire('tour') },
  { id: 'bat-dame', cat: 'parties', palier: 'or', piece: 'Q', nom: 'Tombeur de Dame', desc: 'Bats le bot Dame.', objectif: 1, valeur: victoire('dame') },
  { id: 'bat-roi', cat: 'parties', palier: 'or', piece: 'K', nom: 'Régicide', desc: 'Bats le bot Roi.', objectif: 1, valeur: victoire('roi') },
  { id: 'bat-maitre', cat: 'parties', palier: 'diamant', icone: 'couronne', nom: 'Maître du club', desc: 'Bats le bot Maître.', objectif: 1, valeur: victoire('maitre') },
  { id: 'bat-stockfish', cat: 'parties', palier: 'diamant', icone: 'trophee', nom: 'Exploit légendaire', desc: 'Bats Stockfish à pleine puissance. Bonne chance…', objectif: 1, valeur: victoire('stockfish') },
  { id: 'victoire-noirs', cat: 'parties', palier: 'bronze', icone: 'bouclier', nom: 'Côté obscur', desc: 'Gagne une partie avec les Noirs.', objectif: 1, valeur: (c) => c.victoiresNoirs },
  { id: 'victoire-bullet', cat: 'parties', palier: 'argent', icone: 'eclair', nom: 'Éclair', desc: 'Gagne une partie en Bullet contre un bot.', objectif: 1, valeur: (c) => c.victoiresCadence.bullet || 0 },
  { id: 'victoire-blitz', cat: 'parties', palier: 'bronze', icone: 'flamme', nom: 'Blitzeur', desc: 'Gagne une partie en Blitz contre un bot.', objectif: 1, valeur: (c) => c.victoiresCadence.blitz || 0 },
  { id: 'victoire-rapide', cat: 'parties', palier: 'bronze', icone: 'chrono', nom: 'Stratège', desc: 'Gagne une partie en Rapide contre un bot.', objectif: 1, valeur: (c) => c.victoiresCadence.rapide || 0 },
  { id: 'mat-express', cat: 'parties', palier: 'argent', icone: 'cible', nom: 'Mat express', desc: 'Gagne contre un bot en moins de 20 coups.', objectif: 1, valeur: (c) => c.matExpress },
  { id: 'remontada', cat: 'parties', palier: 'or', icone: 'montagne', nom: 'Remontada', desc: 'Gagne une partie après avoir eu 5 points de matériel de retard.', objectif: 1, valeur: (c) => c.remontadas },
  { id: 'duel-5', cat: 'parties', palier: 'bronze', icone: 'duo', nom: 'Duelliste', desc: 'Joue 5 parties à deux sur le même écran.', objectif: 5, valeur: (c) => c.partiesDeux },

  // Problèmes
  { id: 'pb-1', cat: 'problemes', palier: 'bronze', icone: 'ampoule', nom: 'Eurêka', desc: 'Réussis ton premier problème.', objectif: 1, valeur: (c) => c.problemes },
  { id: 'pb-25', cat: 'problemes', palier: 'argent', icone: 'ampoule', nom: 'Tacticien', desc: 'Réussis 25 problèmes.', objectif: 25, valeur: (c) => c.problemes },
  { id: 'pb-100', cat: 'problemes', palier: 'or', icone: 'ampoule', nom: 'Maître tacticien', desc: 'Réussis 100 problèmes.', objectif: 100, valeur: (c) => c.problemes },
  { id: 'pb-500', cat: 'problemes', palier: 'diamant', icone: 'etoile', nom: 'Machine à tactiques', desc: 'Réussis 500 problèmes.', objectif: 500, valeur: (c) => c.problemes },
  { id: 'serie-5', cat: 'problemes', palier: 'bronze', icone: 'flamme', nom: 'En feu', desc: 'Fais une série de 5 problèmes réussis.', objectif: 5, valeur: (c) => c.meilleureSerie },
  { id: 'serie-10', cat: 'problemes', palier: 'argent', icone: 'flamme', nom: 'Inarrêtable', desc: 'Fais une série de 10 problèmes réussis.', objectif: 10, valeur: (c) => c.meilleureSerie },
  { id: 'serie-20', cat: 'problemes', palier: 'or', icone: 'flamme', nom: 'Légende vivante', desc: 'Fais une série de 20 problèmes réussis.', objectif: 20, valeur: (c) => c.meilleureSerie },
  { id: 'mats-10', cat: 'problemes', palier: 'argent', icone: 'couronne', nom: 'Chasseur de rois', desc: 'Réussis 10 problèmes de mat.', objectif: 10, valeur: (c) => c.themes.mat || 0 },
  { id: 'fourchettes-10', cat: 'problemes', palier: 'argent', piece: 'N', nom: 'Fourchette d’or', desc: 'Réussis 10 problèmes de fourchette.', objectif: 10, valeur: (c) => c.themes.fourchette || 0 },
  { id: 'clouages-10', cat: 'problemes', palier: 'argent', icone: 'cible', nom: 'Cloueur', desc: 'Réussis 10 problèmes de clouage ou d’enfilade.', objectif: 10, valeur: (c) => c.themes.clouage || 0 },
  { id: 'niveau-dame', cat: 'problemes', palier: 'or', piece: 'Q', nom: 'Expert', desc: 'Réussis 10 problèmes du niveau Dame.', objectif: 10, valeur: (c) => c.problemesNiveau[4] || 0 },
  { id: 'niveau-roi', cat: 'problemes', palier: 'diamant', piece: 'K', nom: 'Grand maître du calcul', desc: 'Réussis 10 problèmes du niveau Roi.', objectif: 10, valeur: (c) => c.problemesNiveau[5] || 0 },

  // Course contre la montre
  { id: 'course-5', cat: 'course', palier: 'bronze', icone: 'chrono', nom: 'Sprinteur', desc: 'Marque 5 points dans la course contre la montre.', objectif: 5, valeur: (c) => c.meilleureCourse },
  { id: 'course-10', cat: 'course', palier: 'argent', icone: 'eclair', nom: 'Fusée', desc: 'Marque 10 points dans la course contre la montre.', objectif: 10, valeur: (c) => c.meilleureCourse },
  { id: 'course-20', cat: 'course', palier: 'or', icone: 'eclair', nom: 'Supersonique', desc: 'Marque 20 points dans la course contre la montre.', objectif: 20, valeur: (c) => c.meilleureCourse },
  { id: 'course-30', cat: 'course', palier: 'diamant', icone: 'etoile', nom: 'Hors catégorie', desc: 'Marque 30 points dans la course contre la montre.', objectif: 30, valeur: (c) => c.meilleureCourse },

  // Analyse
  { id: 'analyse-1', cat: 'analyse', palier: 'bronze', icone: 'loupe', nom: 'Analyste', desc: 'Analyse ta première partie.', objectif: 1, valeur: (c) => c.analyses },
  { id: 'analyse-10', cat: 'analyse', palier: 'argent', icone: 'loupe', nom: 'Détective', desc: 'Analyse 10 parties.', objectif: 10, valeur: (c) => c.analyses },
  { id: 'precision-90', cat: 'analyse', palier: 'or', icone: 'cible', nom: 'Précision chirurgicale', desc: 'Obtiens 90 % de précision sur une de tes parties analysées.', objectif: 90, valeur: (c) => Math.floor(c.meilleurePrecision) },

  // Divers
  { id: 'fleches-10', cat: 'divers', palier: 'bronze', icone: 'fleche', nom: 'Artiste', desc: 'Dessine 10 flèches sur le plateau.', objectif: 10, valeur: (c) => c.fleches },
  { id: 'jours-3', cat: 'divers', palier: 'bronze', icone: 'calendrier', nom: 'Fidèle', desc: 'Viens t’entraîner 3 jours différents.', objectif: 3, valeur: (c) => c.jours.length },
  { id: 'jours-10', cat: 'divers', palier: 'or', icone: 'calendrier', nom: 'Pilier de l’AS', desc: 'Viens t’entraîner 10 jours différents.', objectif: 10, valeur: (c) => c.jours.length },
  { id: 'collection-10', cat: 'divers', palier: 'argent', icone: 'etoile', nom: 'Collectionneur', desc: 'Débloque 10 hauts faits.', objectif: 10, valeur: (c, nb) => nb },
  { id: 'collection-25', cat: 'divers', palier: 'diamant', icone: 'couronne', nom: 'Légende du club', desc: 'Débloque 25 hauts faits.', objectif: 25, valeur: (c, nb) => nb },
];

/* ---------- Sauvegarde locale ---------- */

function compteursVides() {
  return {
    partiesBot: 0, partiesDeux: 0, victoires: {}, victoiresNoirs: 0, victoiresCadence: {},
    matExpress: 0, remontadas: 0,
    problemes: 0, problemesNiveau: {}, themes: {}, meilleureSerie: 0, meilleureCourse: 0,
    analyses: 0, meilleurePrecision: 0, fleches: 0, jours: [], lecons: {}, cours: {},
    defis: {}, meilleureSerieDefi: 0, defisDimanche: 0,
  };
}

function normaliser(d) {
  const c = { ...compteursVides(), ...(d?.c || {}) };
  for (const k of ['victoires', 'victoiresCadence', 'problemesNiveau', 'themes', 'lecons', 'cours', 'defis']) if (typeof c[k] !== 'object' || !c[k]) c[k] = {};
  if (!Array.isArray(c.jours)) c.jours = [];
  const debloques = d?.debloques && typeof d.debloques === 'object' ? d.debloques : {};
  return { v: 1, c, debloques };
}

function lire() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return normaliser(JSON.parse(brut));
  } catch { /* stockage indisponible ou illisible */ }
  return normaliser(null);
}

let etat = lire();

function ecrire() {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch { /* navigation privée ou stockage bloqué : on continue en mémoire */ }
}

/* ---------- Évènements ---------- */

const auj = () => new Date().toLocaleDateString('fr-CA'); // AAAA-MM-JJ, heure locale
const max = (a, b) => Math.max(a || 0, b || 0);

export function signaler(type, d = {}) {
  const c = etat.c;
  switch (type) {
    case 'visite':
      if (!c.jours.includes(auj())) c.jours = [...c.jours, auj()].slice(-400);
      break;
    case 'partie':
      if (d.mode === 'deux') {
        c.partiesDeux++;
        break;
      }
      c.partiesBot++;
      if (d.resultat === 'victoire') {
        c.victoires[d.bot] = (c.victoires[d.bot] || 0) + 1;
        if (d.couleur === 'b') c.victoiresNoirs++;
        if (d.cadence) c.victoiresCadence[d.cadence] = (c.victoiresCadence[d.cadence] || 0) + 1;
        if (d.coups < 20) c.matExpress++;
        if (d.pireRetard <= -5) c.remontadas++;
      }
      break;
    case 'probleme':
      if (d.reussi) {
        c.problemes++;
        if (d.niveau >= 0) c.problemesNiveau[d.niveau] = (c.problemesNiveau[d.niveau] || 0) + 1;
        const t = d.themes || '';
        if (t.includes('mate')) c.themes.mat = (c.themes.mat || 0) + 1;
        if (t.includes('fork')) c.themes.fourchette = (c.themes.fourchette || 0) + 1;
        if (/pin|skewer/.test(t)) c.themes.clouage = (c.themes.clouage || 0) + 1;
      }
      c.meilleureSerie = max(c.meilleureSerie, d.serie);
      break;
    case 'course':
      c.meilleureCourse = max(c.meilleureCourse, d.score);
      break;
    case 'analyse':
      c.analyses++;
      if (typeof d.precision === 'number') c.meilleurePrecision = max(c.meilleurePrecision, d.precision);
      break;
    case 'fleche':
      c.fleches++;
      break;
    case 'lecon':
      // On garde le meilleur score d'étoiles de chaque leçon.
      if (LECONS.some((l) => l.id === d.id)) c.lecons[d.id] = Math.max(c.lecons[d.id] || 0, d.etoiles || 0);
      break;
    case 'cours':
      if (COURS.some((l) => l.id === d.id)) c.cours[d.id] = Math.max(c.cours[d.id] || 0, d.etoiles || 0, 1);
      break;
    case 'defi':
      // Seul le premier essai de la journée compte.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date in c.defis) return;
      c.defis[d.date] = d.reussi ? 1 : 0;
      c.meilleureSerieDefi = max(c.meilleureSerieDefi, serieDefis());
      if (d.reussi && new Date(`${d.date}T12:00`).getDay() === 0) c.defisDimanche++;
      break;
    default:
      return;
  }
  verifier();
  ecrire();
  majCompteur();
}

function verifier() {
  const nouveaux = [];
  // Deux passes : les hauts faits « collection » dépendent du nombre déjà débloqué.
  for (let passe = 0; passe < 2; passe++) {
    for (const h of HAUTS_FAITS) {
      if (etat.debloques[h.id]) continue;
      if (h.valeur(etat.c, Object.keys(etat.debloques).length) >= h.objectif) {
        etat.debloques[h.id] = Date.now();
        nouveaux.push(h);
      }
    }
  }
  // Pas plus de 2 notifications à la fois : au-delà, un résumé.
  nouveaux.slice(0, nouveaux.length > 3 ? 2 : 3).forEach(annoncer);
  if (nouveaux.length > 3) {
    const reste = nouveaux.slice(2);
    const meilleur = reste.reduce((a, b) => (PALIERS[b.palier].points > PALIERS[a.palier].points ? b : a));
    annoncer({ ...meilleur, nom: `+ ${reste.length} autres hauts faits`, desc: reste.map((h) => h.nom).join(', ') });
  }
}

document.addEventListener('fleche-dessinee', () => signaler('fleche'));

/* ---------- Médailles ---------- */

export function medaille(h, debloque = true) {
  const p = PALIERS[h.palier];
  const g = `grad-${h.id}`;
  const centre = h.piece
    ? `<image href="assets/pieces/w${h.piece}.svg" x="21" y="19" width="38" height="38"/>`
    : `<g transform="translate(22 20) scale(1.5)" fill="#fff" stroke="#fff" stroke-width="0">${ICONES[h.icone]}</g>`;
  return `<svg class="medaille ${debloque ? '' : 'verrouille'}" viewBox="0 0 80 90" role="img" aria-label="${h.nom}">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient></defs>
    <path d="M24 58 L15 88 L27 82 L33 90 L40 64 Z" fill="${p.b}" opacity="0.9"/>
    <path d="M56 58 L65 88 L53 82 L47 90 L40 64 Z" fill="${p.b}" opacity="0.9"/>
    <circle cx="40" cy="38" r="34" fill="url(#${g})"/>
    <circle cx="40" cy="38" r="27.5" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    ${centre}
  </svg>`;
}

/* ---------- Notifications ---------- */

let $toasts = null;
function annoncer(h) {
  $toasts ??= Object.assign(document.createElement('div'), { className: 'toasts', ariaLive: 'polite' });
  if (!$toasts.isConnected) document.body.appendChild($toasts);
  const t = document.createElement('a');
  t.className = `toast palier-${h.palier}`;
  t.href = '#/succes';
  t.innerHTML = `${medaille(h)}<span><small>Haut fait débloqué · ${PALIERS[h.palier].nom}</small><strong>${h.nom}</strong><em>${h.desc}</em></span>`;
  $toasts.appendChild(t);
  setTimeout(() => t.classList.add('sortie'), 5000);
  setTimeout(() => t.remove(), 5600);
}

/* ---------- Rang et compteur ---------- */

export function points() {
  return Object.keys(etat.debloques).reduce((s, id) => s + (PALIERS[HAUTS_FAITS.find((h) => h.id === id)?.palier]?.points || 0), 0);
}

export function rangActuel() {
  const pts = points();
  let i = 0;
  while (i + 1 < RANGS.length && pts >= RANGS[i + 1].points) i++;
  return { rang: RANGS[i], suivant: RANGS[i + 1] || null, pts };
}

export function etoilesLecon(id) {
  return etat.c.lecons[id] || 0;
}

export function etoilesCours(id) {
  return etat.c.cours[id] || 0;
}

// Défi du jour : 1 = réussi du premier coup, 0 = raté, undefined = pas joué.
export function resultatDefi(date) {
  return etat.c.defis[date];
}

// Série de défis réussis d'affilée, jusqu'à aujourd'hui (ou hier si celui du jour n'est pas encore joué).
export function serieDefis() {
  const d = new Date();
  if (etat.c.defis[d.toLocaleDateString('fr-CA')] === undefined) d.setDate(d.getDate() - 1);
  let n = 0;
  while (etat.c.defis[d.toLocaleDateString('fr-CA')] === 1) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function majCompteur() {
  document.querySelectorAll('[data-nb-succes]').forEach((el) => (el.textContent = Object.keys(etat.debloques).length));
}

/* ---------- Page des hauts faits ---------- */

let filtre = 'tous';

export function showSucces($app) {
  const nb = Object.keys(etat.debloques).length;
  const { rang, suivant, pts } = rangActuel();
  const pct = suivant ? Math.round(((pts - rang.points) / (suivant.points - rang.points)) * 100) : 100;

  const carte = (h) => {
    const date = etat.debloques[h.id];
    const v = Math.min(h.valeur(etat.c, nb), h.objectif);
    return `
      <div class="hf ${date ? 'ok' : ''} palier-${h.palier}">
        ${medaille(h, !!date)}
        <div class="hf-texte">
          <strong>${h.nom}</strong>
          <small>${h.desc}</small>
          ${date
            ? `<span class="hf-date">${PALIERS[h.palier].nom} · le ${new Date(date).toLocaleDateString('fr-FR')}</span>`
            : h.objectif > 1
              ? `<span class="hf-prog"><span style="width:${(v / h.objectif) * 100}%"></span></span><span class="hf-date">${v} / ${h.objectif}</span>`
              : `<span class="hf-date">🔒 ${PALIERS[h.palier].nom}</span>`}
        </div>
      </div>`;
  };

  const liste = HAUTS_FAITS.filter((h) => filtre === 'tous' || h.cat === filtre)
    .sort((a, b) => (etat.debloques[b.id] ? 1 : 0) - (etat.debloques[a.id] ? 1 : 0));

  $app.innerHTML = `
    <section class="page">
      <div class="page-head">
        <a href="#/" class="btn ghost">← Accueil</a>
        <h1>Hauts faits</h1>
      </div>
      <div class="rang-card">
        <span class="rang-piece"><img src="assets/pieces/w${rang.piece}.svg" alt=""></span>
        <div class="rang-texte">
          <small>Ton rang</small>
          <strong>${rang.nom}</strong>
          <div class="hf-prog grand"><span style="width:${pct}%"></span></div>
          <small>${pts} points${suivant ? ` · prochain rang : <b>${suivant.nom}</b> à ${suivant.points} points` : ' · rang maximum atteint !'}</small>
        </div>
        <div class="rang-nb"><b>${nb}</b><small>/ ${HAUTS_FAITS.length}</small></div>
      </div>
      <div class="chips" role="radiogroup" aria-label="Catégorie">
        ${[{ id: 'tous', nom: 'Tous' }, ...CATEGORIES].map((c) => `<button type="button" role="radio" class="chip" data-cat="${c.id}" aria-checked="${c.id === filtre}">${c.nom}</button>`).join('')}
      </div>
      <div class="hf-grille">${liste.map(carte).join('')}</div>

      <div class="donnees">
        <h2>Ma progression</h2>
        <p>Tes hauts faits sont enregistrés <strong>uniquement dans ce navigateur, sur cet appareil</strong>. Rien n'est envoyé sur Internet.
          Sur un ordinateur partagé (au lycée par exemple), exporte ta progression dans un fichier pour la retrouver ailleurs.</p>
        <div class="import-actions">
          <button type="button" class="btn" id="btn-exporter">Exporter ma progression</button>
          <label class="btn">
            <input type="file" id="fichier-succes" accept=".json,application/json" hidden>
            Importer un fichier
          </label>
          <button type="button" class="btn danger" id="btn-effacer">Tout effacer</button>
        </div>
      </div>
    </section>`;

  $app.querySelectorAll('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      filtre = b.dataset.cat;
      showSucces($app);
    }));

  $app.querySelector('#btn-exporter').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(etat, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hauts-faits-${auj()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $app.querySelector('#fichier-succes').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 200_000) throw new Error();
      const d = JSON.parse(await f.text());
      if (d?.v !== 1 || typeof d.c !== 'object') throw new Error();
      const r = await modal({
        titre: 'Importer cette progression ?',
        html: '<p>Elle remplacera celle qui est enregistrée sur cet appareil.</p>',
        actions: [{ label: 'Annuler' }, { label: 'Importer', primaire: true }],
      });
      if (r !== '1') return;
      // On ne garde que des hauts faits qui existent.
      const n = normaliser(d);
      n.debloques = Object.fromEntries(Object.entries(n.debloques).filter(([id, t]) => HAUTS_FAITS.some((h) => h.id === id) && Number.isFinite(t)));
      etat = n;
      verifier();
      ecrire();
      majCompteur();
      showSucces($app);
    } catch {
      modal({ titre: 'Fichier invalide', html: '<p>Ce fichier n’est pas une sauvegarde de hauts faits.</p>', actions: [{ label: 'OK' }] });
    }
  });

  $app.querySelector('#btn-effacer').addEventListener('click', async () => {
    const r = await modal({
      titre: 'Tout effacer ?',
      html: '<p>Tous tes hauts faits et ta progression seront supprimés de cet appareil. C’est définitif.</p>',
      actions: [{ label: 'Annuler' }, { label: 'Tout effacer', primaire: true }],
    });
    if (r !== '1') return;
    try { localStorage.removeItem(CLE); } catch { /* rien */ }
    etat = normaliser(null);
    majCompteur();
    showSucces($app);
  });

  return () => {};
}
