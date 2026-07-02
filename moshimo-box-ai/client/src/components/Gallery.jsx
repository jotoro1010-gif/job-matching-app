export default function Gallery({ worlds, onOpen, onDelete }) {
  if (worlds.length === 0) {
    return <p className="text-white/50 text-sm">まだ保存された世界はありません。「つくる」タブから世界を生成して保存してみましょう。</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {worlds.map((w) => (
        <div key={w.id} className="bg-box-card rounded-xl p-4 text-white">
          <h3 className="font-bold text-box-accent">{w.title}</h3>
          <p className="text-xs text-white/50 mt-1">もしも{w.premise}だったら</p>
          <p className="text-sm text-white/70 mt-2 line-clamp-3">{w.summary}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onOpen(w)}
              className="text-xs bg-box-accent2 px-3 py-1 rounded-full font-bold"
            >
              開く
            </button>
            <button
              onClick={() => onDelete(w.id)}
              className="text-xs bg-white/10 px-3 py-1 rounded-full"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
