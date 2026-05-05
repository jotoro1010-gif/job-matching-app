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
    create({ email, password, role, name, bio, skills, location, salary_range, work_style, company_size, relocation, faculty, department, university, preferred_industries, industry, job_values, company_appeals }) {
      const data = load();
      if (data.users.find(u => u.email === email)) {
        throw Object.assign(new Error('Email already exists'), { code: 'UNIQUE' });
      }
      const id = nextId(data, 'users');
      const user = {
        id, email, password, role, name,
        bio: bio || '', skills: skills || '', location: location || '', avatar: '',
        salary_range: salary_range || '', work_style: work_style || '',
        company_size: company_size || '', relocation: relocation || '',
        faculty: faculty || '', department: department || '', university: university || '',
        preferred_industries: preferred_industries || [],
        industry: industry || '',
        job_values: job_values || [],
        company_appeals: company_appeals || [],
        created_at: new Date().toISOString(),
      };
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
      const me = data.users.find(u => u.id === userId) || {};
      const swipedIds = new Set(data.swipes.filter(s => s.swiper_id === userId).map(s => s.swiped_id));
      const superLikedMeIds = new Set(
        data.swipes.filter(s => s.swiped_id === userId && s.type === 'super').map(s => s.swiper_id)
      );
      return data.users
        .filter(u => u.role === oppositeRole && !swipedIds.has(u.id) && u.id !== userId)
        .map(c => {
          let score = Math.random() * 0.5;
          // 業界マッチ（最優先・高スコア）
          if (me.role === 'student') {
            const prefs = Array.isArray(me.preferred_industries) ? me.preferred_industries : [];
            if (prefs.length > 0 && c.industry && prefs.includes(c.industry)) score += 5;
          } else {
            const prefs = Array.isArray(c.preferred_industries) ? c.preferred_industries : [];
            if (prefs.length > 0 && me.industry && prefs.includes(me.industry)) score += 5;
          }
          // 企業選びの軸と企業の売りのマッチ（1件あたり+2点）
          if (me.role === 'student') {
            const axes = Array.isArray(me.job_values) ? me.job_values : [];
            const appeals = Array.isArray(c.company_appeals) ? c.company_appeals : [];
            score += axes.filter(v => appeals.includes(v)).length * 2;
          } else {
            const axes = Array.isArray(c.job_values) ? c.job_values : [];
            const appeals = Array.isArray(me.company_appeals) ? me.company_appeals : [];
            score += axes.filter(v => appeals.includes(v)).length * 2;
          }
          if (me.work_style && c.work_style && me.work_style === c.work_style) score += 3;
          if (me.salary_range && c.salary_range && me.salary_range === c.salary_range) score += 3;
          if (me.company_size && c.company_size && me.company_size === c.company_size) score += 2;
          if (me.role === 'student') {
            if (me.relocation === 'ok') score += 1;
            else if (me.relocation === 'no' && c.relocation === 'none') score += 2;
            else if (me.relocation === 'conditional' && c.relocation !== 'required') score += 1;
          } else {
            if (c.relocation === 'ok') score += 1;
            else if (me.relocation === 'none' && c.relocation === 'no') score += 2;
            else if (me.relocation === 'optional' && c.relocation !== 'no') score += 1;
          }
          return { c, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ c }) => ({
          id: c.id, name: c.name, bio: c.bio, skills: c.skills, location: c.location,
          avatar: c.avatar, role: c.role, salary_range: c.salary_range,
          work_style: c.work_style, company_size: c.company_size, relocation: c.relocation,
          faculty: c.faculty || '', department: c.department || '', university: c.university || '',
          industry: c.industry || '',
          preferred_industries: Array.isArray(c.preferred_industries) ? c.preferred_industries : [],
          job_values: Array.isArray(c.job_values) ? c.job_values : [],
          company_appeals: Array.isArray(c.company_appeals) ? c.company_appeals : [],
          superLikedMe: superLikedMeIds.has(c.id),
        }));
    },
  },

  swipes: {
    create(swiperId, swipedId, liked, type = 'normal') {
      const data = load();
      if (data.swipes.find(s => s.swiper_id === swiperId && s.swiped_id === swipedId)) return;
      const id = nextId(data, 'swipes');
      data.swipes.push({ id, swiper_id: swiperId, swiped_id: swipedId, liked, type, created_at: new Date().toISOString() });
      save(data);
    },
    hasMutualLike(myId, targetId) {
      return !!load().swipes.find(s => s.swiper_id === targetId && s.swiped_id === myId && s.liked === 1);
    },
    getSuperLikeCount(userId) {
      const today = new Date().toISOString().slice(0, 10);
      return load().swipes.filter(s => s.swiper_id === userId && s.type === 'super' && s.created_at.slice(0, 10) === today).length;
    },
  },

  matches: {
    findOrCreate(user1Id, user2Id) {
      const data = load();
      let match = data.matches.find(m => m.user1_id === user1Id && m.user2_id === user2Id);
      if (!match) {
        const id = nextId(data, 'matches');
        match = { id, user1_id: user1Id, user2_id: user2Id, status: 'active', created_at: new Date().toISOString() };
        data.matches.push(match);
        save(data);
      }
      return match;
    },
    findById(matchId) {
      return load().matches.find(m => m.id === matchId);
    },
    findByUser(userId) {
      return load().matches.filter(m => m.user1_id === userId || m.user2_id === userId);
    },
    isParticipant(matchId, userId) {
      const match = load().matches.find(m => m.id === matchId);
      return !!(match && (match.user1_id === userId || match.user2_id === userId));
    },
    updateStatus(matchId, status) {
      const data = load();
      const match = data.matches.find(m => m.id === matchId);
      if (match) { match.status = status; save(data); }
    },
  },

  messages: {
    create(matchId, senderId, content, type = 'text', extra = {}) {
      const data = load();
      const id = nextId(data, 'messages');
      const msg = { id, match_id: matchId, sender_id: senderId, content, type, created_at: new Date().toISOString(), ...extra };
      data.messages.push(msg);
      save(data);
      return { lastInsertRowid: id };
    },
    createSchedule(matchId, senderId, slots) {
      return this.create(matchId, senderId, '日程候補を提案しました', 'schedule', {
        slots, confirmed_slot: null, schedule_status: 'pending',
      });
    },
    confirmSchedule(messageId, slot) {
      const data = load();
      const msg = data.messages.find(m => m.id === messageId);
      if (msg && msg.type === 'schedule') { msg.confirmed_slot = slot; msg.schedule_status = 'confirmed'; save(data); }
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
