import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM habits WHERE user_id = ? AND active = 1').all(req.userId);
  res.json(rows.map(r => ({ ...r, days: JSON.parse(r.days), active: !!r.active })));
});

router.post('/', (req, res) => {
  const { name, days } = req.body;
  if (!name || !days || !Array.isArray(days) || days.length === 0) {
    return res.status(400).json({ error: 'name and days required' });
  }
  const db = getDb();
  const activeCount = db.prepare('SELECT COUNT(*) as cnt FROM habits WHERE user_id = ? AND active = 1').get(req.userId).cnt;
  if (activeCount >= 5) {
    return res.status(400).json({ error: 'Maximum 5 active habits allowed' });
  }
  const id = uuid();
  db.prepare('INSERT INTO habits (id, user_id, name, days, active) VALUES (?, ?, ?, ?, 1)')
    .run(id, req.userId, name.trim(), JSON.stringify(days.sort()));
  const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  res.json({ ...row, days: JSON.parse(row.days), active: !!row.active });
});

router.post('/bulk', (req, res) => {
  const { habits } = req.body;
  if (!habits || !Array.isArray(habits)) {
    return res.status(400).json({ error: 'habits array required' });
  }
  const db = getDb();
  const insert = db.prepare('INSERT INTO habits (id, user_id, name, days, active) VALUES (?, ?, ?, ?, 1)');
  const tx = db.transaction(() => {
    for (const h of habits) {
      insert.run(uuid(), req.userId, h.name.trim(), JSON.stringify((h.days || [0,1,2,3,4,5,6]).sort()));
    }
  });
  tx();
  const rows = db.prepare('SELECT * FROM habits WHERE user_id = ? AND active = 1').all(req.userId);
  res.json(rows.map(r => ({ ...r, days: JSON.parse(r.days), active: !!r.active })));
});

router.put('/:id/deactivate', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE habits SET active = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

router.put('/deactivate-bulk', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array required' });
  }
  const db = getDb();
  const stmt = db.prepare('UPDATE habits SET active = 0 WHERE id = ? AND user_id = ?');
  const tx = db.transaction(() => {
    for (const id of ids) stmt.run(id, req.userId);
  });
  tx();
  res.json({ success: true });
});

export default router;
