const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware');

const router = express.Router();

function emitNotification(req, userId) {
  const io = req.app.get('io');
  const userSockets = req.app.locals.userSockets;
  const count = db.notifications.getUnreadCount(userId);
  const socketId = userSockets?.get(userId);
  if (io && socketId) io.to(socketId).emit('notification', { count });
}

router.post('/', authenticate, (req, res) => {
  const { targetId, liked } = req.body;

  db.swipes.create(req.userId, targetId, liked ? 1 : 0);

  if (!liked) return res.json({ matched: false });

  if (!db.swipes.hasMutualLike(req.userId, targetId)) return res.json({ matched: false });

  const [u1, u2] = [req.userId, targetId].sort((a, b) => a - b);
  const match = db.matches.findOrCreate(u1, u2);
  const partner = db.users.findById(targetId);

  // マッチ通知を両ユーザーに作成・送信
  db.notifications.create(req.userId, 'match');
  db.notifications.create(targetId, 'match');
  emitNotification(req, req.userId);
  emitNotification(req, targetId);

  res.json({ matched: true, match, partner });
});

module.exports = router;
