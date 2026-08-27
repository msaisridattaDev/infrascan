export function NearbyReportsList({ nearby }) {
  if (!nearby.length) return null
  return (
    <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
        {nearby.length} similar {nearby.length === 1 ? 'report' : 'reports'} nearby — this may already be reported
      </p>
      <div className="space-y-2">
        {nearby.slice(0, 3).map((o) => (
          <div key={o.id} className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <img src={o.image_data_url} alt={o.defect_type} className="w-8 h-8 rounded object-cover flex-shrink-0" />
            <span className="capitalize truncate flex-1">{o.defect_type?.replace('_', ' ')}</span>
            <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">{Math.round(o.distanceM)}m</span>
          </div>
        ))}
      </div>
    </div>
  )
}
