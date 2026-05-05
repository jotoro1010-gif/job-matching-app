const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  res.json(db.users.findById(req.userId));
});

router.put('/me', authenticate, (req, res) => {
  const { name, bio, skills, location } = req.body;
  db.users.update(req.userId, { name, bio, skills, location });
  res.json({ ok: true });
});

router.put('/avatar', authenticate, (req, res) => {
  const { avatar } = req.body;
  if (!avatar || !avatar.startsWith('data:image/')) {
    return res.status(400).json({ error: '無効な画像データです' });
  }
  if (avatar.length > 4 * 1024 * 1024) {
    return res.status(400).json({ error: '画像サイズが大きすぎます（3MB以下）' });
  }
  db.users.update(req.userId, { avatar });
  res.json({ ok: true, avatar });
});

router.get('/candidates', authenticate, (req, res) => {
  const me = db.users.findById(req.userId);
  const oppositeRole = me.role === 'student' ? 'company' : 'student';
  res.json(db.users.getCandidates(req.userId, oppositeRole));
});

module.exports = router;
