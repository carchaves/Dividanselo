import { State } from '../core/state.js';
import { api } from '../api/client.js';
import { shakeElement, escHtml, qsa } from '../utils/dom.js';
import { formatCurrency, initial, avatarStyle } from '../utils/formatters.js';

export class ExpensesPanel {
  constructor() {
    this._unsubscribe = null;
  }

  render() {
    return `
      <div class="panel" data-panel="gastos">
        <div class="card">
          <div class="card__title">Registrar gasto</div>

          <div class="form-field">
            <label class="form-field__label" for="inp-expense-desc">Descripción</label>
            <input
              id="inp-expense-desc"
              class="form-field__input"
              type="text"
              placeholder="Ej: Cena, Taxi, Supermercado…"
              maxlength="40"
              autocomplete="off"
            />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-field__label" for="inp-expense-amount">Monto ($)</label>
              <input
                id="inp-expense-amount"
                class="form-field__input"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-field">
              <label class="form-field__label" for="sel-expense-payer">Pagó</label>
              <select id="sel-expense-payer" class="form-field__select">
                <option value="">— seleccionar —</option>
              </select>
            </div>
          </div>

          <div class="form-field">
            <label class="form-field__label">Dividir entre</label>
            <div id="split-grid" class="split-grid"></div>
            <div id="split-hint" class="split-hint"></div>
          </div>

          <div id="expense-form-error" style="font-size:var(--font-size-xs);color:var(--color-danger);margin-top:6px;display:none"></div>
          <button id="btn-add-expense" class="btn btn--primary btn--full mt-3">+ Registrar gasto</button>
        </div>

        <div id="expense-stats" class="stats-row" style="display:none"></div>

        <div class="card">
          <div class="card__title">Gastos registrados</div>
          <div id="expenses-list"></div>
        </div>
      </div>
    `;
  }

  mount() {
    document.getElementById('btn-add-expense').addEventListener('click', () => this._addExpense());
    document.getElementById('inp-expense-amount').addEventListener('input', () => this._updateHint());

    this._unsubscribe = State.on('change', () => this._refresh());
    this._refresh();
  }

  unmount() {
    this._unsubscribe?.();
  }

  _refresh() {
    this._renderPayerSelect();
    this._renderSplitGrid();
    this._renderExpensesList();
    this._renderStats();
  }

  _renderPayerSelect() {
    const sel = document.getElementById('sel-expense-payer');
    if (!sel) return;
    const prev = sel.value;
    const { participants, currentParticipantId } = State.get();
    // Default to the logged-in user's participant; keep prior selection if set
    const selectedId = prev || currentParticipantId || '';
    sel.innerHTML = '<option value="">— seleccionar —</option>' +
      participants.map(p =>
        `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${escHtml(p.name)}</option>`
      ).join('');
  }

  _renderSplitGrid() {
    const grid = document.getElementById('split-grid');
    if (!grid) return;
    const { participants } = State.get();

    if (!participants.length) {
      grid.innerHTML = '<span class="text-muted" style="font-size:var(--font-size-sm)">Primero agrega participantes</span>';
      return;
    }

    grid.innerHTML = participants.map(p => `
      <label class="split-check is-selected" data-split-label="${p.id}">
        <input class="split-check__input" type="checkbox" checked data-pid="${p.id}" />
        <div class="split-check__dot">✓</div>
        <span class="split-check__label">${escHtml(p.name)}</span>
      </label>
    `).join('');

    grid.querySelectorAll('.split-check').forEach(label => {
      label.addEventListener('click', () => {
        const inp = label.querySelector('input');
        inp.checked = !inp.checked;
        label.classList.toggle('is-selected', inp.checked);
        this._updateHint();
      });
    });

    this._updateHint();
  }

  _updateHint() {
    const hint = document.getElementById('split-hint');
    if (!hint) return;
    const checked = qsa('#split-grid input:checked');
    const amount  = parseFloat(document.getElementById('inp-expense-amount')?.value) || 0;

    if (!checked.length) {
      hint.textContent = 'Selecciona al menos una persona.';
    } else if (amount > 0) {
      hint.textContent = `${formatCurrency(amount / checked.length)} por persona (${checked.length} personas)`;
    } else {
      hint.textContent = `${checked.length} persona${checked.length > 1 ? 's' : ''} seleccionada${checked.length > 1 ? 's' : ''}`;
    }
  }

  _getSelectedParticipantIds() {
    return qsa('#split-grid input:checked').map(inp => inp.dataset.pid);
  }

  async _addExpense() {
    const descEl   = document.getElementById('inp-expense-desc');
    const amountEl = document.getElementById('inp-expense-amount');
    const payerEl  = document.getElementById('sel-expense-payer');

    const desc   = descEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const payer  = payerEl.value;
    const parts  = this._getSelectedParticipantIds();

    if (!desc)              { shakeElement(descEl);   return; }
    if (!amount || amount <= 0) { shakeElement(amountEl); return; }
    if (!payer)             { shakeElement(payerEl);  return; }
    if (!parts.length) {
      this._showError('Selecciona al menos una persona entre quien dividir.');
      return;
    }

    const btn = document.getElementById('btn-add-expense');
    btn.disabled = true;
    btn.textContent = 'Registrando…';

    try {
      const { room } = State.get();
      await api.addExpense(room.id, {
        description: desc,
        amount,
        payerId: payer,
        participantIds: parts,
      });
      descEl.value   = '';
      amountEl.value = '';
      this._hideError();
      descEl.focus();
    } catch (err) {
      this._showError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '+ Registrar gasto';
    }
  }

  async _removeExpense(id) {
    try {
      const { room } = State.get();
      await api.removeExpense(room.id, id);
    } catch (err) {
      this._showError(err.message);
    }
  }

  _renderExpensesList() {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    const { expenses, participants } = State.get();

    if (!expenses.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🧾</div>
          <div>Aún no hay gastos registrados</div>
        </div>
      `;
      return;
    }

    const findP = id => participants.find(p => p.id === id);

    container.innerHTML = `
      <div class="expense-list">
        ${[...expenses].reverse().map(e => {
          const payer = findP(e.payerId);
          const names = e.participantIds.map(id => findP(id)?.name).filter(Boolean).map(escHtml).join(', ');
          return `
            <div class="expense-item">
              <div class="expense-item__icon">${e.icon}</div>
              <div class="expense-item__info">
                <div class="expense-item__desc">${escHtml(e.description)}</div>
                <div class="expense-item__meta">
                  Pagó <strong>${escHtml(payer?.name ?? '?')}</strong> · ${e.date}<br>
                  Divide entre: ${names || '—'}
                </div>
              </div>
              <div class="expense-item__actions">
                <span class="expense-item__amount">${formatCurrency(e.amount)}</span>
                <button class="btn btn--danger btn--sm" data-remove-expense="${e.id}">✕</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('[data-remove-expense]').forEach(btn => {
      btn.addEventListener('click', () => this._removeExpense(btn.dataset.removeExpense));
    });
  }

  _renderStats() {
    const statsEl = document.getElementById('expense-stats');
    if (!statsEl) return;
    const { expenses, participants } = State.get();

    if (!expenses.length) { statsEl.style.display = 'none'; return; }
    statsEl.style.display = 'flex';

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const avg   = participants.length > 0 ? total / participants.length : 0;

    statsEl.innerHTML = `
      <div class="stat-box">
        <div class="stat-box__value">${formatCurrency(total)}</div>
        <div class="stat-box__label">Total gastado</div>
      </div>
      <div class="stat-box">
        <div class="stat-box__value">${expenses.length}</div>
        <div class="stat-box__label">Gastos</div>
      </div>
      <div class="stat-box">
        <div class="stat-box__value">${formatCurrency(avg)}</div>
        <div class="stat-box__label">Promedio / persona</div>
      </div>
    `;
  }

  _showError(msg) {
    const el = document.getElementById('expense-form-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  _hideError() {
    const el = document.getElementById('expense-form-error');
    if (el) el.style.display = 'none';
  }
}
