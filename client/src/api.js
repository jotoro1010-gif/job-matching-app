const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

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
  getAccounts: () => request('/auth/accounts'),
  loginAs: (userId) => request('/auth/login-as', { method: 'POST', body: JSON.stringify({ userId }) }),
  demoLogin: (role) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateAvatar: (avatar) => request('/users/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) }),
  getCandidates: () => request('/users/candidates'),
  swipe: (targetId, liked, type = 'normal') => request('/swipe', { method: 'POST', body: JSON.stringify({ targetId, liked, type }) }),
  resetSwipes: () => request('/swipe/reset', { method: 'POST' }),
  getMatches: () => request('/matches'),
  getMessages: (matchId) => request(`/matches/${matchId}/messages`),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
  getSuperLikeCount: () => request('/users/super-like-count'),
  updateMatchStatus: (matchId, status, interviewRound) => request(`/matches/${matchId}/status`, { method: 'PUT', body: JSON.stringify({ status, interviewRound }) }),
  sendInvitation: (matchId, data) => request(`/matches/${matchId}/invitations`, { method: 'POST', body: JSON.stringify(data) }),
  sendInterviewRequest: (matchId, data) => request(`/matches/${matchId}/interview-requests`, { method: 'POST', body: JSON.stringify(data) }),
  confirmProposal: (matchId, messageId, slot) => request(`/matches/${matchId}/proposals/${messageId}/confirm`, { method: 'PUT', body: JSON.stringify({ slot }) }),
  declineProposal: (matchId, messageId, reason) => request(`/matches/${matchId}/proposals/${messageId}/decline`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  counterProposal: (matchId, messageId, slots) => request(`/matches/${matchId}/proposals/${messageId}/counter`, { method: 'PUT', body: JSON.stringify({ slots }) }),
};
