import { useState } from 'react';

export default function ChatPanel({ world, history, onSend, onClear, loading }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="bg-box-card rounded-2xl p-6 shadow-xl text-white flex flex-col h-[420px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-box-accent2">案内人と話す</h3>
        <button onClick={onClear} className="text-xs text-white/50 hover:text-white/80">
          履歴クリア
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {history.length === 0 && (
          <p className="text-white/40 text-sm">
            「{world.title}」の案内人に、この世界について質問してみましょう。
          </p>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-box-accent2 text-white' : 'bg-white/10 text-white/90'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-white/40 text-sm">案内人が考えています...</div>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="この世界の人はどう暮らしてる?"
          className="flex-1 bg-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-box-accent2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-box-accent2 px-4 rounded-lg text-sm font-bold disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  );
}
