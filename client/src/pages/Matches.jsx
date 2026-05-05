import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function Matches() {
  const { setUnreadCount } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));

    // ページを開いたら通知を既読にしてバッジをリセット
    api.markAllRead().then(() => setUnreadCount(0)).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">マッチング一覧</h1>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <span className="text-6xl mb-4">💔</span>
          <p className="text-lg font-medium">まだマッチングがありません</p>
          <p className="text-sm mt-1">スワイプしてマッチングしましょう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <Link
              key={m.id}
              to={`/matches/${m.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {m.partner?.avatar
                  ? <img src={m.partner.avatar} alt={m.partner.name} className="w-full h-full object-cover" />
                  : <span>{m.partner?.role === 'company' ? '🏢' : '👩‍🎓'}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{m.partner?.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {m.lastMessage ? m.lastMessage.content : 'メッセージを送ってみましょう！'}
                </p>
              </div>
              {m.lastMessage && (
                <p className="text-xs text-gray-300 flex-shrink-0">
                  {new Date(m.lastMessage.created_at).toLocaleDateString('ja-JP')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
