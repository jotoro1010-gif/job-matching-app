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

router.put('/:matchId/status', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { status } = req.body;
  const valid = ['active', 'document_review', 'interview_scheduling', 'first_interview', 'second_interview', 'final_interview', 'offer', 'rejected', 'withdrawn'];
  if (!valid.includes(status)) return res.status(400).json({ error: '無効なステータスです' });
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  db.matches.updateStatus(matchId, status);
  res.json({ ok: true });
});

router.post('/:matchId/schedules', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { slots } = req.body;
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ error: '候補日時を入力してください' });
  const { lastInsertRowid } = db.messages.createSchedule(matchId, req.userId, slots);
  const msg = db.messages.findById(lastInsertRowid);
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('new_message', payload);
  res.json(payload);
});

router.put('/:matchId/schedules/:messageId/confirm', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const messageId = parseInt(req.params.messageId);
  const { slot } = req.body;
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  db.messages.confirmSchedule(messageId, slot);
  const msg = db.messages.findById(messageId);
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('schedule_updated', payload);
  res.json(payload);
});

module.exports = router;
