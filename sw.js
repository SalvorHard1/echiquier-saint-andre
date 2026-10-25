// Service worker : garde une copie de l'application sur l'appareil pour qu'elle marche SANS Internet.
// Il ne stocke que les fichiers du site (aucune donnée personnelle) et ne contacte aucun autre serveur.
//
// VERSION : le même numéro que dans js/version.js. Le changer à chaque mise en ligne renouvelle la copie
// sur les appareils des élèves. Un fichier ajouté au site doit aussi être ajouté à FICHIERS.
const VERSION = '0.18';
const CACHE = `echiquier-${VERSION}`;

// Jeux de pièces : cburnett à la racine de assets/pieces, les autres dans leur dossier (voir js/skins.js).
const JEUX_PIECES = ['cburnett', 'merida', 'staunty', 'maestro', 'california', 'cardinal', 'tatiana', 'chessnut', 'celtic', 'fantasy',
  'spatial', 'horsey', 'anarcandy', 'papercut', 'shapes'];
const dossierPieces = (jeu) => (jeu === 'cburnett' ? 'assets/pieces/' : `assets/pieces/${jeu}/`);

const FICHIERS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/analyse.js', 'js/animations.js', 'js/app.js', 'js/board.js', 'js/bots.js', 'js/cadences.js', 'js/config.js',
  'js/cours-data.js', 'js/cours.js', 'js/defi.js', 'js/elo.js', 'js/historique.js', 'js/engine.js', 'js/lecons-data.js', 'js/lecons.js',
  'js/modal.js', 'js/ouvertures-data.js', 'js/ouvertures.js', 'js/plateaux.js', 'js/problemes.js', 'js/skins.js', 'js/succes.js', 'js/version.js',
  'js/position.js', 'js/prof.js', 'js/qr.js', 'js/tournoi.js', 'js/vigilance.js',
  'vendor/chess/chess.js',
  'vendor/stockfish/stockfish-17.1-lite-single-03e3232.js',
  'vendor/stockfish/stockfish-17.1-lite-single-03e3232.wasm',
  'data/problemes.json',
  'assets/icone-192.png', 'assets/icone-512.png', 'assets/icone-masquable-512.png', 'assets/icone-apple-180.png',
  ...JEUX_PIECES.flatMap((jeu) => ['w', 'b'].flatMap((c) => ['K', 'Q', 'R', 'B', 'N', 'P'].map((p) => `${dossierPieces(jeu)}${c}${p}.svg`))),
];

// Gros fichiers qui ne changent presque jamais : on les sert depuis l'appareil sans les retélécharger.
const FIXES = /\/(vendor|data|assets)\//;

// cache: 'reload' : les fichiers viennent du site, pas du cache du navigateur (qui peut garder l'ancienne version).
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith('echiquier-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const enCache = await cache.match(req, { ignoreSearch: true });
    if (enCache && FIXES.test(url.pathname)) return enCache;
    // Le reste : réponse immédiate depuis l'appareil, et mise à jour en arrière-plan pour la prochaine fois.
    const reseau = fetch(req).then((r) => {
      if (r.ok) cache.put(req, r.clone());
      return r;
    });
    if (enCache) {
      e.waitUntil(reseau.catch(() => {}));
      return enCache;
    }
    try {
      return await reseau;
    } catch {
      return (req.mode === 'navigate' && (await cache.match('index.html'))) || Response.error();
    }
  })());
});
