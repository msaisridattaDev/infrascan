export function AccountabilityList({ jurisdiction, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Accountable parties</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Checking jurisdiction match…</p>
      </div>
    )
  }

  if (!jurisdiction || jurisdiction.match_confidence !== 'confident') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Accountable parties</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Uncertain — no seeded road segment is close enough to this report to confidently name a contractor. Needs
          manual confirmation.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Accountable parties</p>
      <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <p><span className="font-medium text-slate-700 dark:text-slate-200">Road:</span> {jurisdiction.road_name}</p>
        <p><span className="font-medium text-slate-700 dark:text-slate-200">Contractor:</span> {jurisdiction.contractor_name}</p>
        <p><span className="font-medium text-slate-700 dark:text-slate-200">Tender:</span> {jurisdiction.tender_number}</p>
        <p><span className="font-medium text-slate-700 dark:text-slate-200">Officer:</span> {jurisdiction.responsible_officer}</p>
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Defect liability:</span>{' '}
          {jurisdiction.dlp_active ? `active until ${jurisdiction.dlp_expiry}` : `expired ${jurisdiction.dlp_expiry}`}
        </p>
      </div>
    </div>
  )
}
