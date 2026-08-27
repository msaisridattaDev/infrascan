import { SEVERITY_STYLE, STATUS_STYLE } from '../constants'
import { placeholderRoadName } from '../lib/placeholderRoad'
import { AgeRepeatBadge } from './AgeRepeatBadge'
import { ConfidenceRing } from './ConfidenceRing'

const SEVERITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' }
const STATUS_LABEL = { new: 'New', review: 'In review', accepted: 'Accepted', recapture: 'Recapture' }

// Cards lead with where the defect is, not what it is — the road name reads as the primary fact;
// the defect type and severity are context underneath it, not the headline. road_name/ward come
// pre-resolved on the observation itself (the backend matches it against the seeded road register
// at serialize time), so there's never a raw-coordinate flash while a lookup is in flight.
export function ReportCard({ o, onClick }) {
  const roadName = o.road_name || placeholderRoadName(o.id)
  const ward = o.ward
  const date = o.captured_at ? new Date(o.captured_at).toLocaleDateString([], { day: '2-digit', month: 'short' }) : ''
  const defectLabel = o.defect_type?.replace('_', ' ')

  const metaParts = [ward && `Ward ${ward}`, date, o.distanceM != null && `${Math.round(o.distanceM)}m away`].filter(Boolean)

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition' : ''}`}
    >
      <img src={o.image_data_url} alt={roadName} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
            {roadName}
          </p>
          <ConfidenceRing confidence={o.confidence} size={26} strokeWidth={2.5} />
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">{defectLabel}</p>
          <span
            className={`flex-shrink-0 text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-px rounded border ${SEVERITY_STYLE[o.severity] || SEVERITY_STYLE.low}`}
          >
            {SEVERITY_LABEL[o.severity] || o.severity}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[o.status] || STATUS_STYLE.new}`}>
            {STATUS_LABEL[o.status] || o.status}
          </span>
          {metaParts.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              {metaParts.join(' · ')}
            </span>
          )}
        </div>

        {o.ageDays != null && (
          <div className="mt-1.5">
            <AgeRepeatBadge ageDays={o.ageDays} repeatCount={o.repeatCount} repeatIndex={o.repeatIndex} />
          </div>
        )}
      </div>
    </div>
  )
}
