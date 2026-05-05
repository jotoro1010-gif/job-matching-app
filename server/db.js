const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) {
    return {
      users: [], swipes: [], matches: [], messages: [], notifications: [],
      counters: { users: 0, swipes: 0, matches: 0, messages: 0, notifications: 0 },
    };
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  // 既存データの後方互換
  if (!data.notifications) data.notifications = [];
  if (!data.counters.notifications) data.counters.notifications = 0;
  return data;
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data, table) {
  data.counters[table] = (data.counters[table] || 0) + 1;
  return data.counters[table];
}

const db = {
  users: {
    create({ email, password, role, name, bio, skills, location }) {
      const data = load();
      if (data.users.find(u => u.email === email)) {
        throw Object.assign(new Error('Email already exists'), { code: 'UNIQUE' });
      }
      const id = nextId(data, 'users');
      const user = { id, email, password, role, name, bio: bio || '', skills: skills || '', location: location || '', avatar: '', created_at: new Date().toISOString() };
      data.users.push(user);
      save(data);
      return { lastInsertRowid: id };
    },
    findByEmail(email) {
      return load().users.find(u => u.email === email);
    },
    findById(id) {
      const u = load().users.find(u => u.id === id);
      if (!u) return undefined;
      const { password, ...rest } = u;
      return rest;
    },
    update(id, fields) {
      const data = load();
      const user = data.users.find(u => u.id === id);
      if (user) Object.assign(user, fields);
      save(data);
    },
    getCandidates(userId, oppositeRole) {
      const data = load();
      const swipedIds = new Set(data.swipes.filter(s => s.swiper_id === userId).map(s => s.swiped_id));
      const candidates = data.users.filter(u => u.role === oppositeRole && !swipedIds.has(u.id) && u.id !== userId);
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      return candidates.slice(0, 10).map(({ id, name, bio, skills, location, avatar, role }) => ({ id, name, bio, skills, location, avatar, role }));
    },
  },

  swipes: {
    create(swiperId, swipedId, liked) {
      const data = load();
      if (data.swipes.find(s => s.swiper_id === swiperId && s.swiped_id === swipedId)) return;
      const id = nextId(data, 'swipes');
      data.swipes.push({ id, swiper_id: swiperId, swiped_id: swipedId, liked, created_at: new Date().toISOString() });
      save(data);
    },
    hasMutualLike(myId, targetId) {
      return !!load().swipes.find(s => s.swiper_id === targetId && s.swiped_id === myId && s.liked === 1);
    },
  },

  matches: {
    findOrCreate(user1Id, user2Id) {
      const data = load();
      let match = data.matches.find(m => m.user1_id === user1Id && m.user2_id === user2Id);
      if (!match) {
        const id = nextId(data, 'matches');
        match = { id, user1_id: user1Id, user2_id: user2Id, created_at: new Date().toISOString() };
        data.matches.push(match);
        save(data);
      }
      return match;
    },
    findByUser(userId) {
      return load().matches.filter(m => m.user1_id === userId || m.user2_id === userId);
    },
    isParticipant(matchId, userId) {
      const match = load().matches.find(m => m.id === matchId);
      return !!(match && (match.user1_id === userId || match.user2_id === userId));
    },
  },

  messages: {
    create(matchId, senderId, content) {
      const data = load();
      const id = nextId(data, 'messages');
      const msg = { id, match_id: matchId, sender_id: senderId, content, created_at: new Date().toISOString() };
      data.messages.push(msg);
      save(data);
      return { lastInsertRowid: id };
    },
    findById(id) {
      return load().messages.find(m => m.id === id);
    },
    findByMatch(matchId) {
      return load().messages
        .filter(m => m.match_id === matchId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    getLastForMatch(matchId) {
      const msgs = load().messages.filter(m => m.match_id === matchId);
      return msgs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
    },
  },

  notifications: {
    create(userId, type) {
      const data = load();
      const id = nextId(data, 'notifications');
      data.notifications.push({ id, user_id: userId, type, read: false, created_at: new Date().toISOString() });
      save(data);
    },
    getUnreadCount(userId) {
      return load().notifications.filter(n => n.user_id === userId && !n.read).length;
    },
    markAllRead(userId) {
      const data = load();
      data.notifications.filter(n => n.user_id === userId && !n.read).forEach(n => { n.read = true; });
      save(data);
    },
  },
};

module.exports = db;
