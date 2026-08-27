import { STATUS_STYLE } from '../constants'
import { AlertTriangleIcon, CheckIcon, ClockIcon, CircleDotIcon } from './icons'

const STATUS_ICON = {
  accepted: CheckIcon,
  review: ClockIcon,
  recapture: AlertTriangleIcon,
  new: CircleDotIcon,
}

export function Badge({ status, children }) {
  const Icon = STATUS_ICON[status] || STATUS_ICON.new
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.new}`}>
      <Icon />
      {children}
    </span>
  )
}

export const StatusChip = Badge
