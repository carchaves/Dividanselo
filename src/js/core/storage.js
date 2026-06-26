const TOKEN_KEY = 'dividanselo_token';
const ROOM_KEY  = 'dividanselo_room';

export const Storage = {
  saveToken(token)  { localStorage.setItem(TOKEN_KEY, token); },
  loadToken()       { return localStorage.getItem(TOKEN_KEY); },
  clearToken()      { localStorage.removeItem(TOKEN_KEY); },

  saveRoomId(id)    { localStorage.setItem(ROOM_KEY, id); },
  loadRoomId()      { return localStorage.getItem(ROOM_KEY); },
  clearRoomId()     { localStorage.removeItem(ROOM_KEY); },

  clearAll()        { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ROOM_KEY); },
};
