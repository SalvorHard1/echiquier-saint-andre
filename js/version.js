// Numéro de version de l'application et journal des nouveautés.
// À chaque mise en ligne : augmenter VERSION ici, mettre le MÊME numéro dans sw.js, et ajouter une entrée en tête de NOUVEAUTES.
export const VERSION = '0.12';

export const NOUVEAUTES = [
  {
    version: '0.12', date: '2026-10-24',
    changements: [
      'Anti-triche : sauvegarde protégée, alertes et journal de contrôle',
      'Victoires non homologuées si on quitte la partie pendant son tour',
      'Défi du jour raté si on quitte la page pendant l’essai',
      'Espace Prof-AS : L’Œil de Caïssa, pourcentage de triche et analyse des parties',
    ],
  },
  {
    version: '0.11', date: '2026-10-24',
    changements: [
      'Nouveaux rangs : Fer, Bronze, Argent, Or, Platine, Émeraude, Diamant, Master, Grand Master… et Challenger.',
      'Plateaux à débloquer : 17 skins, avec 10 styles de pièces, gagnés par le rang ou par des hauts faits difficiles.',
      'Les hauts faits s’appellent maintenant Commun, Rare, Épique et Mythique.',
    ],
  },
  {
    version: '0.10', date: '2026-10-23',
    changements: [
      'Nouveau nom : L’Échiquier de Saint-André.',
      'L’application fonctionne hors ligne et peut s’installer sur l’écran d’accueil.',
      'Numéro de version et journal des nouveautés (en bas de page).',
    ],
  },
  {
    version: '0.9',
    changements: [
      'Défi du jour : le même problème pour toute l’AS, plus dur au fil de la semaine.',
      'Chapitre « Les ouvertures » : Italienne, Londres, Scandinave, Espagnole, Gambit dame, Sicilienne.',
    ],
  },
  { version: '0.8', changements: ['Onglet « Cours » : tactiques, mats types, finales contre Stockfish, stratégie.'] },
  { version: '0.7', changements: ['Onglet « Pas à pas » : apprendre les règles en jouant.'] },
  { version: '0.6', changements: ['Hauts faits et médailles, enregistrés dans le navigateur.'] },
  { version: '0.5', changements: ['Problèmes par niveau et course contre la montre.'] },
  { version: '0.4', changements: ['Flèches et cases colorées sur l’échiquier.'] },
  { version: '0.3', changements: ['Analyse d’une partie PGN avec Stockfish.'] },
  { version: '0.2', changements: ['Cadences (Bullet, Blitz, Rapide) et pendules.'] },
  { version: '0.1', changements: ['Première version : parties contre les bots et à deux.'] },
];
