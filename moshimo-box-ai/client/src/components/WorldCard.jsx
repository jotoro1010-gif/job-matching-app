export default function WorldCard({ world, onSave, saved }) {
  return (
    <div className="bg-box-card rounded-2xl p-6 shadow-xl text-white">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold text-box-accent">{world.title}</h2>
        <button
          onClick={onSave}
          disabled={saved}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
            saved ? 'bg-white/10 text-white/50' : 'bg-box-accent text-box-bg font-bold'
          }`}
        >
          {saved ? '図鑑に保存済み' : '図鑑に保存'}
        </button>
      </div>

      <p className="mt-4 leading-relaxed text-white/90">{world.visual}</p>
      <p className="mt-4 text-white/70 text-sm leading-relaxed">{world.summary}</p>

      {world.branchPoints?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-box-accent2 mb-2">現実との主な違い</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-white/80">
            {world.branchPoints.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
