import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { genId, genRoomCode, pickColor } from '../utils/helpers.js';

export default function roomsRouter(io) {
  const router = Router();

  // ── Shared helper: build full room response for a user ──
  function buildRoomData(roomId, userId) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    const participants = db
      .prepare('SELECT id, name, color, created_at FROM participants WHERE room_id = ? ORDER BY created_at')
      .all(roomId);
    const rawExpenses = db
      .prepare('SELECT * FROM expenses WHERE room_id = ? ORDER BY created_at')
      .all(roomId);
    const expenses = rawExpenses.map(e => {
      const rows = db
        .prepare('SELECT participant_id FROM expense_participants WHERE expense_id = ?')
        .all(e.id);
      return {
        id:             e.id,
        description:    e.description,
        amount:         e.amount,
        payerId:        e.payer_id,
        participantIds: rows.map(r => r.participant_id),
        icon:           e.icon,
        date:           e.date,
        created_at:     e.created_at,
      };
    });
    const member = db
      .prepare('SELECT id FROM participants WHERE room_id = ? AND user_id = ?')
      .get(roomId, userId);
    return {
      id:                   room.id,
      name:                 room.name,
      participants,
      expenses,
      currentParticipantId: member?.id ?? null,
    };
  }

  // POST /api/rooms — crear sala (requiere auth)
  router.post('/', requireAuth, (req, res) => {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });

    let id, attempts = 0;
    do {
      id = genRoomCode();
      attempts++;
    } while (db.prepare('SELECT 1 FROM rooms WHERE id = ?').get(id) && attempts < 10);

    db.prepare('INSERT INTO rooms (id, name, created_at) VALUES (?, ?, ?)')
      .run(id, name, Date.now());

    // Auto-add creator as first participant
    const participant = {
      id:         genId(),
      room_id:    id,
      user_id:    req.user.userId,
      name:       req.user.displayName,
      color:      pickColor(0),
      created_at: Date.now(),
    };
    db.prepare(
      'INSERT INTO participants (id, room_id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(participant.id, participant.room_id, participant.user_id, participant.name, participant.color, participant.created_at);

    res.status(201).json(buildRoomData(id, req.user.userId));
  });

  // GET /api/rooms/:id — obtener sala (requiere auth)
  router.get('/:id', requireAuth, (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = db.prepare('SELECT 1 FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    res.json(buildRoomData(roomId, req.user.userId));
  });

  // POST /api/rooms/:id/join — unirse a una sala (requiere auth)
  router.post('/:id/join', requireAuth, (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    // Already a member — return existing data
    const existing = db
      .prepare('SELECT id FROM participants WHERE room_id = ? AND user_id = ?')
      .get(roomId, req.user.userId);
    if (existing) {
      return res.json(buildRoomData(roomId, req.user.userId));
    }

    const count = db
      .prepare('SELECT COUNT(*) AS n FROM participants WHERE room_id = ?')
      .get(roomId).n;

    const participant = {
      id:         genId(),
      room_id:    roomId,
      user_id:    req.user.userId,
      name:       req.user.displayName,
      color:      pickColor(count),
      created_at: Date.now(),
    };

    db.prepare(
      'INSERT INTO participants (id, room_id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(participant.id, participant.room_id, participant.user_id, participant.name, participant.color, participant.created_at);

    const payload = {
      id:         participant.id,
      name:       participant.name,
      color:      participant.color,
      created_at: participant.created_at,
    };
    io.to(roomId).emit('participant:added', payload);

    res.status(201).json(buildRoomData(roomId, req.user.userId));
  });

  // DELETE /api/rooms/:id — reiniciar sala (borrar participantes y gastos)
  router.delete('/:id', requireAuth, (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = db.prepare('SELECT 1 FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    db.prepare('DELETE FROM expenses     WHERE room_id = ?').run(roomId);
    db.prepare('DELETE FROM participants WHERE room_id = ?').run(roomId);

    io.to(roomId).emit('room:reset');
    res.status(204).send();
  });

  return router;
}
