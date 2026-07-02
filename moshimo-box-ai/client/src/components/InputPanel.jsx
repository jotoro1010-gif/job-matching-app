import ToneTabs from './ToneTabs';

const EXAMPLES = [
  '人類が月に住んでいたら',
  '猫が人間より知能が高かったら',
  '江戸時代にインターネットがあったら',
  '重力が半分だったら',
];

export default function InputPanel({ premise, setPremise, tone, setTone, onSubmit, loading }) {
  return (
    <div className="bg-box-card rounded-2xl p-6 shadow-xl">
      <h2 className="text-white text-lg font-bold mb-4">もしも世界をつくる</h2>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-box-accent font-bold whitespace-nowrap">もしも</span>
        <input
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="人類が月に住んでいたら"
          className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-box-accent"
        />
        <span className="text-box-accent font-bold whitespace-nowrap">だったら</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setPremise(ex)}
            className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70 hover:bg-white/15"
          >
            {ex}
          </button>
        ))}
      </div>

      <ToneTabs value={tone} onChange={setTone} />

      <button
        onClick={onSubmit}
        disabled={loading || !premise.trim()}
        className="mt-5 w-full bg-box-accent2 hover:bg-box-accent2/80 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition"
      >
        {loading ? '世界を生成中...' : 'この世界を開く'}
      </button>
    </div>
  );
}
