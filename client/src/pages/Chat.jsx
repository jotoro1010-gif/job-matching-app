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

function ProposalCard({ msg, currentUserId, userRole, onConfirm, onDecline, onCounter }) {
  const isProposer = msg.proposedBy === currentUserId;
  const isInvitation = msg.type === 'invitation';

  if (msg.status === 'declined') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          <p className="text-xs text-red-600 font-semibold">お断りしました</p>
        </div>
        {msg.declineReason && <p className="text-red-900 text-sm mt-1">{msg.declineReason}</p>}
      </div>
    );
  }

  if (msg.status === 'confirmed') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <p className="text-xs text-emerald-600 font-semibold">{isInvitation ? msg.title : '面談日程確定'}</p>
        </div>
        <p className="text-emerald-900 font-bold text-sm">{formatDateTime(msg.confirmedSlot)}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p className="text-xs text-slate-500 font-semibold">
          {isInvitation ? msg.title : (msg.requestType === 'formal' ? '本選考に進みたい' : '会社説明・カジュアル面談を希望')}
        </p>
      </div>
      {isInvitation && msg.details && <p className="text-sm text-slate-600 mb-3">{msg.details}</p>}
      {!isInvitation && msg.comment && <p className="text-sm text-slate-600 mb-3">{msg.comment}</p>}
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
      {isProposer ? (
        <p className="text-xs text-slate-400 mt-2">返答を待っています</p>
      ) : (
        <div className="flex gap-2 mt-3">
          <button onClick={() => onCounter(msg.id)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium">
            他日程希望
          </button>
          {isInvitation && userRole === 'student' && (
            <button onClick={() => onDecline(msg.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium">
              お断り
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InvitationModal({ onClose, onSend }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [slots, setSlots] = useState(['', '', '']);
  const updateSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v));
  const filled = slots.filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-slate-900 mb-4">お誘いを送る</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">タイトル</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：カジュアル面談のお誘い"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">詳細</label>
            <textarea
              value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="お誘いの詳細を入力してください"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50 resize-none"
            />
          </div>
          {slots.map((slot, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">希望日時 {i + 1}</label>
              <input
                type="datetime-local" value={slot} onChange={e => updateSlot(i, e.target.value)}
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
            onClick={() => { if (title.trim() && filled.length > 0) onSend({ title: title.trim(), details: details.trim(), slots: filled }); }}
            disabled={!title.trim() || filled.length === 0}
            className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-violet-700 transition-colors"
          >
            送信する
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewRequestModal({ onClose, onSend }) {
  const [requestType, setRequestType] = useState('formal');
  const [comment, setComment] = useState('');
  const [slots, setSlots] = useState(['', '', '']);
  const updateSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v));
  const filled = slots.filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-slate-900 mb-4">面談を希望する</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">希望内容</label>
            <div className="flex gap-2">
              <button
                type="button" onClick={() => setRequestType('formal')}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border ${requestType === 'formal' ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-500'}`}
              >
                本選考に進みたい
              </button>
              <button
                type="button" onClick={() => setRequestType('casual')}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border ${requestType === 'casual' ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-500'}`}
              >
                会社説明・カジュアル面談
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">コメント</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="伝えたいことがあれば入力してください"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50 resize-none"
            />
          </div>
          {slots.map((slot, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">希望日時 {i + 1}</label>
              <input
                type="datetime-local" value={slot} onChange={e => updateSlot(i, e.target.value)}
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
            onClick={() => { if (filled.length > 0) onSend({ requestType, comment: comment.trim(), slots: filled }); }}
            disabled={filled.length === 0}
            className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-violet-700 transition-colors"
          >
            送信する
          </button>
        </div>
      </div>
    </div>
  );
}

function DeclineModal({ onClose, onSend }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">お誘いをお断りする</h3>
        <p className="text-sm text-slate-500 mb-4">お断りの理由を入力してください（必須）。お断り後はこの相手とのメッセージができなくなります。</p>
        <textarea
          value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="理由を入力してください"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-slate-50 resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl font-medium text-sm hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => { if (reason.trim()) onSend(reason.trim()); }}
            disabled={!reason.trim()}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-red-600 transition-colors"
          >
            お断りする
          </button>
        </div>
      </div>
    </div>
  );
}

function CounterModal({ onClose, onSend }) {
  const [slots, setSlots] = useState(['', '', '']);
  const updateSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v));
  const filled = slots.filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">他日程を希望する</h3>
        <p className="text-sm text-slate-500 mb-4">新しい候補日時を送ります（最大3件）</p>
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">候補 {i + 1}</label>
              <input
                type="datetime-local" value={slot} onChange={e => updateSlot(i, e.target.value)}
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
            onClick={() => { if (filled.length > 0) onSend(filled); }}
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
  const [match, setMatch] = useState(null);
  const [showInvitation, setShowInvitation] = useState(false);
  const [showInterviewRequest, setShowInterviewRequest] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [counterTarget, setCounterTarget] = useState(null);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.getMessages(matchId).then(setMessages).catch(console.error);
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = s;
    s.on('connect', () => s.emit('join_match', parseInt(matchId)));
    s.on('new_message', msg => setMessages(prev => [...prev, msg]));
    s.on('proposal_updated', updated => setMessages(prev => prev.map(m => m.id === updated.id ? updated : m)));
    s.on('match_updated', updated => setMatch(prev => prev ? { ...prev, ...updated } : prev));
    return () => { s.disconnect(); socketRef.current = null; };
  }, [matchId]);

  useEffect(() => {
    api.getMatches().then(matches => {
      const m = matches.find(m => m.id === parseInt(matchId));
      if (m) setMatch(m);
    }).catch(console.error);
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { matchId: parseInt(matchId), content: input.trim() });
    setInput('');
  };

  const sendInvitation = async (data) => {
    try { await api.sendInvitation(parseInt(matchId), data); } catch (e) { console.error(e); }
  };

  const sendInterviewRequest = async (data) => {
    try { await api.sendInterviewRequest(parseInt(matchId), data); } catch (e) { console.error(e); }
  };

  const confirmProposal = async (messageId, slot) => {
    try { await api.confirmProposal(parseInt(matchId), messageId, slot); } catch (e) { console.error(e); }
  };

  const declineProposal = async (messageId, reason) => {
    try {
      await api.declineProposal(parseInt(matchId), messageId, reason);
      setMatch(prev => prev ? { ...prev, status: 'withdrawn' } : prev);
    } catch (e) { console.error(e); }
  };

  const counterProposal = async (messageId, slots) => {
    try { await api.counterProposal(parseInt(matchId), messageId, slots); } catch (e) { console.error(e); }
  };

  const isWithdrawn = match?.status === 'withdrawn';

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
          <p className="font-semibold text-slate-900 text-sm">{match?.partner?.name}</p>
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
          if (msg.type === 'invitation' || msg.type === 'interview_request') {
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <ProposalCard
                  msg={msg}
                  currentUserId={user.id}
                  userRole={user.role}
                  onConfirm={confirmProposal}
                  onDecline={(messageId) => setDeclineTarget(messageId)}
                  onCounter={(messageId) => setCounterTarget(messageId)}
                />
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
      {isWithdrawn ? (
        <div className="flex-shrink-0 bg-slate-100 border-t border-slate-200 px-4 py-4 text-center">
          <p className="text-xs text-slate-500 font-medium">このマッチは辞退済みのため、メッセージを送信できません</p>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2 items-center">
          {user.role === 'company' && (
            <button
              type="button"
              onClick={() => setShowInvitation(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors flex-shrink-0"
              title="お誘いを送る"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
          )}
          {user.role === 'student' && (
            <button
              type="button"
              onClick={() => setShowInterviewRequest(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors flex-shrink-0"
              title="面談を希望する"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
          )}
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
      )}

      {showInvitation && <InvitationModal onClose={() => setShowInvitation(false)} onSend={(data) => { sendInvitation(data); setShowInvitation(false); }} />}
      {showInterviewRequest && <InterviewRequestModal onClose={() => setShowInterviewRequest(false)} onSend={(data) => { sendInterviewRequest(data); setShowInterviewRequest(false); }} />}
      {declineTarget && <DeclineModal onClose={() => setDeclineTarget(null)} onSend={(reason) => { declineProposal(declineTarget, reason); setDeclineTarget(null); }} />}
      {counterTarget && <CounterModal onClose={() => setCounterTarget(null)} onSend={(slots) => { counterProposal(counterTarget, slots); setCounterTarget(null); }} />}
    </div>
  );
}
