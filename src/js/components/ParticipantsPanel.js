import { State } from '../core/state.js';
import { api } from '../api/client.js';
import { escHtml } from '../utils/dom.js';
import { initial, avatarStyle } from '../utils/formatters.js';

export class ParticipantsPanel {
  constructor() {
    this._unsubscribe = null;
  }

  render() {
    return `
      <div class="panel is-active" data-panel="grupo">
        <div class="card members-invite-card">
          <div class="card__title">Compartir grupo</div>
          <p class="members-invite-hint">Compartí el código para que tus amigos se unan</p>
          <div id="member-share-code" class="members-share-code"></div>
        </div>

        <div class="card">
          <div class="card__title">Miembros del grupo</div>
          <div id="participants-list"></div>
        </div>
      </div>
    `;
  }

  mount() {
    this._unsubscribe = State.on('change', () => this._refresh());
    this._refresh();
  }

  unmount() {
    this._unsubscribe?.();
  }

  _refresh() {
    this._renderShareCode();
    this._renderList();
  }

  _renderShareCode() {
    const el = document.getElementById('member-share-code');
    if (!el) return;
    const { room } = State.get();
    if (!room) return;
    el.innerHTML = `
      <button class="members-code-badge" id="member-copy-code" title="Copiar código">
        <span class="members-code-badge__code">${room.id}</span>
        <span class="members-code-badge__icon">📋 Copiar</span>
      </button>
    `;
    document.getElementById('member-copy-code').addEventListener('click', () => {
      navigator.clipboard.writeText(room.id).then(() => {
        const icon = document.querySelector('.members-code-badge__icon');
        icon.textContent = '✅ Copiado';
        setTimeout(() => { icon.textContent = '📋 Copiar'; }, 1500);
      });
    });
  }

  _renderList() {
    const container = document.getElementById('participants-list');
    if (!container) return;
    const { participants, currentParticipantId } = State.get();

    if (!participants.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">👤</div>
          <div>Aún no hay miembros en este grupo</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="participant-list">
        ${participants.map(p => {
          const isMe = p.id === currentParticipantId;
          return `
            <div class="participant-item">
              <div class="avatar" style="${avatarStyle(p.color)}">${initial(p.name)}</div>
              <div class="participant-item__name">
                ${escHtml(p.name)}
                ${isMe ? '<span class="participant-you-badge">Tú</span>' : ''}
              </div>
              ${!isMe ? `<button class="btn btn--danger btn--sm" data-remove-participant="${p.id}">Quitar</button>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('[data-remove-participant]').forEach(btn => {
      btn.addEventListener('click', () => this._removeParticipant(btn.dataset.removeParticipant));
    });
  }

  async _removeParticipant(id) {
    const { expenses } = State.get();
    const hasExpenses = expenses.some(e => e.payerId === id || e.participantIds.includes(id));
    if (hasExpenses && !confirm('Este participante tiene gastos. ¿Deseas quitarlo de todas formas?')) return;

    try {
      const { room } = State.get();
      await api.removeParticipant(room.id, id);
    } catch (err) {
      console.error(err.message);
    }
  }
}
