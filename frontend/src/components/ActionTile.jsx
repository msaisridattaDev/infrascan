export function ActionTile({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition"
    >
      <span className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      </span>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </button>
  )
}

export function ActionTileGrid({ tiles }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
      {tiles.map((t) => (
        <ActionTile key={t.label} {...t} />
      ))}
    </div>
  )
}
