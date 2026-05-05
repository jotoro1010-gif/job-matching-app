const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'エラーが発生しました');
  }
  return res.json();
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateAvatar: (avatar) => request('/users/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) }),
  getCandidates: () => request('/users/candidates'),
  swipe: (targetId, liked) => request('/swipe', { method: 'POST', body: JSON.stringify({ targetId, liked }) }),
  getMatches: () => request('/matches'),
  getMessages: (matchId) => request(`/matches/${matchId}/messages`),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
};
