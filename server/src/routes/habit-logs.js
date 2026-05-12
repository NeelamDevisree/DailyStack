import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { from } = req.query;
  const db = getDb();
  let rows;
  if (from) {
    rows = db.prepare('SELECT * FROM habit_logs WHERE user_id = ? AND date >= ? ORDER BY date DESC').all(req.userId, from);
  } else {
    rows = db.prepare('SELECT * FROM habit_logs WHERE user_id = ? ORDER BY date DESC').all(req.userId);
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { habit_id, date, status } = req.body;
  if (!habit_id || !date || !status) {
    return res.status(400).json({ error: 'habit_id, date, and status required' });
  }
  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO habit_logs (id, user_id, habit_id, date, status) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, habit_id, date, status);
  const row = db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(id);
  res.json(row);
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  const db = getDb();
  db.prepare('UPDATE habit_logs SET status = ? WHERE id = ? AND user_id = ?').run(status, req.params.id, req.userId);
  const row = db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM habit_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

export default router;
