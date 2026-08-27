import { AlertTriangleIcon } from './icons'

export function DefectTypeChip({ defectType }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 capitalize">
      <AlertTriangleIcon />
      {defectType?.replace('_', ' ')}
    </span>
  )
}
