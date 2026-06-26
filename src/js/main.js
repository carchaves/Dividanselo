import { State }            from './core/state.js';
import { Storage }          from './core/storage.js';
import { initSocket, disconnectSocket } from './core/socket.js';
import { api }              from './api/client.js';
import { AuthPanel }        from './components/AuthPanel.js';
import { LobbyPanel }       from './components/LobbyPanel.js';
import { TabManager }       from './components/TabManager.js';
import { ParticipantsPanel } from './components/ParticipantsPanel.js';
import { ExpensesPanel }     from './components/ExpensesPanel.js';
import { SettlementPanel }   from './components/SettlementPanel.js';

const appEl = document.getElementById('app');

async function bootstrap() {
  // ── 1. Verify authentication ──
  const token = Storage.loadToken();
  if (!token) {
    showAuth();
    return;
  }

  let user;
  try {
    user = await api.me();
  } catch {
    Storage.clearAll();
    showAuth();
    return;
  }

  // ── 2. Try to load a room ──
  const urlCode   = new URLSearchParams(window.location.search).get('room');
  const savedCode = Storage.loadRoomId();
  const roomCode  = urlCode ?? savedCode;

  if (roomCode) {
    try {
      let roomData = await api.getRoom(roomCode.toUpperCase());
      // Auto-join if the user is not yet a member (e.g. came from a shared link)
      if (!roomData.currentParticipantId) {
        roomData = await api.joinRoom(roomCode.toUpperCase());
      }
      Storage.saveRoomId(roomData.id);
      loadApp(roomData, user);
      return;
    } catch {
      Storage.clearRoomId();
      history.replaceState({}, '', window.location.pathname);
    }
  }

  showLobby(user);
}

function showAuth() {
  const auth = new AuthPanel({
    onAuth(userData) {
      bootstrap();
    },
  });
  appEl.innerHTML = auth.render();
  auth.mount();
}

function showLobby(user) {
  const lobby = new LobbyPanel({
    user,
    onJoin(roomData) {
      Storage.saveRoomId(roomData.id);
      loadApp(roomData, user);
    },
  });
  appEl.innerHTML = lobby.render();
  lobby.mount();
}

function loadApp(roomData, user) {
  State.init(roomData, user);
  initSocket(roomData.id);

  appEl.innerHTML = `
    <header id="app-header">
      <div class="header-content">
        <h1 class="app-title">✂️ Dividanselo</h1>
        <p class="app-subtitle">Divide gastos entre amigos sin dramas</p>
      </div>
      <div class="room-header">
        <span class="room-header__name">${escHtml(roomData.name)}</span>
        <div class="room-header__actions">
          <button class="room-code-badge" id="copy-code-btn" title="Copiar código para invitar">
            <span class="room-code-badge__label">Código:</span>
            <span class="room-code-badge__code">${roomData.id}</span>
            <span class="room-code-badge__icon">📋</span>
          </button>
          <button class="room-leave-btn" id="btn-leave-room" title="Salir del grupo">Salir</button>
          <button class="room-logout-btn" id="btn-logout" title="Cerrar sesión">
            ${escHtml(user.displayName)} ↩
          </button>
        </div>
      </div>
      <nav id="tab-nav" class="tab-nav" role="tablist" aria-label="Secciones"></nav>
    </header>
    <main id="main-content" role="main"></main>
  `;

  // Copy room code to clipboard
  document.getElementById('copy-code-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(roomData.id).then(() => {
      const icon = document.querySelector('.room-code-badge__icon');
      icon.textContent = '✅';
      setTimeout(() => { icon.textContent = '📋'; }, 1500);
    });
  });

  // Leave room (remove self as participant)
  document.getElementById('btn-leave-room').addEventListener('click', async () => {
    if (!confirm('¿Salir del grupo? Tus gastos como pagador serán eliminados.')) return;
    const { room, currentParticipantId } = State.get();
    try {
      await api.removeParticipant(room.id, currentParticipantId);
    } catch { /* ignore */ }
    leaveRoom();
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    Storage.clearAll();
    disconnectSocket();
    history.replaceState({}, '', window.location.pathname);
    showAuth();
  });

  const mainContent = document.getElementById('main-content');
  const panels = {
    grupo:    new ParticipantsPanel(),
    gastos:   new ExpensesPanel(),
    liquidar: new SettlementPanel(),
  };

  mainContent.innerHTML =
    panels.grupo.render() +
    panels.gastos.render() +
    panels.liquidar.render();

  Object.values(panels).forEach(p => p.mount());

  const tabs = new TabManager({
    onSwitch(tabId) { panels[tabId]?.onActivate?.(); },
  });
  tabs.mount();
}

function leaveRoom() {
  disconnectSocket();
  Storage.clearRoomId();
  history.replaceState({}, '', window.location.pathname);
  const token = Storage.loadToken();
  // Re-derive user from token without another API call
  api.me().then(user => showLobby(user)).catch(() => { Storage.clearToken(); showAuth(); });
}

function escHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

bootstrap();
