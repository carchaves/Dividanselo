import { State } from '../core/state.js';
import { api } from '../api/client.js';
import { computeBalances, computeMinTransfers } from '../services/SettlementService.js';
import { escHtml } from '../utils/dom.js';
import { formatCurrency, initial, avatarStyle } from '../utils/formatters.js';

export class SettlementPanel {
  constructor() {
    this._unsubscribe = null;
  }

  render() {
    return `
      <div class="panel" data-panel="liquidar">
        <div class="card">
          <div class="card__title">Balance por persona</div>
          <div id="balances-list"></div>
        </div>

        <div class="card">
          <div class="card__title">
            Transferencias mínimas <span class="tag">Optimizado</span>
          </div>
          <div id="transfers-list"></div>
        </div>

        <button id="btn-reset-all" class="btn btn--danger btn--full mt-4">
          🗑️ Reiniciar grupo
        </button>
      </div>
    `;
  }

  mount() {
    document.getElementById('btn-reset-all').addEventListener('click', () => this._resetAll());
    this._unsubscribe = State.on('change', () => this._render());
    this._render();
  }

  unmount() {
    this._unsubscribe?.();
  }

  onActivate() {
    this._render();
  }

  _render() {
    this._renderBalances();
    this._renderTransfers();
  }

  _renderBalances() {
    const container = document.getElementById('balances-list');
    if (!container) return;

    const { participants, expenses } = State.get();

    if (!participants.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <div>Agrega participantes y gastos para ver el balance</div>
        </div>
      `;
      return;
    }

    const balances = computeBalances(participants, expenses);

    container.innerHTML = `
      <div class="balance-list">
        ${participants.map(p => {
          const bal = balances[p.id] ?? 0;
          const cls  = bal > 0.005 ? 'positive' : bal < -0.005 ? 'negative' : 'zero';
          const text = bal > 0.005
            ? `le deben ${formatCurrency(bal)}`
            : bal < -0.005
              ? `debe ${formatCurrency(Math.abs(bal))}`
              : 'está al día ✓';
          return `
            <div class="balance-item">
              <div class="avatar" style="${avatarStyle(p.color)}">${initial(p.name)}</div>
              <div class="balance-item__name">${escHtml(p.name)}</div>
              <div class="balance-item__amount balance-item__amount--${cls}">${text}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  _renderTransfers() {
    const container = document.getElementById('transfers-list');
    if (!container) return;

    const { participants, expenses } = State.get();

    if (!expenses.length) {
      container.innerHTML = `
        <div class="settled-banner">
          <div class="settled-banner__icon">📊</div>
          <p class="settled-banner__text">Agrega gastos para calcular las transferencias</p>
        </div>
      `;
      return;
    }

    const transfers = computeMinTransfers(computeBalances(participants, expenses));

    if (!transfers.length) {
      container.innerHTML = `
        <div class="settled-banner">
          <div class="settled-banner__icon">🎉</div>
          <p class="settled-banner__text">¡Todos están al día! No hay nada que liquidar.</p>
        </div>
      `;
      return;
    }

    const findP = id => participants.find(p => p.id === id);

    container.innerHTML = `
      <div class="transfer-list">
        ${transfers.map(t => {
          const from = findP(t.from);
          const to   = findP(t.to);
          return `
            <div class="transfer-item">
              <div class="transfer-item__avatar" style="${avatarStyle(from?.color ?? '#999')}">
                ${initial(from?.name)}
              </div>
              <div class="transfer-item__text">
                <div class="transfer-item__names"><strong>${escHtml(from?.name ?? '?')}</strong></div>
                <div class="transfer-item__arrow">→ le paga a → <strong>${escHtml(to?.name ?? '?')}</strong></div>
              </div>
              <div class="transfer-item__amount">${formatCurrency(t.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async _resetAll() {
    if (!confirm('¿Seguro que quieres borrar todos los participantes y gastos? Esta acción no se puede deshacer.')) return;
    try {
      const { room } = State.get();
      await api.resetRoom(room.id);
    } catch (err) {
      alert('Error al reiniciar: ' + err.message);
    }
  }
}
