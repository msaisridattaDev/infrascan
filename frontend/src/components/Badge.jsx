import { STATUS_STYLE } from '../constants'

export function Badge({ status, children }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.new}`}>
      {children}
    </span>
  )
}

export const StatusChip = Badge
