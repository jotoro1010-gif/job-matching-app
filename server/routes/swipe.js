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

router.post('/reset', authenticate, (req, res) => {
  db.swipes.resetByUser(req.userId);
  res.json({ ok: true });
});

router.post('/', authenticate, (req, res) => {
  const { targetId, liked, type = 'normal' } = req.body;

  if (type === 'super' && liked) {
    const count = db.swipes.getSuperLikeCount(req.userId);
    if (count >= 3) return res.status(429).json({ error: '本日のスーパーライク上限（3回）に達しました' });
  }

  db.swipes.create(req.userId, targetId, liked ? 1 : 0, type);

  if (!liked) return res.json({ matched: false });

  // スーパーライク通知
  if (type === 'super') {
    db.notifications.create(targetId, 'super_like');
    const io = req.app.get('io');
    const targetSocketId = req.app.locals.userSockets?.get(targetId);
    if (io && targetSocketId) {
      const me = db.users.findById(req.userId);
      io.to(targetSocketId).emit('super_like', { from: me });
    }
    emitNotification(req, targetId);
  }

  if (!db.swipes.hasMutualLike(req.userId, targetId)) return res.json({ matched: false, superLiked: type === 'super' });

  const [u1, u2] = [req.userId, targetId].sort((a, b) => a - b);
  const match = db.matches.findOrCreate(u1, u2);
  const partner = db.users.findById(targetId);

  db.notifications.create(req.userId, 'match');
  db.notifications.create(targetId, 'match');
  emitNotification(req, req.userId);
  emitNotification(req, targetId);

  res.json({ matched: true, match, partner });
});

module.exports = router;
