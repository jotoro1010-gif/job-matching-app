const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'リクエストに失敗しました');
  return data;
}

export function generateWorld(premise, tone) {
  return request('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ premise, tone }),
  });
}

export function sendChatMessage(world, history, message) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ world, history, message }),
  });
}
