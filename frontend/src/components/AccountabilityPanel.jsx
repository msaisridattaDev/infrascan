import { useState } from 'react'
import { ChevronDownIcon } from './icons'

function fmt(d) {
  return d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

export function AccountabilityPanel({ jurisdiction, loading }) {
  const [reasonOpen, setReasonOpen] = useState(false)

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Accountability</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Checking jurisdiction match…</p>
      </div>
    )
  }

  if (!jurisdiction || jurisdiction.match_confidence !== 'confident') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Accountability</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Unattributed — no seeded road segment is within 50m of this report's location, so no contractor or
          authority can be confidently named.
        </p>
      </div>
    )
  }

  const j = jurisdiction
  const inWarranty = j.liability_status === 'in_warranty'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Accountability</p>
      <p
        className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${inWarranty ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}
      >
        {inWarranty ? 'Contractor liable' : "Corporation's own cost"}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-xs">
        <div>
          <p className="text-slate-400 dark:text-slate-500">Road</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{j.road_name}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Ward / zone</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{j.ward || j.zone || '—'}</p>
        </div>

        <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3">
          <p className="text-slate-400 dark:text-slate-500">Contract</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{j.tender_number}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Contractor</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{j.contractor_name}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Officer</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{j.responsible_officer || 'Officer attribution unavailable'}</p>
        </div>

        <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3">
          <p className="text-slate-400 dark:text-slate-500">Liability</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Work period</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
            {fmt(j.work_period_start)} – {fmt(j.completion_date)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Liability period ends</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
            {fmt(j.dlp_expiry)} · {inWarranty ? 'in warranty' : 'expired'}
          </p>
        </div>
      </div>

      <button
        onClick={() => setReasonOpen((o) => !o)}
        className="w-full flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-left"
      >
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Why is {inWarranty ? 'the contractor' : 'the corporation'} responsible?
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${reasonOpen ? 'rotate-180' : ''}`} />
      </button>

      {reasonOpen && (
        <div className="mt-2 space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {(j.attribution_reason || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
          {j.assumption_flags?.liability_period_years && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Liability period length is an assigned assumption for this prototype, not read from a published tender
              document.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
