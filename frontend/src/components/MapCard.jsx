import { useEffect, useState } from 'react'
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import { DensityMarkers, MeMarker, ObservationMarkers, RadiusCircle } from './GoogleMapPrimitives'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// MapCard can render deep in the tree (Explore, Drive, Report Detail), so rather than threading
// the theme prop through every caller, it watches the same <html class="dark"> toggle useDarkMode
// already sets, and switches the map style to match — same signal, no prop drilling.
function useIsDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return dark
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a2233' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2233' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8896ab' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a4a63' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#243247' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3327' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b3852' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2233' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c5270' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#243247' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1826' }] },
]

function NoKeyFallback({ height }) {
  return (
    <div
      className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-4 text-center"
      style={{ height }}
    >
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Map unavailable — VITE_GOOGLE_MAPS_API_KEY isn't configured.
      </p>
    </div>
  )
}

export function MapCard({
  observations,
  center,
  zoom = 12,
  height = 560,
  showMe = false,
  cluster = false,
  radiusCircle = null,
  densityPoints = null,
  rounded = true,
}) {
  const dark = useIsDarkMode()

  if (!API_KEY) return <NoKeyFallback height={height} />

  return (
    <div className={rounded ? 'rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700' : ''} style={{ height }}>
      <APIProvider apiKey={API_KEY}>
        <Map
          center={{ lat: center[0], lng: center[1] }}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          styles={dark ? DARK_MAP_STYLE : undefined}
        >
          {densityPoints && <DensityMarkers points={densityPoints} />}
          <ObservationMarkers observations={observations} cluster={cluster} />
          {showMe && center && <MeMarker center={center} />}
          {radiusCircle && <RadiusCircle center={radiusCircle.center} radiusM={radiusCircle.radiusM} />}
        </Map>
      </APIProvider>
    </div>
  )
}
