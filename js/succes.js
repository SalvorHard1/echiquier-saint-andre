// Hauts faits : objectifs à débloquer, enregistrés UNIQUEMENT dans le navigateur de l'élève (localStorage).
// Aucune donnée n'est envoyée sur Internet. L'élève peut exporter, importer ou tout effacer.
// Anti-triche : la sauvegarde est signée, un journal de contrôle garde les alertes et les parties à vérifier.
import { modal } from './modal.js';
import { LECONS, etoilesMax } from './lecons-data.js';
import { COURS, etoilesMaxCours } from './cours-data.js';
import { SILHOUETTES, apercu, skinDuHautFait, skinDuRang } from './skins.js';
import { BOTS } from './bots.js';
import { alerteTriche } from './vigilance.js';

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

// Les identifiants (bronze, argent…) restent ceux des sauvegardes ; seuls les noms affichés ont changé.
export const PALIERS = {
  bronze: { nom: 'Commun', a: '#f6c08f', b: '#a65a24', points: 10 },
  argent: { nom: 'Rare', a: '#f8fafc', b: '#8b98ab', points: 25 },
  or: { nom: 'Épique', a: '#fde68a', b: '#d08a06', points: 50 },
  diamant: { nom: 'Mythique', a: '#a5f3fc', b: '#7c3aed', points: 100 },
};

// Rangs gagnés avec les points des hauts faits (2260 points au total).
// Challenger ne s'obtient pas avec des points : il faut battre Stockfish à pleine puissance.
// forme : silhouette de l'insigne (écusson, écusson ailé, gemme…) · piece : pièce au centre.
export const RANGS = [
  { nom: 'Fer', points: 0, a: '#b8bec7', b: '#3f4650', forme: 'ecusson', piece: 'p' },
  { nom: 'Bronze', points: 50, a: '#f6c08f', b: '#a65a24', forme: 'ecusson', piece: 'n' },
  { nom: 'Argent', points: 150, a: '#ffffff', b: '#94a3b8', forme: 'ecusson', piece: 'b' },
  { nom: 'Or', points: 300, a: '#fde68a', b: '#d08a06', forme: 'ecusson-aile', piece: 'r' },
  { nom: 'Platine', points: 500, a: '#e0f2fe', b: '#4f7196', forme: 'ecusson-aile', piece: 'r' },
  { nom: 'Émeraude', points: 800, a: '#a7f3d0', b: '#047857', forme: 'emeraude', piece: 'q' },
  { nom: 'Diamant', points: 1150, a: '#a5f3fc', b: '#7c3aed', forme: 'brillant', piece: 'q' },
  { nom: 'Master', points: 1550, a: '#fda4af', b: '#9f1239', forme: 'emeraude-couronne', piece: 'k' },
  { nom: 'Grand Master', points: 2000, a: '#b4313f', b: '#4a0f18', forme: 'brillant-couronne', piece: 'k' },
  { nom: 'Challenger', hautFait: 'bat-stockfish', a: '#4a4552', b: '#060508', forme: 'eclat', piece: 'k' },
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
// contenu : l'objectif dépend du nombre de leçons, cours ou hauts faits. Un haut fait déjà gagné n'est pas
// retiré quand on ajoute du contenu (le contrôle de cohérence demande alors seulement une progression).

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
  { id: 'lecons-pieces', contenu: true, cat: 'pasapas', palier: 'argent', piece: 'N', nom: 'Je connais les pièces', desc: 'Termine toutes les leçons du chapitre « Les pièces ».', objectif: NB_PIECES, valeur: (c) => leconsFinies(c, (l) => l.chapitre === 'pieces') },
  { id: 'lecons-toutes', contenu: true, cat: 'pasapas', palier: 'or', icone: 'trophee', nom: 'Diplômé', desc: 'Termine toutes les leçons du parcours « Pas à pas ».', objectif: LECONS.length, valeur: (c) => leconsFinies(c) },
  { id: 'lecons-parfait', contenu: true, cat: 'pasapas', palier: 'diamant', icone: 'etoile', nom: 'Sans faute', desc: 'Obtiens toutes les étoiles du parcours « Pas à pas ».', objectif: LECONS.length, valeur: leconsParfaites },

  // Cours
  { id: 'cours-1', cat: 'cours', palier: 'bronze', icone: 'ampoule', nom: 'Élève studieux', desc: 'Termine ton premier cours.', objectif: 1, valeur: (c) => coursFinis(c) },
  { id: 'cours-repertoire', contenu: true, cat: 'cours', palier: 'argent', piece: 'B', nom: 'Théoricien', desc: 'Termine tous les cours du chapitre « Les ouvertures ».', objectif: nbCours('repertoire'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'repertoire') },
  { id: 'cours-tactique', contenu: true, cat: 'cours', palier: 'argent', piece: 'N', nom: 'Œil de lynx', desc: 'Termine tous les cours du chapitre « Les tactiques ».', objectif: nbCours('tactique'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'tactique') },
  { id: 'cours-mats', contenu: true, cat: 'cours', palier: 'argent', icone: 'couronne', nom: 'Bourreau des rois', desc: 'Termine tous les cours du chapitre « Les mats types ».', objectif: nbCours('mats'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'mats') },
  { id: 'cours-finales', contenu: true, cat: 'cours', palier: 'or', piece: 'R', nom: 'Finaliste', desc: 'Termine tous les cours du chapitre « Les finales » (contre Stockfish !).', objectif: nbCours('finales'), valeur: (c) => coursFinis(c, (l) => l.chapitre === 'finales') },
  { id: 'cours-tous', contenu: true, cat: 'cours', palier: 'or', icone: 'trophee', nom: 'Premier de la classe', desc: 'Termine tous les cours.', objectif: COURS.length, valeur: (c) => coursFinis(c) },
  { id: 'cours-parfait', contenu: true, cat: 'cours', palier: 'diamant', icone: 'etoile', nom: 'Professeur', desc: 'Obtiens toutes les étoiles de tous les cours.', objectif: COURS.length, valeur: coursParfaits },

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
  { id: 'collection-10', contenu: true, cat: 'divers', palier: 'argent', icone: 'etoile', nom: 'Collectionneur', desc: 'Débloque 10 hauts faits.', objectif: 10, valeur: (c, nb) => nb },
  { id: 'collection-25', contenu: true, cat: 'divers', palier: 'diamant', icone: 'couronne', nom: 'Légende du club', desc: 'Débloque 25 hauts faits.', objectif: 25, valeur: (c, nb) => nb },
];

/* ---------- Sauvegarde locale, signée ---------- */
// La sauvegarde (et le fichier exporté) porte une empreinte calculée avec une clé de l'application :
// une progression retouchée à la main (outils du navigateur, fichier modifié) est refusée.
// Ce n'est pas une vraie sécurité (la clé est dans le code), mais ça arrête les retouches faciles.
// NE JAMAIS CHANGER CLE_SIGNATURE : toutes les sauvegardes des élèves deviendraient invalides.
const CLE_SIGNATURE = 'saint-andre|hauts-faits|v2';
const CLE_SIGNEE = `${CLE}:signee`; // présent dès qu'une sauvegarde signée a été écrite sur l'appareil
const CLE_SECOURS = `${CLE}:secours`; // copie signée de la dernière sauvegarde valide
const TOLERANCE = 10 * 60 * 1000; // décalage d'horloge toléré (ms)
const MAX_JOURNAL = 60;
const MAX_PREUVES = 30;

// Empreinte rapide sur 64 bits (deux hachages 32 bits mêlés), synchrone pour lire la sauvegarde au démarrage.
function empreinte(texte) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texte.length; i++) {
    const ch = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

const signer = (d) => empreinte(`${CLE_SIGNATURE}|${JSON.stringify([d.v, d.c, d.debloques, d.garde])}|${CLE_SIGNATURE}`);
const signee = (d) => d?.v === 2 && typeof d.sig === 'string' && d.sig === signer(d);

function compteursVides() {
  return {
    partiesBot: 0, partiesDeux: 0, victoires: {}, victoiresNoirs: 0, victoiresCadence: {},
    matExpress: 0, remontadas: 0, victoiresNonHomologuees: 0,
    problemes: 0, problemesNiveau: {}, themes: {}, meilleureSerie: 0, meilleureCourse: 0,
    analyses: 0, meilleurePrecision: 0, fleches: 0, jours: [], lecons: {}, cours: {},
    defis: {}, meilleureSerieDefi: 0, defisDimanche: 0,
  };
}

// garde : contrôle anti-triche. vu = dernière heure vue sur l'appareil · journal = alertes ·
// preuves = parties gagnées à vérifier par le prof (PGN) · export = date du dernier export (rappel Safari).
function normaliser(d) {
  const c = { ...compteursVides(), ...(d?.c || {}) };
  for (const k of ['victoires', 'victoiresCadence', 'problemesNiveau', 'themes', 'lecons', 'cours', 'defis']) if (typeof c[k] !== 'object' || !c[k] || Array.isArray(c[k])) c[k] = {};
  if (!Array.isArray(c.jours)) c.jours = [];
  const debloques = d?.debloques && typeof d.debloques === 'object' ? { ...d.debloques } : {};
  const g = d?.garde && typeof d.garde === 'object' ? d.garde : {};
  const liste = (l, ok, n) => (Array.isArray(l) ? l.filter((x) => x && Number.isFinite(x.t) && ok(x)).slice(-n) : []);
  const garde = {
    vu: Number.isFinite(g.vu) ? g.vu : 0,
    export: Number.isFinite(g.export) ? g.export : 0,
    journal: liste(g.journal, (x) => typeof x.texte === 'string', MAX_JOURNAL),
    preuves: liste(g.preuves, (x) => typeof x.pgn === 'string' && x.pgn.length < 20_000, MAX_PREUVES),
  };
  return { v: 2, c, debloques, garde };
}

let alerteDemarrage = null; // alerte à montrer une fois la page affichée

function lireCle(cle) {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null; // stockage indisponible ou illisible
  }
}

// Une sauvegarde invalide ne fait jamais tout perdre : on revient à la copie de secours (CLE_SECOURS),
// la dernière sauvegarde valide.
function lire() {
  const d = lireCle(CLE);
  if (signee(d)) return normaliser(d);
  let dejaSignee = true;
  try { dejaSignee = !!localStorage.getItem(CLE_SIGNEE); } catch { /* stockage indisponible */ }
  const ancienFormat = d?.v === 1 && !d.sig;
  // Sauvegarde d'avant la signature : adoptée une seule fois, puis signée.
  if (ancienFormat && !dejaSignee) return normaliser(d);
  const secours = lireCle(CLE_SECOURS);
  if (!d && !signee(secours)) return normaliser(null); // rien d'enregistré
  const e = signee(secours) ? normaliser(secours) : normaliser(null);
  // Ancien format écrit après la mise à jour : un onglet resté ouvert sur l'ancienne version. Pas une triche.
  // (La copie de secours est écrite avant CLE_SIGNEE : ancien format sans copie valide = retouche.)
  if (ancienFormat && signee(secours)) {
    noter(e, 'version', 'Sauvegarde écrite par un onglet resté sur l’ancienne version : retour à la dernière sauvegarde valide.');
    return e;
  }
  if (!d) return e; // sauvegarde illisible ou supprimée : la copie de secours prend le relais
  const retour = signee(secours);
  noter(e, 'sauvegarde', `Sauvegarde modifiée en dehors de l’application : ${retour ? 'retour à la dernière sauvegarde valide' : 'progression remise à zéro'}.`);
  alerteDemarrage = {
    texte: 'Ta progression a été modifiée en dehors de l’application (outils du navigateur ou fichier retouché).',
    consequence: retour ? 'Les modifications sont annulées : ta progression revient à la dernière sauvegarde valide.' : 'Elle n’est plus valable et repart de zéro.',
  };
  return e;
}

function noter(e, type, texte) {
  e.garde.journal = [...e.garde.journal, { t: Date.now(), type, texte }].slice(-MAX_JOURNAL);
}

/* ---------- Contrôle de cohérence ---------- */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const entier = (x) => (Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
const somme = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const lendemain = (j) => {
  const d = new Date(`${j}T12:00`);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('fr-CA');
};
const COMPTEURS = ['partiesBot', 'partiesDeux', 'victoiresNoirs', 'matExpress', 'remontadas', 'victoiresNonHomologuees',
  'problemes', 'meilleureSerie', 'meilleureCourse', 'analyses', 'fleches'];

// Plus longue série de défis réussis d'affilée.
function plusLongueSerie(defis) {
  let meilleure = 0;
  let n = 0;
  let prec = null;
  for (const j of Object.keys(defis).filter((k) => defis[k] === 1).sort()) {
    n = prec && lendemain(prec) === j ? n + 1 : 1;
    meilleure = Math.max(meilleure, n);
    prec = j;
  }
  return meilleure;
}

// Remet la progression d'aplomb : dates « du futur » retirées (horloge avancée), compteurs cohérents
// entre eux, hauts faits gardés seulement s'ils sont justifiés. Renvoie le nombre de hauts faits retirés.
function assainir(e) {
  const c = e.c;
  const jour = auj();
  const borne = (o, cles, plafond) => Object.fromEntries(cles.map((k) => [k, Math.min(entier(o[k]), plafond)]).filter(([, v]) => v));
  for (const k of COMPTEURS) c[k] = entier(c[k]);

  c.victoires = borne(c.victoires, BOTS.map((b) => b.id), Infinity);
  const nbVictoires = somme(c.victoires);
  c.partiesBot = Math.max(c.partiesBot, nbVictoires);
  for (const k of ['victoiresNoirs', 'matExpress', 'remontadas']) c[k] = Math.min(c[k], nbVictoires);
  c.victoiresCadence = borne(c.victoiresCadence, ['bullet', 'blitz', 'rapide'], nbVictoires);

  c.problemesNiveau = borne(c.problemesNiveau, ['0', '1', '2', '3', '4', '5'], c.problemes);
  c.themes = borne(c.themes, ['mat', 'fourchette', 'clouage'], c.problemes);
  c.meilleureSerie = Math.min(c.meilleureSerie, c.problemes);
  c.meilleureCourse = Math.min(c.meilleureCourse, c.problemes); // chaque point de course est un problème réussi
  c.meilleurePrecision = c.analyses ? Math.min(100, Math.max(0, Number(c.meilleurePrecision) || 0)) : 0;

  c.lecons = Object.fromEntries(LECONS.filter((l) => entier(c.lecons[l.id])).map((l) => [l.id, Math.min(entier(c.lecons[l.id]), Math.max(1, etoilesMax(l)))]));
  c.cours = Object.fromEntries(COURS.filter((l) => entier(c.cours[l.id])).map((l) => [l.id, Math.min(entier(c.cours[l.id]), Math.max(1, etoilesMaxCours(l)))]));

  c.jours = [...new Set(c.jours.filter((j) => DATE.test(j) && j <= jour))].sort().slice(-400);
  c.defis = Object.fromEntries(Object.entries(c.defis).filter(([j, v]) => DATE.test(j) && j <= jour && (v === 0 || v === 1)));
  c.meilleureSerieDefi = plusLongueSerie(c.defis);
  c.defisDimanche = Object.keys(c.defis).filter((j) => c.defis[j] === 1 && new Date(`${j}T12:00`).getDay() === 0).length;

  const avant = Object.keys(e.debloques).length;
  const limite = Date.now() + TOLERANCE;
  let d = Object.fromEntries(Object.entries(e.debloques).filter(([id, t]) => Number.isFinite(t) && t <= limite && HAUTS_FAITS.some((h) => h.id === id)));
  const nb = Object.keys(d).length;
  d = Object.fromEntries(Object.entries(d).filter(([id]) => {
    const h = HAUTS_FAITS.find((x) => x.id === id);
    return h.valeur(c, nb) >= (h.contenu ? 1 : h.objectif);
  }));
  e.debloques = d;
  e.garde.preuves = e.garde.preuves.filter((p) => p.t <= limite);
  return avant - Object.keys(d).length;
}

// L'horloge de l'appareil a-t-elle été remise en arrière (après l'avoir avancée pour jouer les défis
// des jours suivants, par exemple) ?
function controlerHorloge(e) {
  const maintenant = Date.now();
  const recul = e.garde.vu - maintenant > TOLERANCE;
  e.garde.vu = recul ? maintenant : Math.max(e.garde.vu, maintenant);
  return recul;
}

// Contrôle complet : horloge puis cohérence, avec une note dans le journal. Renvoie l'alerte à afficher.
function controler(e) {
  const recul = controlerHorloge(e);
  const retires = assainir(e);
  const hf = retires ? `, ${retires} haut${retires > 1 ? 's' : ''} fait${retires > 1 ? 's' : ''} retiré${retires > 1 ? 's' : ''}` : '';
  if (recul) {
    noter(e, 'horloge', `Horloge de l’appareil remise en arrière : défis et jours « du futur » retirés${hf}.`);
    return {
      texte: 'L’heure de ton appareil a été remise en arrière. Changer la date pour jouer les défis à l’avance ne marche pas.',
      consequence: `Les défis et les jours de visite datés dans le futur ont été retirés${hf}.`,
    };
  }
  if (retires) noter(e, 'incoherence', `Progression incohérente${hf}.`);
  return null;
}

let etat = lire();
alerteDemarrage = controler(etat) || alerteDemarrage;
ecrire();
// Après l'affichage de la première page (le routeur ferme les fenêtres ouvertes au démarrage).
if (alerteDemarrage) setTimeout(() => alerteTriche(alerteDemarrage), 500);

function ecrire() {
  try {
    const texte = JSON.stringify({ ...etat, sig: signer(etat) });
    localStorage.setItem(CLE, texte);
    localStorage.setItem(CLE_SECOURS, texte);
    localStorage.setItem(CLE_SIGNEE, '1');
  } catch { /* navigation privée ou stockage bloqué : on continue en mémoire */ }
}

/* ---------- Effacement par Safari ---------- */
// Safari (iPhone, iPad, Mac) efface tout ce qu'un site a enregistré après 7 jours sans visite.
// Une application ajoutée à l'écran d'accueil y échappe. On demande en plus au navigateur de garder la
// sauvegarde (stockage « persistant »), et sinon on rappelle à l'élève d'installer ou d'exporter.

const JOURS_RAPPEL = 7;
let persistant = false;
navigator.storage?.persisted?.()
  .then((ok) => ok || navigator.storage.persist?.())
  .then((ok) => { persistant = !!ok; })
  .catch(() => {});

const installee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function navigateurSafari() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return true; // iPhone, iPad
  return /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Firefox/.test(ua); // Safari sur Mac
}

// Encart de rappel (accueil et page Hauts faits), vide quand la sauvegarde ne risque rien.
export function avisSauvegarde() {
  if (!navigateurSafari() || installee() || persistant || !Object.keys(etat.debloques).length) return '';
  if (Date.now() - etat.garde.export < JOURS_RAPPEL * 86400000) return '';
  return `
    <div class="avis-sauvegarde" role="note">
      <p><strong>⚠ Sur iPhone, iPad et Safari, ta progression peut disparaître</strong>
        <small>Safari efface ce que le site enregistre après 7 jours sans visite. Installe l’application sur l’écran d’accueil :
          elle y est protégée. Attention, l’application installée a sa propre mémoire : exporte d’abord ta progression ici,
          puis importe le fichier dans l’application (page Hauts faits).</small></p>
      <div class="avis-actions">
        <button type="button" class="btn primary" data-avis-installer>📲 Installer</button>
        <button type="button" class="btn" data-avis-exporter>Exporter ma progression</button>
      </div>
    </div>`;
}

// Le fichier contient toute la progression, signée, avec le journal de contrôle.
function exporter() {
  etat.garde.export = Date.now();
  ecrire();
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...etat, sig: signer(etat) }, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `hauts-faits-${auj()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-avis-installer]')) document.getElementById('btn-installer')?.click();
  if (e.target.closest('[data-avis-exporter]')) {
    exporter();
    e.target.closest('.avis-sauvegarde')?.remove();
  }
});

/* ---------- Évènements ---------- */

function auj() {
  return new Date().toLocaleDateString('fr-CA'); // AAAA-MM-JJ, heure locale
}
function hier() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('fr-CA');
}
const max = (a, b) => Math.max(a || 0, b || 0);

const BOTS_PREUVE = ['dame', 'roi', 'maitre', 'stockfish']; // victoires gardées en PGN pour le prof

export function signaler(type, d = {}) {
  const alerte = controler(etat);
  if (alerte) alerteTriche(alerte);
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
      // Une victoire obtenue en reprenant des coups compte comme partie jouée, pas comme victoire.
      // Une victoire suspecte (sorties de la page, rythme de moteur) non plus : elle part au journal.
      if (d.resultat === 'victoire' && !d.reprise && d.suspect) {
        c.victoiresNonHomologuees++;
        noter(etat, 'partie', `Victoire contre ${BOTS.find((b) => b.id === d.bot)?.nom || d.bot} non homologuée : ${d.suspect}.`);
      }
      if (d.resultat === 'victoire' && !d.reprise && typeof d.pgn === 'string' && d.pgn.length < 20_000 && (d.suspect || BOTS_PREUVE.includes(d.bot))) {
        etat.garde.preuves = [...etat.garde.preuves, {
          t: Date.now(), bot: d.bot, cadence: d.cadence || null, pgn: d.pgn, homologuee: !d.suspect,
          raison: d.suspect || null, sorties: d.sorties || 0, absence: Math.round(d.absence || 0),
        }].slice(-MAX_PREUVES);
      }
      if (d.resultat === 'victoire' && !d.reprise && !d.suspect) {
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
      // Seul le premier essai de la journée compte, et seulement pour aujourd'hui (ou hier, page ouverte à minuit).
      if (!DATE.test(d.date) || d.date in c.defis || d.date > auj() || d.date < hier()) return;
      c.defis[d.date] = d.reussi ? 1 : 0;
      c.meilleureSerieDefi = plusLongueSerie(c.defis);
      if (d.reussi && new Date(`${d.date}T12:00`).getDay() === 0) c.defisDimanche++;
      break;
    case 'alerte':
      noter(etat, d.genre || 'alerte', String(d.texte || ''));
      break;
    default:
      return;
  }
  verifier();
  ecrire();
  majCompteur();
  prevenir();
}

// Prévient le reste de l'application (les skins de plateau) que les hauts faits ont changé.
function prevenir() {
  document.dispatchEvent(new Event('hauts-faits-maj'));
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
export function afficherToast({ classe, visuel, titre, nom, texte, href }) {
  $toasts ??= Object.assign(document.createElement('div'), { className: 'toasts', ariaLive: 'polite' });
  if (!$toasts.isConnected) document.body.appendChild($toasts);
  const t = document.createElement('a');
  t.className = `toast ${classe}`;
  t.href = href;
  t.innerHTML = `${visuel}<span><small>${titre}</small><strong>${nom}</strong><em>${texte}</em></span>`;
  $toasts.appendChild(t);
  setTimeout(() => t.classList.add('sortie'), 5000);
  setTimeout(() => t.remove(), 5600);
}

function annoncer(h) {
  afficherToast({ classe: `palier-${h.palier}`, visuel: medaille(h), titre: `Haut fait débloqué · ${PALIERS[h.palier].nom}`, nom: h.nom, texte: h.desc, href: '#/succes' });
}

/* ---------- Rang et compteur ---------- */

// e : une autre progression que celle de l'appareil (dossier d'un élève lu dans l'espace Prof-AS).
export function points(e = etat) {
  return Object.keys(e.debloques).reduce((s, id) => s + (PALIERS[HAUTS_FAITS.find((h) => h.id === id)?.palier]?.points || 0), 0);
}

export function rangActuel(e = etat) {
  const pts = points(e);
  const parPoints = RANGS.filter((r) => !r.hautFait);
  const challenger = RANGS.find((r) => r.hautFait);
  if (e.debloques[challenger.hautFait]) return { rang: challenger, suivant: null, pts };
  let i = 0;
  while (i + 1 < parPoints.length && pts >= parPoints[i + 1].points) i++;
  return { rang: parPoints[i], suivant: parPoints[i + 1] || challenger, pts };
}

export function estDebloque(id) {
  return !!etat.debloques[id];
}

export function progressionHautFait(id) {
  const h = HAUTS_FAITS.find((x) => x.id === id);
  const v = Math.min(h.valeur(etat.c, Object.keys(etat.debloques).length), h.objectif);
  return { nom: h.nom, v, objectif: h.objectif, ok: !!etat.debloques[id] };
}

/* ---------- Insignes de rang ---------- */
// La forme monte en gamme avec le rang : écusson, écusson ailé, gemme taillée, gemme couronnée, obsidienne.

const INSIGNE = {
  ecusson: ['M50 16 L76 25 V50 C76 67 65 78 50 86 C35 78 24 67 24 50 V25 Z', 'M50 23 L70 30 V50 C70 63 62 72 50 78 C38 72 30 63 30 50 V30 Z'],
  emeraude: ['M38 14 H62 L78 30 V70 L62 86 H38 L22 70 V30 Z', 'M42 26 H58 L66 34 V66 L58 74 H42 L34 66 V34 Z', 'M38 14 L42 26 M62 14 L58 26 M78 30 L66 34 M78 70 L66 66 M62 86 L58 74 M38 86 L42 74 M22 70 L34 66 M22 30 L34 34'],
  brillant: ['M30 18 H70 L88 40 L50 90 L12 40 Z', null, 'M12 40 H88 M30 18 L40 40 L50 18 L60 40 L70 18 M40 40 L50 90 L60 40'],
  eclat: ['M50 6 L74 30 L82 58 L50 92 L18 58 L26 30 Z', null, 'M50 6 L50 92 M26 30 L50 46 L74 30 M18 58 L50 46 L82 58'],
};
const PETITES_AILES = 'M24 30 C14 30 8 38 6 48 C12 44 18 44 24 46 Z M24 48 C16 49 11 55 10 62 C15 58 20 57 24 58 Z';
const GRANDES_AILES = 'M22 26 C8 22 1 33 -2 46 C7 40 13 39 20 41 C9 44 4 52 2 63 C9 56 15 54 22 55 C13 60 9 67 9 76 C16 69 22 67 27 67 Z';
const RAYONS = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8;
  const l = i % 2 ? 52 : 60;
  return `M${(50 + Math.cos(a) * 44).toFixed(1)} ${(50 + Math.sin(a) * 44).toFixed(1)}L${(50 + Math.cos(a) * l).toFixed(1)} ${(50 + Math.sin(a) * l).toFixed(1)}`;
}).join('');

export function insigneRang(r) {
  const g = `insigne-${RANGS.indexOf(r)}`;
  const [base, couronne] = r.forme.split('-');
  const [contour, interieur, facettes] = INSIGNE[base];
  const ailes = (d, fill, stroke) => `<g fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"><path d="${d}"/><path d="${d}" transform="translate(100 0) scale(-1 1)"/></g>`;
  let s = '';
  if (base === 'eclat') s += `<path d="${RAYONS}" stroke="#f1d27a" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>`;
  if (couronne === 'aile') s += ailes(PETITES_AILES, `url(#${g})`, 'rgba(255,255,255,0.5)');
  if (couronne === 'couronne' || base === 'eclat') {
    s += ailes(GRANDES_AILES, base === 'eclat' ? '#141118' : r.nom === 'Grand Master' ? 'url(#insigne-or)' : `url(#${g})`, base === 'eclat' ? '#f1d27a' : 'rgba(255,255,255,0.5)');
  }
  s += `<path d="${contour}" fill="url(#${g})" stroke="#fff" stroke-opacity="0.75" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (interieur) s += `<path d="${interieur}" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="1.8"/>`;
  if (facettes) s += `<path d="${facettes}" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="1.4"/>`;
  if (couronne === 'couronne' || base === 'eclat') {
    s += '<polygon points="33,13 35,-3 43,5 50,-9 57,5 65,-3 67,13" fill="url(#insigne-or)" stroke="#fff" stroke-opacity="0.75" stroke-width="2"/><circle cx="50" cy="-9" r="2.6" fill="#fff"/>';
  }
  const y = base === 'brillant' ? 46 : 50;
  s += `<g transform="translate(33 ${y - 17}) scale(0.75)" fill="#fff" stroke="#1f2937" stroke-width="1.8" stroke-linejoin="round">${SILHOUETTES[r.piece]}</g>`;
  return `<svg class="insigne" viewBox="-6 -16 112 112" role="img" aria-label="Rang ${r.nom}">
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r.a}"/><stop offset="1" stop-color="${r.b}"/></linearGradient>
      <linearGradient id="insigne-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#c2870a"/></linearGradient>
    </defs>${s}</svg>`;
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

/* ---------- Dossier de contrôle ---------- */

export const echapper = (s) => String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

// Lit un fichier exporté, sans toucher à la progression de l'appareil.
// Renvoie { erreur } ou { e, signe, retires } (signe : le fichier n'a pas été retouché).
export function lireDossier(texte) {
  let d;
  try {
    d = JSON.parse(texte);
  } catch {
    return { erreur: 'Ce fichier n’est pas une sauvegarde de hauts faits.' };
  }
  if (d?.v === 1) return { erreur: 'Ce fichier vient d’une ancienne version de l’application et n’est pas signé. Refais l’export depuis l’appareil d’origine, après la mise à jour.' };
  if (d?.v !== 2 || typeof d.c !== 'object' || !d.c) return { erreur: 'Ce fichier n’est pas une sauvegarde de hauts faits.' };
  const signe = signee(d);
  const e = normaliser(d);
  const retires = assainir(e);
  return { e, signe, retires };
}

// Journal de contrôle, du plus récent au plus ancien.
export function journalHtml(e = etat) {
  const lignes = [...e.garde.journal].reverse().map((j) => `
    <li><time>${new Date(j.t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</time> ${echapper(j.texte)}</li>`).join('');
  return lignes ? `<ul class="journal">${lignes}</ul>` : '<p class="note">Aucune alerte : rien à signaler ✓</p>';
}

export function majCompteur() {
  document.querySelectorAll('[data-nb-succes]').forEach((el) => (el.textContent = Object.keys(etat.debloques).length));
}

/* ---------- Échelle des rangs ---------- */

function voirRangs() {
  const { rang, pts } = rangActuel();
  const iActuel = RANGS.indexOf(rang);
  const lignes = [...RANGS].reverse().map((r) => {
    const i = RANGS.indexOf(r);
    const etat = i < iActuel ? 'atteint' : i === iActuel ? 'actuel' : 'a-venir';
    const skin = skinDuRang(r.nom);
    const condition = r.hautFait ? 'Bats Stockfish à pleine puissance' : `${r.points} points`;
    const statut = etat === 'actuel' ? 'Ton rang' : etat === 'atteint' ? '✓' : r.hautFait ? '' : `encore ${r.points - pts} pts`;
    return `
      <li class="echelle-rang ${etat}">
        ${insigneRang(r)}
        <span><b>${r.nom}</b><small>${condition}${skin ? ` · plateau ${skin.nom}` : ''}</small></span>
        <em>${statut}</em>
      </li>`;
  }).join('');
  modal({
    titre: 'Les rangs',
    html: `<p>Tu as <b>${pts} points</b>. Chaque haut fait en rapporte : ${Object.values(PALIERS).map((p) => `${p.nom} ${p.points}`).join(', ')}.</p>
      <ol class="echelle">${lignes}</ol>`,
    actions: [{ label: 'Fermer', primaire: true }],
  });
}

/* ---------- Page des hauts faits ---------- */

let filtre = 'tous';

export function showSucces($app) {
  const nb = Object.keys(etat.debloques).length;
  const { rang, suivant, pts } = rangActuel();
  const pct = suivant && !suivant.hautFait ? Math.round(((pts - rang.points) / (suivant.points - rang.points)) * 100) : 100;
  const skinSuivant = suivant && skinDuRang(suivant.nom);

  const carte = (h) => {
    const date = etat.debloques[h.id];
    const v = Math.min(h.valeur(etat.c, nb), h.objectif);
    const skin = skinDuHautFait(h.id);
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
          ${skin ? `
            <a class="hf-skin" href="#/plateaux" title="Voir les plateaux">
              ${apercu(skin)}
              <span><small>${date ? 'Plateau débloqué' : 'Débloque le plateau'}</small><b>${skin.nom}</b></span>
            </a>` : ''}
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
        <a href="#/plateaux" class="btn page-head-droite">Mes plateaux</a>
      </div>
      <div class="rang-card">
        <button type="button" class="rang-insigne" data-voir-rangs title="Voir tous les rangs">${insigneRang(rang)}</button>
        <div class="rang-texte">
          <small>Ton rang</small>
          <strong>${rang.nom}</strong>
          <div class="hf-prog grand"><span style="width:${pct}%"></span></div>
          <small>${pts} points${!suivant ? ' · rang maximum atteint !'
            : suivant.hautFait ? ` · prochain rang : <b>${suivant.nom}</b>, en battant Stockfish à pleine puissance`
              : ` · prochain rang : <b>${suivant.nom}</b> à ${suivant.points} points`}
            · <button type="button" class="rang-voir" data-voir-rangs>Voir tous les rangs</button></small>
          ${skinSuivant ? `
            <a class="rang-skin" href="#/plateaux">
              ${apercu(skinSuivant)}
              <span><small>Au rang ${suivant.nom}, tu débloques le plateau</small><b>${skinSuivant.nom}</b></span>
            </a>` : ''}
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
          Sur un ordinateur partagé (au lycée par exemple), exporte ta progression dans un fichier pour la retrouver ailleurs.
          Sur iPhone et iPad, installe l’application sur l’écran d’accueil : sinon Safari efface tout après 7 jours sans visite.</p>
        ${avisSauvegarde()}
        <div class="import-actions">
          <button type="button" class="btn" id="btn-exporter">Exporter ma progression</button>
          <label class="btn">
            <input type="file" id="fichier-succes" accept=".json,application/json" hidden>
            Importer un fichier
          </label>
          <button type="button" class="btn danger" id="btn-effacer">Tout effacer</button>
        </div>
        <p class="note">Ta sauvegarde est signée : un fichier retouché à la main est refusé à l’import.</p>
      </div>

      <div class="donnees">
        <h2>Journal de contrôle</h2>
        <p>L’application note ici ce qui ressemble à de la triche (sortie de la page pendant une partie, horloge modifiée, sauvegarde retouchée).
          Il est exporté avec ta progression : ton prof peut le consulter.${etat.c.victoiresNonHomologuees ? ` Victoires non homologuées : <b>${etat.c.victoiresNonHomologuees}</b>.` : ''}</p>
        ${journalHtml()}
      </div>
    </section>`;

  $app.querySelectorAll('[data-voir-rangs]').forEach((b) => b.addEventListener('click', voirRangs));

  $app.querySelectorAll('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      filtre = b.dataset.cat;
      showSucces($app);
    }));

  $app.querySelector('#btn-exporter').addEventListener('click', () => {
    exporter();
    $app.querySelector('.avis-sauvegarde')?.remove();
  });

  $app.querySelector('#fichier-succes').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 1_000_000) throw new Error();
      const lu = lireDossier(await f.text());
      if (lu.erreur) {
        modal({ titre: 'Fichier refusé', html: `<p>${lu.erreur}</p>`, actions: [{ label: 'OK' }] });
        return;
      }
      if (!lu.signe) {
        signaler('alerte', { genre: 'import', texte: 'Import refusé : fichier de progression retouché à la main.' });
        alerteTriche({ texte: 'Ce fichier de progression a été modifié à la main.', consequence: 'Il est refusé : ta progression actuelle ne change pas.' });
        showSucces($app);
        return;
      }
      const r = await modal({
        titre: 'Importer cette progression ?',
        html: `<p>Elle remplacera celle qui est enregistrée sur cet appareil.</p>
          ${lu.retires ? `<p><small>${lu.retires} haut(s) fait(s) incohérent(s) ne seront pas repris.</small></p>` : ''}`,
        actions: [{ label: 'Annuler' }, { label: 'Importer', primaire: true }],
      });
      if (r !== '1') return;
      // Le journal de contrôle de l'appareil est gardé : importer une vieille sauvegarde n'efface pas les alertes.
      const n = lu.e;
      const deja = new Set(n.garde.journal.map((j) => `${j.t}:${j.type}`));
      n.garde.journal = [...n.garde.journal, ...etat.garde.journal.filter((j) => !deja.has(`${j.t}:${j.type}`))].sort((a, b) => a.t - b.t).slice(-MAX_JOURNAL);
      n.garde.vu = Math.max(n.garde.vu, etat.garde.vu);
      if (lu.retires) noter(n, 'import', `Import : ${lu.retires} haut(s) fait(s) incohérent(s) retiré(s).`);
      etat = n;
      const alerte = controler(etat);
      if (alerte) alerteTriche(alerte);
      verifier();
      ecrire();
      majCompteur();
      prevenir();
      showSucces($app);
    } catch {
      modal({ titre: 'Fichier invalide', html: '<p>Ce fichier n’est pas une sauvegarde de hauts faits.</p>', actions: [{ label: 'OK' }] });
    }
  });

  $app.querySelector('#btn-effacer').addEventListener('click', async () => {
    const r = await modal({
      titre: 'Tout effacer ?',
      html: '<p>Tous tes hauts faits et ta progression seront supprimés de cet appareil. C’est définitif.</p><p><small>Le journal de contrôle est conservé.</small></p>',
      actions: [{ label: 'Annuler' }, { label: 'Tout effacer', primaire: true }],
    });
    if (r !== '1') return;
    const { garde } = etat;
    etat = normaliser(null);
    etat.garde = { ...garde, preuves: [] };
    noter(etat, 'effacement', 'Progression effacée par l’élève.');
    ecrire();
    majCompteur();
    prevenir();
    showSucces($app);
  });

  return () => {};
}
