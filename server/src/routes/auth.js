import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { generateToken, authMiddleware } from '../auth.js';

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dailystack-dev-secret-change-in-production';

function getMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and password (min 6 chars) required' });
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const id = uuid();
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email.toLowerCase(), passwordHash);
  const token = generateToken(id);
  res.json({ user: { id, email: email.toLowerCase() }, token });
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

router.delete('/delete-account', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required to delete account' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
  res.json({ message: 'Account deleted successfully' });
});

// Forgot password — send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase());
  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }
  const resetToken = jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '15m' });
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  try {
    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'DailyStack — Reset Your Password',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 16px">Reset your password</h2>
          <p style="color:#555;line-height:1.5">You requested a password reset for your DailyStack account. Click the button below to set a new password. This link expires in 15 minutes.</p>
          <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#1A1714;color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">Reset Password</a>
          <p style="color:#999;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send reset email. Check SMTP configuration.' });
  }
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// Reset password — verify token and set new password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and new password (min 6 chars) required' });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'Reset link is invalid or has expired' });
  }
  if (payload.purpose !== 'password-reset') {
    return res.status(400).json({ error: 'Invalid token' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
  res.json({ message: 'Password has been reset successfully' });
});

export default router;
