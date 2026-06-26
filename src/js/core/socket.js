import { State } from './state.js';

let _socket = null;

export function initSocket(roomId) {
  // `io` is available globally via the socket.io script in index.html
  _socket = io();

  _socket.on('connect', () => {
    _socket.emit('join:room', roomId);
  });

  _socket.on('participant:added', participant => {
    State.set(s => ({ participants: [...s.participants, participant] }));
  });

  _socket.on('participant:removed', ({ participantId }) => {
    State.set(s => ({
      participants: s.participants.filter(p => p.id !== participantId),
      expenses: s.expenses
        .map(e => ({
          ...e,
          participantIds: e.participantIds.filter(id => id !== participantId),
        }))
        .filter(e => e.payerId !== participantId && e.participantIds.length > 0),
    }));
  });

  _socket.on('expense:added', expense => {
    State.set(s => ({ expenses: [...s.expenses, expense] }));
  });

  _socket.on('expense:removed', ({ expenseId }) => {
    State.set(s => ({ expenses: s.expenses.filter(e => e.id !== expenseId) }));
  });

  _socket.on('room:reset', () => {
    State.set(() => ({ participants: [], expenses: [] }));
  });

  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}
