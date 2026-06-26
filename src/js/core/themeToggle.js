const STORAGE_KEY = 'dividanselo_theme';
const COMMUNIST = 'communist';

export function initThemeToggle() {
  if (localStorage.getItem(STORAGE_KEY) === COMMUNIST) {
    document.documentElement.setAttribute('data-theme', COMMUNIST);
  }

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.title = 'Cambiar tema';
  updateIcon(btn);

  btn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') === COMMUNIST;
    if (active) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(STORAGE_KEY);
    } else {
      document.documentElement.setAttribute('data-theme', COMMUNIST);
      localStorage.setItem(STORAGE_KEY, COMMUNIST);
    }
    updateIcon(btn);
  });

  document.body.appendChild(btn);
}

function updateIcon(btn) {
  const active = document.documentElement.getAttribute('data-theme') === COMMUNIST;
  btn.textContent = active ? '🌙' : '☭';
}
