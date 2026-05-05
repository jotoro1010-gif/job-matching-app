import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api';
import { useAuth } from '../App';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.getMessages(matchId).then(setMessages).catch(console.error);

    const s = io('http://localhost:3001', { auth: { token: localStorage.getItem('token') } });
    socketRef.current = s;

    // 接続完了後にルーム参加（タイミング問題を防ぐ）
    s.on('connect', () => {
      s.emit('join_match', parseInt(matchId));
    });

    s.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  useEffect(() => {
    api.getMatches().then(matches => {
      const match = matches.find(m => m.id === parseInt(matchId));
      if (match) setPartnerName(match.partner?.name || '');
    }).catch(console.error);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { matchId: parseInt(matchId), content: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link to="/matches" className="text-gray-400 text-xl">←</Link>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg">
          💬
        </div>
        <p className="font-semibold text-gray-800">{partnerName}</p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p>最初のメッセージを送ってみましょう！</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-pink-500 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <form onSubmit={sendMessage} className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:bg-gray-200 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
