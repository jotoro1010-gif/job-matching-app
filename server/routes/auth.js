const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'shukatsu_secret_key';

router.post('/register', async (req, res) => {
  const { email, password, role, name, bio, skills, location } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: '必須項目を入力してください' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { lastInsertRowid } = db.users.create({ email, password: hash, role, name, bio, skills, location });
    const token = jwt.sign({ id: lastInsertRowid, role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: lastInsertRowid, email, role, name } });
  } catch (e) {
    if (e.code === 'UNIQUE') return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    console.error(e);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

module.exports = router;
