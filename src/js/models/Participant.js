import { genId } from '../utils/dom.js';

const PALETTE = [
  '#6c47ff', '#f59e0b', '#22c55e', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316',
];

let _colorIndex = 0;

export function createParticipant({ name }, existingCount = 0) {
  return {
    id: genId(),
    name: name.trim(),
    color: PALETTE[existingCount % PALETTE.length],
    createdAt: Date.now(),
  };
}

export function resetColorIndex() {
  _colorIndex = 0;
}
