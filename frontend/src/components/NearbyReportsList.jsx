export function NearbyReportsList({ nearby }) {
  if (!nearby.length) return null
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-800 mb-2">
        {nearby.length} similar {nearby.length === 1 ? 'report' : 'reports'} nearby — this may already be reported
      </p>
      <div className="space-y-2">
        {nearby.slice(0, 3).map((o) => (
          <div key={o.id} className="flex items-center gap-2 text-xs text-amber-900">
            <img src={o.image_data_url} alt={o.defect_type} className="w-8 h-8 rounded object-cover flex-shrink-0" />
            <span className="capitalize truncate flex-1">{o.defect_type?.replace('_', ' ')}</span>
            <span className="text-amber-600 flex-shrink-0">{Math.round(o.distanceM)}m</span>
          </div>
        ))}
      </div>
    </div>
  )
}
