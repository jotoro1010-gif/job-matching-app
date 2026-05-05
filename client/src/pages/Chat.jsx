import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api';
import { useAuth } from '../App';

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function ScheduleCard({ msg, matchId, currentUserId, onConfirm }) {
  const isProposer = msg.sender_id === currentUserId;
  const confirmed = msg.schedule_status === 'confirmed';

  if (confirmed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <p className="text-xs text-emerald-600 font-semibold">日程確定</p>
        </div>
        <p className="text-emerald-900 font-bold text-sm">{formatDateTime(msg.confirmed_slot)}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p className="text-xs text-slate-500 font-semibold">日程候補</p>
      </div>
      <div className="space-y-2">
        {(msg.slots || []).map((slot, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-700 font-medium">{formatDateTime(slot)}</span>
            {!isProposer && (
              <button
                onClick={() => onConfirm(msg.id, slot)}
                className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 transition-colors font-medium flex-shrink-0"
              >
                確定
              </button>
            )}
          </div>
        ))}
      </div>
      {isProposer && <p className="text-xs text-slate-400 mt-2">返答を待っています</p>}
    </div>
  );
}

function ScheduleModal({ onClose, onSend }) {
  const [slots, setSlots] = useState(['', '', '']);
  const updateSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v));
  const filled = slots.filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">日程候補を送る</h3>
        <p className="text-sm text-slate-500 mb-4">複数の候補を送ると相手が選択できます</p>
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">候補 {i + 1}</label>
              <input
                type="datetime-local"
                value={slot}
                onChange={e => updateSlot(i, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl font-medium text-sm hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => { if (filled.length > 0) { onSend(filled); onClose(); } }}
            disabled={filled.length === 0}
            className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-violet-700 transition-colors"
          >
            送信する ({filled.length}件)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.getMessages(matchId).then(setMessages).catch(console.error);
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = s;
    s.on('connect', () => s.emit('join_match', parseInt(matchId)));
    s.on('new_message', msg => setMessages(prev => [...prev, msg]));
    s.on('schedule_updated', updated => setMessages(prev => prev.map(m => m.id === updated.id ? updated : m)));
    return () => { s.disconnect(); socketRef.current = null; };
  }, [matchId]);

  useEffect(() => {
    api.getMatches().then(matches => {
      const match = matches.find(m => m.id === parseInt(matchId));
      if (match) setPartnerName(match.partner?.name || '');
    }).catch(console.error);
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { matchId: parseInt(matchId), content: input.trim() });
    setInput('');
  };

  const sendSchedule = async (slots) => {
    try { await api.proposeSchedule(parseInt(matchId), slots); } catch (e) { console.error(e); }
  };

  const confirmSchedule = async (messageId, slot) => {
    try { await api.confirmSchedule(parseInt(matchId), messageId, slot); } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
        <Link to="/matches" className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base overflow-hidden flex-shrink-0">
          <span>💬</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{partnerName}</p>
        </div>
      </div>

      {/* メッセージ */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-16">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">👋</div>
            <p className="text-sm">最初のメッセージを送ってみましょう</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id;
          if (msg.type === 'schedule') {
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <ScheduleCard msg={msg} matchId={matchId} currentUserId={user.id} onConfirm={confirmSchedule} />
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                isMe
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <form onSubmit={sendMessage} className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setShowSchedule(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors flex-shrink-0"
          title="日程を提案"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onSend={sendSchedule} />}
    </div>
  );
}
