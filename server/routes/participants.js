import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { genId, pickColor } from '../utils/helpers.js';

export default function participantsRouter(io) {
  const router = Router();

  // DELETE /api/rooms/:roomId/participants/:participantId
  router.delete('/:roomId/participants/:participantId', requireAuth, (req, res) => {
    const roomId        = req.params.roomId.toUpperCase();
    const participantId = req.params.participantId;

    const participant = db
      .prepare('SELECT * FROM participants WHERE id = ? AND room_id = ?')
      .get(participantId, roomId);
    if (!participant) return res.status(404).json({ error: 'Participante no encontrado' });

    // Delete expenses where this participant was the payer
    db.prepare('DELETE FROM expenses WHERE payer_id = ? AND room_id = ?').run(participantId, roomId);

    // Delete expenses that now have 0 remaining participants
    const orphaned = db.prepare(`
      SELECT e.id FROM expenses e
      WHERE e.room_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM expense_participants ep WHERE ep.expense_id = e.id
        )
    `).all(roomId);
    orphaned.forEach(({ id }) => db.prepare('DELETE FROM expenses WHERE id = ?').run(id));

    db.prepare('DELETE FROM participants WHERE id = ?').run(participantId);

    io.to(roomId).emit('participant:removed', { participantId });
    res.status(204).send();
  });

  return router;
}
