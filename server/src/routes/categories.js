import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM custom_categories WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = getDb();
  const id = uuid();
  try {
    db.prepare('INSERT INTO custom_categories (id, user_id, name) VALUES (?, ?, ?)').run(id, req.userId, name.trim());
    const row = db.prepare('SELECT * FROM custom_categories WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    throw e;
  }
});

export default router;
