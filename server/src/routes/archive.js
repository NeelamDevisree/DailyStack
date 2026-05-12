import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM monthly_archive WHERE user_id = ? ORDER BY month DESC').all(req.userId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { month, daily_allowance, total_expenses, daily_savings, total_rewards, total_withdrawn, carry_over } = req.body;
  if (!month) return res.status(400).json({ error: 'month required' });
  const db = getDb();
  const id = uuid();
  try {
    db.prepare(`INSERT INTO monthly_archive (id, user_id, month, daily_allowance, total_expenses, daily_savings, total_rewards, total_withdrawn, carry_over)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.userId, month, daily_allowance || 0, total_expenses || 0, daily_savings || 0, total_rewards || 0, total_withdrawn || 0, carry_over || 0);
    const row = db.prepare('SELECT * FROM monthly_archive WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Archive for this month already exists' });
    }
    throw e;
  }
});

export default router;
