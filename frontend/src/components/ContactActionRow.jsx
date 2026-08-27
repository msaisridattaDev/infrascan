export function ContactActionRow() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Take action</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Contact and escalation options (Tweet, email, call, portal) become available once jurisdiction matching is live.
      </p>
    </div>
  )
}
