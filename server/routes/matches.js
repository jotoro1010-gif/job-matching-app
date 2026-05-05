const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const matches = db.matches.findByUser(req.userId);
  const result = matches.map(m => {
    const partnerId = m.user1_id === req.userId ? m.user2_id : m.user1_id;
    const partner = db.users.findById(partnerId);
    const lastMessage = db.messages.getLastForMatch(m.id);
    return { ...m, partner, lastMessage };
  });
  res.json(result);
});

router.get('/:matchId/messages', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  if (!db.matches.isParticipant(matchId, req.userId)) {
    return res.status(403).json({ error: 'アクセス権がありません' });
  }
  const messages = db.messages.findByMatch(matchId).map(msg => {
    const sender = db.users.findById(msg.sender_id);
    return { ...msg, sender_name: sender?.name || '' };
  });
  res.json(messages);
});

module.exports = router;
