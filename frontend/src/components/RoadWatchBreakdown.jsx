import { useState } from 'react'

const VIEWS = [
  { id: 'ward', label: 'By ward' },
  { id: 'contractor', label: 'By contractor' },
  { id: 'officer', label: 'By officer' },
]

const COLUMN_LABEL = { ward: 'Ward / zone', contractor: 'Contractor', officer: 'Officer' }

export function RoadWatchBreakdown({ byWard, byContractor, byOfficer, loading }) {
  const [view, setView] = useState('ward')
  const rows = { ward: byWard, contractor: byContractor, officer: byOfficer }[view]

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 m-3 rounded-lg">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${view === v.id ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-slate-400 dark:text-slate-500 px-4 pb-4">Checking jurisdiction matches…</p>}

      {!loading && rows.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 px-4 pb-4">
          No confidently-attributed reports yet — this fills in once reports match a seeded road segment.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700">
                <th className="px-4 py-2 font-medium">{COLUMN_LABEL[view]}</th>
                <th className="px-2 py-2 font-medium text-right">Defects</th>
                <th className="px-2 py-2 font-medium text-right">Attributed</th>
                <th className="px-2 py-2 font-medium text-right">In warranty</th>
                <th className="px-4 py-2 font-medium text-right">Contractor-liable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200 font-medium">
                    {r.key}
                    {r.responsibleOfficer && (
                      <span className="block text-[11px] font-normal text-slate-400 dark:text-slate-500">{r.responsibleOfficer}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{r.defects}</td>
                  <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{r.attributed}</td>
                  <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{r.inWarranty}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{r.contractorLiablePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
