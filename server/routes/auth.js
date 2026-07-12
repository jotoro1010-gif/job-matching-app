const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { DEMO_STUDENT_EMAIL, DEMO_COMPANY_EMAIL } = require('../seedDemo');

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

// プロトタイプ用: メール・パスワード入力を省いて既存アカウントを選ぶだけでログインする
router.get('/accounts', (req, res) => {
  const accounts = db.users.list().map(({ id, name, role, avatar, bio, location }) => ({ id, name, role, avatar, bio, location }));
  res.json(accounts);
});

router.post('/login-as', (req, res) => {
  const { userId } = req.body;
  const user = db.users.findById(Number(userId));
  if (!user) return res.status(404).json({ error: 'アカウントが見つかりません' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// デモ用: 学生側・企業側それぞれ1つずつ、探す画面・メッセージが用意済みのアカウントにログインする
// サーバー起動時にensureDemoData()で作成される固定アカウント（メールアドレスで解決するためID非依存）
const DEMO_EMAILS = { student: DEMO_STUDENT_EMAIL, company: DEMO_COMPANY_EMAIL };

router.post('/demo-login', (req, res) => {
  const { role } = req.body;
  const email = DEMO_EMAILS[role];
  const user = email && db.users.findByEmail(email);
  if (!user) return res.status(400).json({ error: '無効なデモ種別です' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

module.exports = router;
