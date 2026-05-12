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
    rows = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? AND date >= ? ORDER BY date DESC').all(req.userId, from);
  } else {
    rows = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY date DESC').all(req.userId);
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { amount, date } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }
  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO withdrawals (id, user_id, amount, date) VALUES (?, ?, ?, ?)')
    .run(id, req.userId, Number(amount), date || new Date().toISOString().split('T')[0]);
  const row = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
  res.json(row);
});

export default router;
