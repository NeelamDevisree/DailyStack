import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { month } = req.query;
  const db = getDb();
  if (month) {
    const row = db.prepare('SELECT * FROM month_setup WHERE user_id = ? AND month = ?').get(req.userId, month);
    res.json(row || null);
  } else {
    const rows = db.prepare('SELECT * FROM month_setup WHERE user_id = ? ORDER BY month DESC').all(req.userId);
    res.json(rows);
  }
});

router.post('/', (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'month required (YYYY-MM)' });
  const db = getDb();
  const id = uuid();
  try {
    db.prepare('INSERT INTO month_setup (id, user_id, month) VALUES (?, ?, ?)').run(id, req.userId, month);
    res.json({ id, user_id: req.userId, month });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Month already set up' });
    }
    throw e;
  }
});

export default router;
