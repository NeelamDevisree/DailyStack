import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM carry_over WHERE user_id = ?').get(req.userId);
  res.json(row || { amount: 0 });
});

router.put('/', (req, res) => {
  const { amount } = req.body;
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM carry_over WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE carry_over SET amount = ?, updated_at = ? WHERE user_id = ?')
      .run(Number(amount), now, req.userId);
  } else {
    db.prepare('INSERT INTO carry_over (id, user_id, amount, updated_at) VALUES (?, ?, ?, ?)')
      .run(uuid(), req.userId, Number(amount), now);
  }
  const row = db.prepare('SELECT * FROM carry_over WHERE user_id = ?').get(req.userId);
  res.json(row);
});

export default router;
