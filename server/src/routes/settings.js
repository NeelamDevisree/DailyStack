import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.userId);
  res.json(row || null);
});

router.put('/', (req, res) => {
  const { daily_allowance } = req.body;
  if (daily_allowance == null || isNaN(daily_allowance) || Number(daily_allowance) <= 0) {
    return res.status(400).json({ error: 'Valid daily_allowance required' });
  }
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE settings SET daily_allowance = ?, last_changed_at = ?, updated_at = ? WHERE user_id = ?')
      .run(Number(daily_allowance), now, now, req.userId);
  } else {
    db.prepare('INSERT INTO settings (id, user_id, daily_allowance, last_changed_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), req.userId, Number(daily_allowance), now, now);
  }
  const row = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.userId);
  res.json(row);
});

export default router;
