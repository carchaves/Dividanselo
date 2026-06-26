const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ICONS      = ['🛒','🍕','🚕','🎬','🍺','🏠','✈️','🎮','💊','🛵','🎉','☕'];
const PALETTE    = ['#6c47ff','#f59e0b','#22c55e','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316'];

export function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function genRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return code;
}

export function pickColor(index) {
  return PALETTE[index % PALETTE.length];
}

export function pickIcon(index) {
  return ICONS[index % ICONS.length];
}
