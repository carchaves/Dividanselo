import { qs } from '../utils/dom.js';

const TABS = [
  { id: 'grupo',    label: '👥 Grupo' },
  { id: 'gastos',   label: '💸 Gastos' },
  { id: 'liquidar', label: '⚖️ Liquidar' },
];

export class TabManager {
  constructor({ onSwitch }) {
    this._onSwitch = onSwitch;
    this._activeId = TABS[0].id;
  }

  mount() {
    const nav = qs('#tab-nav');
    nav.innerHTML = TABS.map(tab => `
      <button
        class="tab-btn ${tab.id === this._activeId ? 'is-active' : ''}"
        data-tab="${tab.id}"
        role="tab"
        aria-selected="${tab.id === this._activeId}"
      >${tab.label}</button>
    `).join('');

    nav.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      this.switchTo(btn.dataset.tab);
    });
  }

  switchTo(tabId) {
    if (this._activeId === tabId) return;
    this._activeId = tabId;
    this._updateNav();
    this._updatePanels();
    this._onSwitch?.(tabId);
  }

  _updateNav() {
    const nav = qs('#tab-nav');
    nav.querySelectorAll('[data-tab]').forEach(btn => {
      const isActive = btn.dataset.tab === this._activeId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });
  }

  _updatePanels() {
    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.toggle('is-active', panel.dataset.panel === this._activeId);
    });
  }
}
