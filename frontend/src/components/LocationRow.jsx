import { PinIcon } from './icons'
import { MapCard } from './MapCard'

export function LocationRow({ lat, lon, address, observation, showMap = false }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <PinIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span>{address || (lat != null && lon != null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : 'Location unavailable')}</span>
      </div>
      {showMap && lat != null && lon != null && (
        <div className="mt-2">
          <MapCard observations={observation ? [observation] : []} center={[lat, lon]} zoom={16} height={180} />
        </div>
      )}
    </div>
  )
}
