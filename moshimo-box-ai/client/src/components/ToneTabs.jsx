export const TONES = [
  { id: 'sf', label: 'SF風' },
  { id: 'emotional', label: '感動系' },
  { id: 'comedy', label: 'コメディ' },
  { id: 'historical', label: '歴史考証風' },
];

export default function ToneTabs({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TONES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            value === t.id
              ? 'bg-box-accent text-box-bg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
