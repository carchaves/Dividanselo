import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { genId, pickIcon } from '../utils/helpers.js';

export default function expensesRouter(io) {
  const router = Router();

  // POST /api/rooms/:roomId/expenses
  router.post('/:roomId/expenses', requireAuth, (req, res) => {
    const roomId = req.params.roomId.toUpperCase();
    const { description, amount, payerId, participantIds } = req.body;

    if (!description?.trim())           return res.status(400).json({ error: 'La descripción es requerida' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    if (!payerId)                        return res.status(400).json({ error: 'El pagador es requerido' });
    if (!Array.isArray(participantIds) || !participantIds.length)
      return res.status(400).json({ error: 'Selecciona al menos un participante' });

    const room = db.prepare('SELECT 1 FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    const count = db
      .prepare('SELECT COUNT(*) AS n FROM expenses WHERE room_id = ?')
      .get(roomId).n;

    const expense = {
      id:          genId(),
      room_id:     roomId,
      description: description.trim(),
      amount:      Number(amount),
      payer_id:    payerId,
      icon:        pickIcon(count),
      date:        new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      created_at:  Date.now(),
    };

    const insertExpense = db.prepare(
      'INSERT INTO expenses (id, room_id, description, amount, payer_id, icon, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertLink = db.prepare(
      'INSERT INTO expense_participants (expense_id, participant_id) VALUES (?, ?)'
    );

    db.transaction(() => {
      insertExpense.run(
        expense.id, expense.room_id, expense.description, expense.amount,
        expense.payer_id, expense.icon, expense.date, expense.created_at
      );
      for (const pid of participantIds) insertLink.run(expense.id, pid);
    })();

    const payload = {
      id:             expense.id,
      description:    expense.description,
      amount:         expense.amount,
      payerId:        expense.payer_id,
      participantIds,
      icon:           expense.icon,
      date:           expense.date,
      created_at:     expense.created_at,
    };

    io.to(roomId).emit('expense:added', payload);
    res.status(201).json(payload);
  });

  // DELETE /api/rooms/:roomId/expenses/:expenseId
  router.delete('/:roomId/expenses/:expenseId', requireAuth, (req, res) => {
    const roomId    = req.params.roomId.toUpperCase();
    const expenseId = req.params.expenseId;

    const expense = db
      .prepare('SELECT 1 FROM expenses WHERE id = ? AND room_id = ?')
      .get(expenseId, roomId);
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });

    db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);

    io.to(roomId).emit('expense:removed', { expenseId });
    res.status(204).send();
  });

  return router;
}
