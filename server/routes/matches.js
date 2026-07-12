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
  const { status, interviewRound } = req.body;
  const valid = ['active', 'interview', 'offer'];
  if (!valid.includes(status)) return res.status(400).json({ error: '無効なステータスです' });
  if (req.userRole !== 'company') return res.status(403).json({ error: '企業アカウントのみ変更できます' });
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  const match = db.matches.findById(matchId);
  if (match?.status === 'withdrawn') return res.status(400).json({ error: '辞退済みのため変更できません' });
  const extra = status === 'interview' ? { interview_round: Number(interviewRound) || 1 } : {};
  db.matches.updateStatus(matchId, status, extra);
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('match_updated', { id: matchId, status, ...extra });
  res.json({ ok: true });
});

router.post('/:matchId/invitations', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { title, details, slots } = req.body;
  if (req.userRole !== 'company') return res.status(403).json({ error: '企業アカウントのみ送信できます' });
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  if (!title?.trim()) return res.status(400).json({ error: 'タイトルを入力してください' });
  if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ error: '希望日時を入力してください' });
  const match = db.matches.findById(matchId);
  if (match?.status === 'withdrawn') return res.status(400).json({ error: 'このマッチはメッセージを送信できません' });
  const { lastInsertRowid } = db.messages.createInvitation(matchId, req.userId, title.trim(), details, slots);
  const msg = db.messages.findById(lastInsertRowid);
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('new_message', payload);
  res.json(payload);
});

router.post('/:matchId/interview-requests', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { requestType, comment, slots } = req.body;
  if (req.userRole !== 'student') return res.status(403).json({ error: '学生アカウントのみ送信できます' });
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  if (!['formal', 'casual'].includes(requestType)) return res.status(400).json({ error: '希望内容を選択してください' });
  if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ error: '希望日時を入力してください' });
  const match = db.matches.findById(matchId);
  if (match?.status === 'withdrawn') return res.status(400).json({ error: 'このマッチはメッセージを送信できません' });
  const { lastInsertRowid } = db.messages.createInterviewRequest(matchId, req.userId, requestType, comment, slots);
  const msg = db.messages.findById(lastInsertRowid);
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('new_message', payload);
  res.json(payload);
});

router.put('/:matchId/proposals/:messageId/confirm', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const messageId = parseInt(req.params.messageId);
  const { slot } = req.body;
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  const msg = db.messages.confirmProposal(messageId, slot);
  if (!msg) return res.status(400).json({ error: '対象のメッセージが見つかりません' });
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('proposal_updated', payload);
  res.json(payload);
});

router.put('/:matchId/proposals/:messageId/decline', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const messageId = parseInt(req.params.messageId);
  const { reason } = req.body;
  if (req.userRole !== 'student') return res.status(403).json({ error: '学生アカウントのみお断りできます' });
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  if (!reason?.trim()) return res.status(400).json({ error: '理由を入力してください' });
  const msg = db.messages.declineProposal(messageId, reason.trim());
  if (!msg) return res.status(400).json({ error: '対象のお誘いが見つかりません' });
  db.matches.updateStatus(matchId, 'withdrawn');
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('proposal_updated', payload);
  io?.to(`match_${matchId}`).emit('match_updated', { id: matchId, status: 'withdrawn' });
  res.json(payload);
});

router.put('/:matchId/proposals/:messageId/counter', authenticate, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const messageId = parseInt(req.params.messageId);
  const { slots } = req.body;
  if (!db.matches.isParticipant(matchId, req.userId)) return res.status(403).json({ error: 'アクセス権がありません' });
  if (!Array.isArray(slots) || slots.length === 0 || slots.length > 3) return res.status(400).json({ error: '候補日時は1〜3件で入力してください' });
  const msg = db.messages.counterProposal(messageId, req.userId, slots);
  if (!msg) return res.status(400).json({ error: '対象のメッセージが見つかりません' });
  const sender = db.users.findById(req.userId);
  const payload = { ...msg, sender_name: sender?.name || '' };
  const io = req.app.get('io');
  io?.to(`match_${matchId}`).emit('proposal_updated', payload);
  res.json(payload);
});

module.exports = router;
