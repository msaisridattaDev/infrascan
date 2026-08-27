import { AgeRepeatBadge } from './AgeRepeatBadge'
import { Badge } from './Badge'
import { ConfidenceRing } from './ConfidenceRing'
import { SeverityBadge } from './SeverityBadge'

export function ReportCard({ o }) {
  const time = o.captured_at ? new Date(o.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="flex gap-3 bg-white rounded-xl border border-slate-200 p-3">
      <img src={o.image_data_url} alt={o.defect_type} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-slate-900 capitalize truncate">{o.defect_type?.replace('_', ' ')}</p>
          <Badge status={o.status}>{o.status}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <SeverityBadge severity={o.severity} />
          <ConfidenceRing confidence={o.confidence} />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {o.gps_lat?.toFixed(4)}, {o.gps_lon?.toFixed(4)} · {time}
        </p>
        <div className="mt-1">
          <AgeRepeatBadge ageDays={o.ageDays} repeatCount={o.repeatCount} repeatIndex={o.repeatIndex} />
        </div>
      </div>
    </div>
  )
}
