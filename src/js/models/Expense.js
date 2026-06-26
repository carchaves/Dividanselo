import { genId } from '../utils/dom.js';

const ICONS = ['🛒', '🍕', '🚕', '🎬', '🍺', '🏠', '✈️', '🎮', '💊', '🛵', '🎉', '☕'];

export function createExpense({ description, amount, payerId, participantIds }, existingCount = 0) {
  return {
    id: genId(),
    description: description.trim(),
    amount: parseFloat(amount),
    payerId,
    participantIds: [...participantIds],
    icon: ICONS[existingCount % ICONS.length],
    createdAt: Date.now(),
    date: new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }),
  };
}
