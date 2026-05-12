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
    rows = db.prepare('SELECT * FROM expenses WHERE user_id = ? AND logged_at >= ? ORDER BY logged_at DESC').all(req.userId, from);
  } else {
    rows = db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY logged_at DESC').all(req.userId);
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { description, amount, category, payment_mode } = req.body;
  if (!description || !amount || !category || !payment_mode) {
    return res.status(400).json({ error: 'description, amount, category, payment_mode required' });
  }
  if (!['Account', 'Cash', 'Credit Card'].includes(payment_mode)) {
    return res.status(400).json({ error: 'Invalid payment mode' });
  }
  const db = getDb();
  const id = uuid();
  const logged_at = new Date().toISOString();
  db.prepare('INSERT INTO expenses (id, user_id, description, amount, category, payment_mode, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.userId, description.trim(), Number(amount), category, payment_mode, logged_at);
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  res.json(row);
});

export default router;
