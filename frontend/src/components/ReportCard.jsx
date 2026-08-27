import { AgeRepeatBadge } from './AgeRepeatBadge'
import { Badge } from './Badge'
import { ConfidenceRing } from './ConfidenceRing'
import { SeverityBadge } from './SeverityBadge'

export function ReportCard({ o, onClick }) {
  const time = o.captured_at ? new Date(o.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition' : ''}`}
    >
      <img src={o.image_data_url} alt={o.defect_type} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100 capitalize truncate">{o.defect_type?.replace('_', ' ')}</p>
          <Badge status={o.status}>{o.status}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <SeverityBadge severity={o.severity} />
          <ConfidenceRing confidence={o.confidence} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {o.gps_lat?.toFixed(4)}, {o.gps_lon?.toFixed(4)} · {time}
          {o.distanceM != null && ` · ${Math.round(o.distanceM)}m away`}
        </p>
        <div className="mt-1">
          <AgeRepeatBadge ageDays={o.ageDays} repeatCount={o.repeatCount} repeatIndex={o.repeatIndex} />
        </div>
      </div>
    </div>
  )
}
