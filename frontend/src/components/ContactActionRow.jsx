export function ContactActionRow({ jurisdiction, loading }) {
  if (loading || !jurisdiction || jurisdiction.match_confidence !== 'confident') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Take action</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Escalation guidance becomes available once this report is confidently matched to a jurisdiction.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Take action</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        This report falls within {jurisdiction.responsible_officer}'s jurisdiction ({jurisdiction.road_name}).
        Direct contact channels (email, call, portal) aren't in the seeded dataset yet — escalate through the
        standard PWD grievance process for now.
      </p>
    </div>
  )
}
