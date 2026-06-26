import { api } from '../api/client.js';
import { Storage } from '../core/storage.js';
import { shakeElement, escHtml } from '../utils/dom.js';

export class LobbyPanel {
  constructor({ user, onJoin }) {
    this._user  = user;
    this._onJoin = onJoin;
  }

  render() {
    return `
      <div id="lobby">
        <div class="lobby-logo">
          <div class="lobby-logo__title">✂️ Dividanselo</div>
          <div class="lobby-logo__subtitle">Hola, <strong>${escHtml(this._user.displayName)}</strong> 👋</div>
        </div>

        <!-- Crear sala -->
        <div class="lobby-card">
          <div class="lobby-card__title">✨ Crear un nuevo grupo</div>
          <div class="form-field">
            <label class="form-field__label" for="inp-room-name">Nombre del grupo</label>
            <input
              id="inp-room-name"
              class="form-field__input"
              type="text"
              placeholder="Ej: Viaje a Bariloche, Departamento…"
              maxlength="40"
              autocomplete="off"
            />
          </div>
          <button id="btn-create-room" class="btn btn--primary btn--full mt-3">
            Crear grupo
          </button>
          <div id="create-error" class="lobby-error"></div>
        </div>

        <!-- Divisor -->
        <div class="lobby-divider">
          <div class="lobby-divider__line"></div>
          <div class="lobby-divider__text">o</div>
          <div class="lobby-divider__line"></div>
        </div>

        <!-- Unirse a sala -->
        <div class="lobby-card">
          <div class="lobby-card__title">🔗 Unirme a un grupo existente</div>
          <div class="form-field">
            <label class="form-field__label" for="inp-room-code">Código del grupo</label>
            <input
              id="inp-room-code"
              class="form-field__input"
              type="text"
              placeholder="Ej: ABC123"
              maxlength="6"
              autocomplete="off"
              style="text-transform:uppercase;letter-spacing:3px;font-weight:700"
            />
          </div>
          <button id="btn-join-room" class="btn btn--ghost btn--full mt-3">
            Unirme al grupo
          </button>
          <div id="join-error" class="lobby-error"></div>
        </div>
      </div>
    `;
  }

  mount() {
    document.getElementById('btn-create-room').addEventListener('click', () => this._createRoom());
    document.getElementById('btn-join-room').addEventListener('click',   () => this._joinRoom());

    document.getElementById('inp-room-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._createRoom();
    });
    document.getElementById('inp-room-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._joinRoom();
    });
    document.getElementById('inp-room-code').addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Auto-join if room code is in URL
    const urlCode = new URLSearchParams(window.location.search).get('room');
    if (urlCode) this._joinWithCode(urlCode.toUpperCase());
  }

  async _createRoom() {
    const nameEl = document.getElementById('inp-room-name');
    const name   = nameEl.value.trim();
    if (!name) { shakeElement(nameEl); return; }

    const btn = document.getElementById('btn-create-room');
    btn.textContent = 'Creando…';
    btn.disabled    = true;

    try {
      const roomData = await api.createRoom(name);
      history.pushState({}, '', `?room=${roomData.id}`);
      this._onJoin(roomData);
    } catch (err) {
      this._showError('create-error', err.message);
      btn.textContent = 'Crear grupo';
      btn.disabled    = false;
    }
  }

  async _joinRoom() {
    const codeEl = document.getElementById('inp-room-code');
    const code   = codeEl.value.trim().toUpperCase();
    if (code.length < 3) { shakeElement(codeEl); return; }
    await this._joinWithCode(code);
  }

  async _joinWithCode(code) {
    const codeEl = document.getElementById('inp-room-code');
    if (codeEl) codeEl.value = code;

    const btn = document.getElementById('btn-join-room');
    if (btn) { btn.textContent = 'Uniéndome…'; btn.disabled = true; }

    try {
      const roomData = await api.joinRoom(code);
      history.pushState({}, '', `?room=${roomData.id}`);
      this._onJoin(roomData);
    } catch (err) {
      this._showError('join-error', 'No se encontró ningún grupo con ese código.');
      if (codeEl) shakeElement(codeEl);
      if (btn) { btn.textContent = 'Unirme al grupo'; btn.disabled = false; }
    }
  }

  _showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    setTimeout(() => el.classList.remove('is-visible'), 4000);
  }
}
