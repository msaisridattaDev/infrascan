import { AccountabilityList } from './AccountabilityList'
import { AgeRepeatBadge } from './AgeRepeatBadge'
import { Badge } from './Badge'
import { CommentThread } from './CommentThread'
import { ConfidenceRing } from './ConfidenceRing'
import { ContactActionRow } from './ContactActionRow'
import { DefectTypeChip } from './DefectTypeChip'
import { EvidencePhotoCard } from './EvidencePhotoCard'
import { ArrowLeftIcon } from './icons'
import { LocationRow } from './LocationRow'
import { SeverityBadge } from './SeverityBadge'
import { SupportTap } from './SupportTap'
import { useJurisdiction } from '../lib/useJurisdiction'

export function ReportDetail({ observation, onBack }) {
  const { data: jurisdiction, loading: jurisdictionLoading } = useJurisdiction(observation?.id)

  if (!observation) return null
  const o = observation
  const capturedAt = o.captured_at
    ? new Date(o.captured_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : ''

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200">
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>

      <EvidencePhotoCard src={o.image_data_url} caption={capturedAt} />

      <div className="flex items-center gap-2 mt-4">
        <DefectTypeChip defectType={o.defect_type} />
        <Badge status={o.status}>{o.status}</Badge>
      </div>

      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize mt-3">
        {o.defect_type?.replace('_', ' ')}
      </h1>

      <div className="flex items-center gap-3 mt-2">
        <SeverityBadge severity={o.severity} />
        <div className="flex items-center gap-1.5">
          <ConfidenceRing confidence={o.confidence} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(o.confidence * 100)}% confidence</span>
        </div>
      </div>

      <div className="mt-2">
        <AgeRepeatBadge ageDays={o.ageDays} repeatCount={o.repeatCount} repeatIndex={o.repeatIndex} />
      </div>

      <div className="mt-3">
        <SupportTap observationId={o.id} />
      </div>

      <div className="mt-4">
        <LocationRow lat={o.gps_lat} lon={o.gps_lon} />
      </div>

      <div className="mt-6 space-y-3">
        <ContactActionRow observation={o} jurisdiction={jurisdiction} loading={jurisdictionLoading} />
        <AccountabilityList jurisdiction={jurisdiction} loading={jurisdictionLoading} />
        <CommentThread observationId={o.id} />
      </div>
    </div>
  )
}
