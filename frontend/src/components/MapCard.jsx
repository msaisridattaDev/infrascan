import { useEffect, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
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

// MapCard can render deep in the tree (Explore, Drive, Report Detail), so rather than threading
// the theme prop through every caller, it watches the same <html class="dark"> toggle useDarkMode
// already sets, and switches basemap style to match — same signal, no prop drilling.
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

const youAreHereIcon = L.divIcon({
  className: '',
  html: '<div class="you-are-here-marker"><div class="you-are-here-pulse"></div><div class="you-are-here-dot"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function clusterIcon(cluster) {
  const count = cluster.getChildCount()
  const size = count >= 50 ? 44 : count >= 10 ? 38 : 32
  return L.divIcon({
    html: `<div class="cluster-marker" style="width:${size}px;height:${size}px">${count}</div>`,
    className: '',
    iconSize: [size, size],
  })
}

function ObservationMarker({ o }) {
  return (
    <CircleMarker
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
}) {
  const dark = useIsDarkMode()
  const tileStyle = dark ? 'dark_all' : 'rastertiles/voyager'

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <Recenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
          url={`https://{s}.basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png`}
          subdomains="abcd"
          maxZoom={20}
        />

        {radiusCircle && (
          <Circle
            center={radiusCircle.center}
            radius={radiusCircle.radiusM}
            pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#2563eb', fillOpacity: 0.06 }}
          />
        )}

        {showMe && center && (
          <Marker position={center} icon={youAreHereIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {cluster ? (
          <MarkerClusterGroup iconCreateFunction={clusterIcon} showCoverageOnHover={false} spiderfyOnMaxZoom>
            {observations.map((o) => (
              <ObservationMarker key={o.id} o={o} />
            ))}
          </MarkerClusterGroup>
        ) : (
          observations.map((o) => <ObservationMarker key={o.id} o={o} />)
        )}
      </MapContainer>
    </div>
  )
}
