import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import { SEVERITY_COLOR } from '../constants'

const SEVERITY_RANK = { low: 1, medium: 2, high: 3 }

// A cluster's ring color is driven by the worst severity inside it — a bubble covering 12 reports
// where even one is high-severity should read as urgent (red), not be diluted to a calmer average.
function worstSeverity(markers) {
  let worst = 'low'
  for (const m of markers) {
    const s = m.__severity
    if (SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s
  }
  return worst
}

function clusterIconDataUrl(count, severity, { dashed = false } = {}) {
  const size = count >= 50 ? 44 : count >= 10 ? 38 : 32
  const color = SEVERITY_COLOR[severity] || '#64748b'
  const strokeWidth = severity === 'high' ? 3.5 : 2.5
  const r = size / 2 - strokeWidth
  const dash = dashed ? ` stroke-dasharray="${strokeWidth} ${strokeWidth * 1.4}"` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="${strokeWidth}"${dash}/>
    <text x="${size / 2}" y="${size / 2 + 4.5}" font-size="13" font-weight="700" fill="${color}" text-anchor="middle" font-family="system-ui,sans-serif">${count}</text>
  </svg>`
  return { url: `data:image/svg+xml;base64,${window.btoa(svg)}`, size }
}

// Plain google.maps.Marker (not AdvancedMarkerElement) deliberately — AdvancedMarker requires a
// Google Cloud Map ID to be provisioned separately from the API key, which we don't have wired
// up. Classic Marker + MarkerClusterer works fully without one.
export function ObservationMarkers({ observations, cluster }) {
  const map = useMap()
  const markersRef = useRef([])
  const clustererRef = useRef(null)
  const infoWindowRef = useRef(null)

  useEffect(() => {
    if (!map || typeof google === 'undefined') return

    markersRef.current.forEach((m) => m.setMap(null))
    if (clustererRef.current) clustererRef.current.clearMarkers()
    if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow()

    const markers = observations
      .filter((o) => o.gps_lat != null && o.gps_lon != null)
      .map((o) => {
        const marker = new google.maps.Marker({
          position: { lat: o.gps_lat, lng: o.gps_lon },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: SEVERITY_COLOR[o.severity] || '#64748b',
            fillOpacity: 0.85,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 9,
          },
        })
        marker.__severity = o.severity
        marker.addListener('click', () => {
          const type = (o.defect_type || '').replace('_', ' ')
          infoWindowRef.current.setContent(
            `<div style="font:13px system-ui;padding:2px"><strong style="text-transform:capitalize">${type} — ${o.severity}</strong><br/>${Math.round((o.confidence || 0) * 100)}% confidence · ${o.status}</div>`
          )
          infoWindowRef.current.open({ map, anchor: marker })
        })
        return marker
      })

    markersRef.current = markers

    if (cluster) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({
          map,
          algorithm: new SuperClusterAlgorithm({ radius: 50, maxZoom: 16 }),
          renderer: {
            render: ({ count, position, markers: clusterMarkers }) => {
              const severity = worstSeverity(clusterMarkers)
              const { url, size } = clusterIconDataUrl(count, severity)
              return new google.maps.Marker({
                position,
                icon: { url, scaledSize: new google.maps.Size(size, size) },
                zIndex: 1000 + count,
              })
            },
          },
        })
      }
      clustererRef.current.addMarkers(markers)
    } else {
      markers.forEach((m) => m.setMap(map))
    }

    return () => {
      markers.forEach((m) => m.setMap(null))
      if (clustererRef.current) clustererRef.current.clearMarkers()
    }
  }, [map, observations, cluster])

  useEffect(
    () => () => {
      clustererRef.current?.setMap(null)
    },
    [map]
  )

  return null
}

// Renders the illustrative demo-density layer (see lib/demoDensity.js) as dashed rings — visually
// distinct from ObservationMarkers' solid rings — so it never reads as real report data. Points
// are pre-aggregated already, so these render directly, no MarkerClusterer needed.
export function DensityMarkers({ points }) {
  const map = useMap()
  const markersRef = useRef([])
  const infoWindowRef = useRef(null)

  useEffect(() => {
    if (!map || typeof google === 'undefined') return

    markersRef.current.forEach((m) => m.setMap(null))
    if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow()

    const markers = points.map((p) => {
      const { url, size } = clusterIconDataUrl(p.count, p.severity, { dashed: true })
      const marker = new google.maps.Marker({
        map,
        position: { lat: p.lat, lng: p.lon },
        icon: { url, scaledSize: new google.maps.Size(size, size) },
      })
      marker.addListener('click', () => {
        infoWindowRef.current.setContent(
          `<div style="font:13px system-ui;padding:2px">~${p.count} defects · ${p.severity} severity<br/><span style="color:#64748b">Illustrative demo estimate, not a live report</span></div>`
        )
        infoWindowRef.current.open({ map, anchor: marker })
      })
      return marker
    })

    markersRef.current = markers

    return () => markers.forEach((m) => m.setMap(null))
  }, [map, points])

  return null
}

export function MeMarker({ center }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    if (!map || !center || typeof google === 'undefined') return
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        title: 'You are here',
        zIndex: 9999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      })
    }
    markerRef.current.setPosition({ lat: center[0], lng: center[1] })
  }, [map, center])

  useEffect(
    () => () => {
      markerRef.current?.setMap(null)
    },
    [map]
  )

  return null
}

export function RadiusCircle({ center, radiusM }) {
  const map = useMap()
  const circleRef = useRef(null)

  useEffect(() => {
    if (!map || !center || typeof google === 'undefined') return
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        strokeColor: '#2563eb',
        strokeWeight: 1.5,
        fillColor: '#2563eb',
        fillOpacity: 0.06,
      })
    }
    circleRef.current.setCenter({ lat: center[0], lng: center[1] })
    circleRef.current.setRadius(radiusM)
  }, [map, center, radiusM])

  useEffect(
    () => () => {
      circleRef.current?.setMap(null)
    },
    [map]
  )

  return null
}
