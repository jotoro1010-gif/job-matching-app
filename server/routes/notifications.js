const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/unread-count', authenticate, (req, res) => {
  res.json({ count: db.notifications.getUnreadCount(req.userId) });
});

router.post('/read-all', authenticate, (req, res) => {
  db.notifications.markAllRead(req.userId);
  res.json({ ok: true });
});

module.exports = router;
