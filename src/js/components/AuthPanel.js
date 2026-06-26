import { api } from '../api/client.js';
import { Storage } from '../core/storage.js';
import { shakeElement } from '../utils/dom.js';

export class AuthPanel {
  constructor({ onAuth }) {
    this._onAuth = onAuth;
    this._tab    = 'login';
  }

  render() {
    return `
      <div id="auth-panel">
        <div class="auth-logo">
          <div class="auth-logo__title">✂️ Dividanselo</div>
          <div class="auth-logo__subtitle">Divide gastos entre amigos sin dramas</div>
        </div>

        <div class="auth-card">
          <div class="auth-tabs" role="tablist">
            <button class="auth-tab is-active" data-auth-tab="login"    role="tab">Iniciar sesión</button>
            <button class="auth-tab"           data-auth-tab="register" role="tab">Registrarse</button>
          </div>

          <!-- Login form -->
          <div id="auth-form-login" class="auth-form">
            <div class="form-field">
              <label class="form-field__label" for="inp-login-user">Usuario</label>
              <input id="inp-login-user" class="form-field__input" type="text"
                placeholder="tu_usuario" autocomplete="username" />
            </div>
            <div class="form-field">
              <label class="form-field__label" for="inp-login-pass">Contraseña</label>
              <input id="inp-login-pass" class="form-field__input" type="password"
                placeholder="••••••" autocomplete="current-password" />
            </div>
            <div id="auth-error-login" class="auth-error"></div>
            <button id="btn-login" class="btn btn--primary btn--full mt-3">Entrar</button>
          </div>

          <!-- Register form -->
          <div id="auth-form-register" class="auth-form" style="display:none">
            <div class="form-field">
              <label class="form-field__label" for="inp-reg-display">Tu nombre</label>
              <input id="inp-reg-display" class="form-field__input" type="text"
                placeholder="Ej: Ana García" maxlength="30" autocomplete="name" />
              <span class="form-field__hint">Así te verán los demás en los grupos</span>
            </div>
            <div class="form-field">
              <label class="form-field__label" for="inp-reg-user">Usuario</label>
              <input id="inp-reg-user" class="form-field__input" type="text"
                placeholder="Ej: ana123" maxlength="20" autocomplete="username" />
            </div>
            <div class="form-field">
              <label class="form-field__label" for="inp-reg-pass">Contraseña</label>
              <input id="inp-reg-pass" class="form-field__input" type="password"
                placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
            </div>
            <div id="auth-error-register" class="auth-error"></div>
            <button id="btn-register" class="btn btn--primary btn--full mt-3">Crear cuenta</button>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    // Tab switching
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.authTab));
    });

    // Login
    document.getElementById('btn-login').addEventListener('click', () => this._login());
    document.getElementById('inp-login-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._login();
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', () => this._register());
    document.getElementById('inp-reg-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._register();
    });
  }

  _switchTab(tab) {
    this._tab = tab;
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.authTab === tab);
    });
    document.getElementById('auth-form-login').style.display    = tab === 'login'    ? '' : 'none';
    document.getElementById('auth-form-register').style.display = tab === 'register' ? '' : 'none';
  }

  async _login() {
    const userEl = document.getElementById('inp-login-user');
    const passEl = document.getElementById('inp-login-pass');
    const user   = userEl.value.trim();
    const pass   = passEl.value;

    if (!user) { shakeElement(userEl); return; }
    if (!pass) { shakeElement(passEl); return; }

    const btn = document.getElementById('btn-login');
    btn.textContent = 'Entrando…';
    btn.disabled    = true;

    try {
      const { token, user: userData } = await api.login(user, pass);
      Storage.saveToken(token);
      this._onAuth(userData);
    } catch (err) {
      this._showError('auth-error-login', err.message);
      shakeElement(passEl);
      btn.textContent = 'Entrar';
      btn.disabled    = false;
    }
  }

  async _register() {
    const displayEl = document.getElementById('inp-reg-display');
    const userEl    = document.getElementById('inp-reg-user');
    const passEl    = document.getElementById('inp-reg-pass');
    const display   = displayEl.value.trim();
    const user      = userEl.value.trim();
    const pass      = passEl.value;

    if (!display) { shakeElement(displayEl); return; }
    if (!user)    { shakeElement(userEl);    return; }
    if (!pass)    { shakeElement(passEl);    return; }

    const btn = document.getElementById('btn-register');
    btn.textContent = 'Creando cuenta…';
    btn.disabled    = true;

    try {
      const { token, user: userData } = await api.register(user, display, pass);
      Storage.saveToken(token);
      this._onAuth(userData);
    } catch (err) {
      this._showError('auth-error-register', err.message);
      btn.textContent = 'Crear cuenta';
      btn.disabled    = false;
    }
  }

  _showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    setTimeout(() => el.classList.remove('is-visible'), 5000);
  }
}
