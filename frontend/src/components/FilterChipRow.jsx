const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'review', label: 'Review' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'recapture', label: 'Recapture' },
]

export function FilterChipRow({ value, onChange, options = STATUS_OPTIONS }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              active
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
