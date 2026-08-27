import { PinIcon } from './icons'

export function LocationRow({ lat, lon, address }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <PinIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span>{address || (lat != null && lon != null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : 'Location unavailable')}</span>
    </div>
  )
}
