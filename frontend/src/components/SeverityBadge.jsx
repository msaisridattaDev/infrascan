import { SEVERITY_STYLE } from '../constants'
import { AlertTriangleIcon } from './icons'

export function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${SEVERITY_STYLE[severity] || SEVERITY_STYLE.low}`}>
      <AlertTriangleIcon />
      {severity}
    </span>
  )
}
