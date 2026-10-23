// Cadences de jeu. Identifiant « minutes-incrément » (ex. « 3-2 » = 3 minutes + 2 secondes par coup).
const ICONES = {
  bullet: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor"/>',
  blitz: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" fill="currentColor"/>',
  rapide: '<circle cx="12" cy="14" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 14V10M9.5 2.5h5M12 2.5v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  libre: '<path d="M7 8.5a3.5 3.5 0 1 0 0 7c3.5 0 6.5-7 10-7a3.5 3.5 0 1 1 0 7c-3.5 0-6.5-7-10-7z" fill="none" stroke="currentColor" stroke-width="2.2"/>',
};

export const GROUPES = [
  { id: 'bullet', nom: 'Bullet', couleur: '#eab308', options: ['1-0', '1-1', '2-1'] },
  { id: 'blitz', nom: 'Blitz', couleur: '#f97316', options: ['3-0', '3-2', '5-0'] },
  { id: 'rapide', nom: 'Rapide', couleur: '#16a34a', options: ['10-0', '15-10', '30-0'] },
  { id: 'libre', nom: 'Sans limite', couleur: '#64748b', options: ['aucune'] },
];

export function icone(groupe) {
  return `<svg class="cad-icone" viewBox="0 0 24 24" aria-hidden="true" style="color:${groupe.couleur}">${ICONES[groupe.id]}</svg>`;
}

export function libelle(id) {
  if (id === 'aucune') return 'Sans limite';
  const [m, i] = id.split('-');
  return i === '0' ? `${m} min` : `${m} | ${i}`;
}

// Renvoie { id, base, inc, groupe } en millisecondes, ou null pour « sans limite ».
export function parseCadence(id) {
  const groupe = GROUPES.find((g) => g.options.includes(id));
  if (!groupe || id === 'aucune') return null;
  const [m, i] = id.split('-').map(Number);
  return { id, base: m * 60000, inc: i * 1000, groupe };
}

export function selecteurCadence(choisie) {
  return `
    <div class="cadences">
      ${GROUPES.map((g) => `
        <div class="cad-groupe">
          <div class="cad-titre">${icone(g)}<span>${g.nom}</span></div>
          <div class="cad-options" role="radiogroup" aria-label="${g.nom}">
            ${g.options.map((id) => `
              <button type="button" role="radio" data-cadence="${id}" aria-checked="${id === choisie}">${libelle(id)}</button>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}

export function formatTemps(ms) {
  ms = Math.max(0, ms);
  if (ms < 20000) {
    const s = Math.floor(ms / 100) / 10;
    return `0:${s.toFixed(1).padStart(4, '0')}`;
  }
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
