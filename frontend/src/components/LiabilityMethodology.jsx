import { useState } from 'react'
import { ChevronDownIcon, InfoIcon } from './icons'

export function LiabilityMethodology() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between p-3 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <InfoIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          How liability is decided
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>A report is attributed to a contractor when, in order:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>The report's GPS location falls within 50m of a seeded road segment.</li>
            <li>That segment is covered by a seeded contract record (tender, contractor, officer).</li>
            <li>The report's capture date falls within the contract's defect liability period.</li>
          </ol>
          <p>If any step fails, the report is left <strong>unattributed</strong> rather than guessing.</p>
          <p className="pt-1">
            Once attributed, if the report falls inside the liability period the repair is <strong>contractor-liable</strong>;
            once that period expires, it becomes the maintaining authority's own cost.
          </p>
          <p className="pt-1 text-slate-400 dark:text-slate-500">
            Defect liability period lengths (3–5 years depending on the contract) are assigned per contract, not read
            from a published tender document — every attributed report's evidence explicitly flags this as an
            assumption rather than presenting it as confirmed contractual fact.
          </p>
          <p className="pt-1 text-slate-400 dark:text-slate-500">
            All of this runs client-side today, calling the same per-report jurisdiction lookup used on Report Detail
            — there isn't yet a dedicated backend aggregation endpoint, so these numbers reflect exactly what's seeded
            in this prototype's registry, not a real city's road network.
          </p>
        </div>
      )}
    </div>
  )
}
