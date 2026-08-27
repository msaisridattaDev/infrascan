import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { SEVERITY_COLOR } from '../constants'

// react-leaflet's MapContainer only applies the `center` prop on first mount — later prop
// changes (a GPS fix arriving, a "near me" click) are silently ignored unless something calls
// setView() itself. This bridges that gap so the map actually follows real location updates.
function Recenter({ center, zoom }) {
  const map = useMap()
  const first = useRef(true)

  useEffect(() => {
    if (!center) return
    map.setView(center, zoom, { animate: !first.current })
    first.current = false
  }, [center, zoom, map])

  return null
}

const youAreHereIcon = L.divIcon({
  className: '',
  html: '<div class="you-are-here-marker"><div class="you-are-here-pulse"></div><div class="you-are-here-dot"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function MapCard({ observations, center, zoom = 12, height = 560, showMe = false }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <Recenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showMe && center && (
          <Marker position={center} icon={youAreHereIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {observations.map((o) => (
          <CircleMarker
            key={o.id}
            center={[o.gps_lat, o.gps_lon]}
            radius={9}
            pathOptions={{
              color: SEVERITY_COLOR[o.severity] || '#64748b',
              fillColor: SEVERITY_COLOR[o.severity] || '#64748b',
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <p className="font-medium capitalize">{o.defect_type?.replace('_', ' ')} — {o.severity}</p>
              <p>{Math.round(o.confidence * 100)}% confidence · {o.status}</p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
