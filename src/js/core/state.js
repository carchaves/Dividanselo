const DEFAULT_STATE = {
  user:                 null,   // { userId, username, displayName }
  room:                 null,   // { id, name }
  participants:         [],
  expenses:             [],
  currentParticipantId: null,
};

let _state = { ...DEFAULT_STATE };
const _listeners = new Map();

export const State = {
  get() {
    return _state;
  },

  init(roomData, user) {
    _state = {
      user,
      room:                 { id: roomData.id, name: roomData.name },
      participants:         roomData.participants ?? [],
      expenses:             roomData.expenses     ?? [],
      currentParticipantId: roomData.currentParticipantId ?? null,
    };
    this._emit('change', _state);
  },

  set(updater) {
    _state = { ..._state, ...updater(_state) };
    this._emit('change', _state);
  },

  reset() {
    _state = { ...DEFAULT_STATE };
    this._emit('change', _state);
  },

  on(event, listener) {
    if (!_listeners.has(event)) _listeners.set(event, []);
    _listeners.get(event).push(listener);
    return () => this.off(event, listener);
  },

  off(event, listener) {
    if (!_listeners.has(event)) return;
    _listeners.set(event, _listeners.get(event).filter(l => l !== listener));
  },

  _emit(event, data) {
    (_listeners.get(event) ?? []).forEach(fn => fn(data));
  },
};
