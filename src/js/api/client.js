const BASE = '/api';

function getToken() {
  return localStorage.getItem('dividanselo_token');
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (username, displayName, password) => request('POST', '/auth/register', { username, displayName, password }),
  login:    (username, password)              => request('POST', '/auth/login',    { username, password }),
  me:       ()                                => request('GET',  '/auth/me'),

  // Rooms
  createRoom:        (name)              => request('POST',   '/rooms',                            { name }),
  getRoom:           (id)                => request('GET',    `/rooms/${id}`),
  joinRoom:          (id)                => request('POST',   `/rooms/${id}/join`),
  resetRoom:         (roomId)            => request('DELETE', `/rooms/${roomId}`),

  // Participants
  removeParticipant: (roomId, pid)       => request('DELETE', `/rooms/${roomId}/participants/${pid}`),

  // Expenses
  addExpense:        (roomId, data)      => request('POST',   `/rooms/${roomId}/expenses`, data),
  removeExpense:     (roomId, expenseId) => request('DELETE', `/rooms/${roomId}/expenses/${expenseId}`),
};
