import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const STATUS_OPTIONS = [
  { value: 'active',               label: 'マッチング中',   color: 'bg-slate-100 text-slate-500' },
  { value: 'document_review',      label: '書類選考中',     color: 'bg-yellow-100 text-yellow-700' },
  { value: 'interview_scheduling', label: '面接調整中',     color: 'bg-blue-100 text-blue-700' },
  { value: 'first_interview',      label: '一次面接',       color: 'bg-indigo-100 text-indigo-700' },
  { value: 'second_interview',     label: '二次面接',       color: 'bg-violet-100 text-violet-700' },
  { value: 'final_interview',      label: '最終面接',       color: 'bg-purple-100 text-purple-700' },
  { value: 'offer',                label: '内定',           color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected',             label: '不合格',         color: 'bg-red-100 text-red-600' },
  { value: 'withdrawn',            label: '辞退',           color: 'bg-slate-100 text-slate-400' },
];

function getStatus(value) {
  return STATUS_OPTIONS.find(s => s.value === (value || 'active')) || STATUS_OPTIONS[0];
}

export default function Matches() {
  const { setUnreadCount } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openStatusId, setOpenStatusId] = useState(null);

  const fetchMatches = () => {
    setLoading(true);
    setError('');
    api.getMatches().then(setMatches).catch(e => setError(e.message || '読み込みに失敗しました')).finally(() => setLoading(false));
    api.markAllRead().then(() => setUnreadCount(0)).catch(() => {});
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleStatusChange = async (matchId, status) => {
    try {
      await api.updateMatchStatus(matchId, status);
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
    } catch (e) { console.error(e); }
    setOpenStatusId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-900 mb-5">マッチング一覧</h1>

      {error ? (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-4">⚠️</div>
          <p className="font-semibold text-slate-600">{error}</p>
          <button onClick={fetchMatches} className="mt-3 text-sm text-violet-600 font-semibold hover:underline">再読み込み</button>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">💬</div>
          <p className="font-semibold text-slate-600">マッチングがありません</p>
          <p className="text-sm mt-1">スワイプしてマッチングしましょう</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map(m => {
            const status = getStatus(m.status);
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-100 overflow-visible">
                <Link to={`/matches/${m.id}`} className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {m.partner?.avatar
                      ? <img src={m.partner.avatar} alt={m.partner.name} className="w-full h-full object-cover" />
                      : <span>{m.partner?.role === 'company' ? '🏢' : '🎓'}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{m.partner?.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {m.lastMessage ? m.lastMessage.content : 'メッセージを送ってみましょう'}
                    </p>
                  </div>
                  {m.lastMessage && (
                    <p className="text-xs text-slate-300 flex-shrink-0">
                      {new Date(m.lastMessage.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                    </p>
                  )}
                </Link>

                <div className="px-4 pb-3 relative flex items-center gap-2">
                  <button
                    onClick={() => setOpenStatusId(openStatusId === m.id ? null : m.id)}
                    className={`text-xs px-3 py-1 rounded-lg font-semibold flex items-center gap-1 ${status.color}`}
                  >
                    {status.label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                  </button>

                  {openStatusId === m.id && (
                    <div className="absolute left-4 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusChange(m.id, s.value)}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 flex items-center gap-2"
                        >
                          <span className={`inline-block px-2 py-0.5 rounded-lg font-semibold ${s.color}`}>{s.label}</span>
                          {s.value === (m.status || 'active') && (
                            <svg className="ml-auto text-violet-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openStatusId && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenStatusId(null)} />
      )}
    </div>
  );
}
