import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { genId } from '../utils/helpers.js';
import { JWT_SECRET, requireAuth } from '../middleware/authMiddleware.js';

export default function authRouter() {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    const { username, displayName, password } = req.body;

    if (!username?.trim())    return res.status(400).json({ error: 'El nombre de usuario es requerido' });
    if (!displayName?.trim()) return res.status(400).json({ error: 'El nombre para mostrar es requerido' });
    if (!password)            return res.status(400).json({ error: 'La contraseña es requerida' });
    if (password.length < 6)  return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const existing = db
      .prepare('SELECT 1 FROM users WHERE LOWER(username) = LOWER(?)')
      .get(username.trim());
    if (existing) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });

    const hash = await bcrypt.hash(password, 10);
    const user = {
      id:            genId(),
      username:      username.trim().toLowerCase(),
      display_name:  displayName.trim(),
      password_hash: hash,
      created_at:    Date.now(),
    };

    db.prepare(
      'INSERT INTO users (id, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, user.username, user.display_name, user.password_hash, user.created_at);

    const token = jwt.sign(
      { userId: user.id, username: user.username, displayName: user.display_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name },
    });
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const user = db
      .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
      .get(username.trim());
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign(
      { userId: user.id, username: user.username, displayName: user.display_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name },
    });
  });

  // GET /api/auth/me — verify token and return user
  router.get('/me', requireAuth, (req, res) => {
    res.json({
      userId:      req.user.userId,
      username:    req.user.username,
      displayName: req.user.displayName,
    });
  });

  // PUT /api/auth/change-password
  router.put('/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.userId);
    res.json({ ok: true });
  });

  return router;
}
