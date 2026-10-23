// Stockfish tourne dans un Web Worker, entièrement dans le navigateur : rien n'est envoyé sur Internet.
const STOCKFISH = 'vendor/stockfish/stockfish-17.1-lite-single-03e3232.js';

export class Engine {
  #worker = null;
  #listeners = new Set();
  #ready = null;
  // Les recherches sont exécutées l'une après l'autre pour ne jamais confondre deux « bestmove ».
  #queue = Promise.resolve();

  init() {
    if (this.#ready) return this.#ready;
    this.#worker = new Worker(STOCKFISH);
    this.#worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      for (const l of [...this.#listeners]) l(line);
    };
    this.#ready = new Promise((resolve, reject) => {
      this.#worker.onerror = (e) => reject(new Error(e.message || 'Impossible de charger le moteur'));
      this.#waitFor('uci', 'uciok').then(() => this.#waitFor('isready', 'readyok')).then(resolve);
    });
    return this.#ready;
  }

  #send(cmd) {
    this.#worker.postMessage(cmd);
  }

  #waitFor(cmd, prefix) {
    return new Promise((resolve) => {
      const l = (line) => {
        if (line.startsWith(prefix)) {
          this.#listeners.delete(l);
          resolve(line);
        }
      };
      this.#listeners.add(l);
      if (cmd) this.#send(cmd);
    });
  }

  #enqueue(task) {
    const run = this.#queue.then(task, task);
    this.#queue = run.catch(() => {});
    return run;
  }

  newGame() {
    return this.#enqueue(async () => {
      await this.init();
      this.#send('ucinewgame');
      await this.#waitFor('isready', 'readyok');
    });
  }

  // Renvoie le meilleur coup au format UCI (ex. « e2e4 », « e7e8q ») ou null.
  bestMove(fen, { skill = 20, depth, movetime }) {
    return this.#enqueue(async () => {
      await this.init();
      this.#send(`setoption name Skill Level value ${skill}`);
      this.#send(`position fen ${fen}`);
      const go = movetime ? `go movetime ${movetime}` : `go depth ${depth ?? 10}`;
      const line = await this.#waitFor(go, 'bestmove');
      const move = line.split(' ')[1];
      return move && move !== '(none)' ? move : null;
    });
  }

  // Analyse à pleine puissance. score : point de vue du camp qui a le trait ({ type: 'cp' | 'mate', value }).
  analyse(fen, { depth = 12, movetime } = {}) {
    return this.#enqueue(async () => {
      await this.init();
      this.#send('setoption name Skill Level value 20');
      this.#send(`position fen ${fen}`);
      let score = null;
      const lireInfo = (line) => {
        if (!line.startsWith('info') || / (upper|lower)bound/.test(line)) return;
        const m = line.match(/ score (cp|mate) (-?\d+)/);
        if (m) score = { type: m[1], value: Number(m[2]) };
      };
      this.#listeners.add(lireInfo);
      const line = await this.#waitFor(`go depth ${depth}${movetime ? ` movetime ${movetime}` : ''}`, 'bestmove');
      this.#listeners.delete(lireInfo);
      const best = line.split(' ')[1];
      return { score, best: best && best !== '(none)' ? best : null };
    });
  }

  stop() {
    if (this.#worker) this.#send('stop');
  }
}

// Un seul moteur pour toute l'application.
let instance = null;
export function obtenirMoteur() {
  return (instance ??= new Engine());
}
