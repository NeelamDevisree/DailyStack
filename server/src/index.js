import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import habitsRoutes from './routes/habits.js';
import habitLogsRoutes from './routes/habit-logs.js';
import expensesRoutes from './routes/expenses.js';
import categoriesRoutes from './routes/categories.js';
import withdrawalsRoutes from './routes/withdrawals.js';
import carryOverRoutes from './routes/carry-over.js';
import monthSetupRoutes from './routes/month-setup.js';
import archiveRoutes from './routes/archive.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/habit-logs', habitLogsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/carry-over', carryOverRoutes);
app.use('/api/month-setup', monthSetupRoutes);
app.use('/api/archive', archiveRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`DailyStack server running on port ${PORT}`);
});
