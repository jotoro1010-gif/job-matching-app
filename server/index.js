const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin: CLIENT_URL } });

const SECRET = process.env.JWT_SECRET || 'shukatsu_secret_key';

app.set('io', io);
app.locals.userSockets = new Map(); // userId → socketId

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '5mb' })); // base64画像を受け取るため上限を緩和

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/swipe', require('./routes/swipe'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/notifications', require('./routes/notifications'));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const payload = jwt.verify(token, SECRET);
    socket.userId = payload.id;
    next();
  } catch {
    next(new Error('認証エラー'));
  }
});

io.on('connection', (socket) => {
  app.locals.userSockets.set(socket.userId, socket.id);

  socket.on('disconnect', () => {
    if (app.locals.userSockets.get(socket.userId) === socket.id) {
      app.locals.userSockets.delete(socket.userId);
    }
  });

  socket.on('join_match', (matchId) => {
    if (db.matches.isParticipant(matchId, socket.userId)) {
      socket.join(`match_${matchId}`);
    }
  });

  socket.on('send_message', ({ matchId, content }) => {
    if (!db.matches.isParticipant(matchId, socket.userId) || !content?.trim()) return;

    const { lastInsertRowid } = db.messages.create(matchId, socket.userId, content.trim());
    const msg = db.messages.findById(lastInsertRowid);
    const sender = db.users.findById(socket.userId);
    const payload = { ...msg, sender_name: sender?.name || '' };

    socket.to(`match_${matchId}`).emit('new_message', payload);
    socket.emit('new_message', payload);

    // 相手にメッセージ通知を送る
    const match = db.matches.findByUser(socket.userId).find(m => m.id === matchId);
    if (match) {
      const recipientId = match.user1_id === socket.userId ? match.user2_id : match.user1_id;
      db.notifications.create(recipientId, 'message');
      const count = db.notifications.getUnreadCount(recipientId);
      const recipientSocketId = app.locals.userSockets.get(recipientId);
      if (recipientSocketId) io.to(recipientSocketId).emit('notification', { count });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
