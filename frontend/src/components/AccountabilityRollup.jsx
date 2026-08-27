import { useState } from 'react'
import { ChartIcon, ChevronDownIcon } from './icons'

export function AccountabilityRollup({ rollup, loading }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <ChartIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Accountability by contractor
          {!loading && <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({rollup.length})</span>}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
          {loading && <p className="text-xs text-slate-400 dark:text-slate-500 p-3">Checking jurisdiction matches…</p>}
          {!loading && rollup.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 p-3">
              No confident jurisdiction matches yet — reports will appear here once matched to a seeded road segment.
            </p>
          )}
          {rollup.map((r) => (
            <div key={r.contractorName} className="p-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.contractorName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.responsibleOfficer}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{r.roadNames.join(', ')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {r.count} defect{r.count === 1 ? '' : 's'} · {r.dlpActiveCount} within active DLP
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
