// Fenêtre modale partagée. Une seule à la fois : en ouvrir une nouvelle ferme la précédente (qui renvoie null).
const $modal = document.getElementById('modal');
let resoudreModale = null;

$modal.addEventListener('close', () => {
  if ($modal.open) return; // évènement d'une fenêtre déjà remplacée
  const resoudre = resoudreModale;
  resoudreModale = null;
  resoudre?.($modal.returnValue === '' ? null : $modal.returnValue);
});

// Renvoie l'index (en texte) du bouton cliqué, la valeur d'un bouton du contenu, ou null si fermée.
export function modal({ titre, html = '', actions = [] }) {
  if (resoudreModale) {
    const precedente = resoudreModale;
    resoudreModale = null;
    $modal.close();
    precedente(null);
  }
  return new Promise((resolve) => {
    $modal.innerHTML = `
      <form method="dialog" class="modal-body">
        ${titre ? `<h2>${titre}</h2>` : ''}
        ${html}
        ${actions.length ? `<div class="modal-actions">${actions
          .map((a, i) => `<button class="btn ${a.primaire ? 'primary' : ''}" value="${i}">${a.label}</button>`)
          .join('')}</div>` : ''}
      </form>`;
    $modal.returnValue = '';
    resoudreModale = resolve;
    // Réponse immédiate au clic sur un bouton (l'évènement « close » peut arriver plus tard).
    $modal.querySelector('form').addEventListener('submit', (e) => {
      if (resoudreModale !== resolve) return;
      resoudreModale = null;
      resolve(e.submitter?.value ?? null);
    });
    $modal.showModal();
  });
}

export function fermerModal() {
  if ($modal.open) $modal.close();
}
