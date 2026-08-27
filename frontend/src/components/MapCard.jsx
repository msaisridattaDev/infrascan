import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { SEVERITY_COLOR } from '../constants'

export function MapCard({ observations, center, zoom = 12, height = 560 }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
