import { haversineMeters } from './geo'

const NEARBY_RADIUS_M = 20
const CAPTURE_NEARBY_RADIUS_M = 30

export function withAgeAndRepeat(observations) {
  return observations.map((o) => {
    const ageDays = o.captured_at
      ? Math.max(0, Math.floor((Date.now() - new Date(o.captured_at).getTime()) / 86400000))
      : null

    const nearby = observations
      .filter(
        (other) =>
          o.gps_lat != null &&
          o.gps_lon != null &&
          other.gps_lat != null &&
          other.gps_lon != null &&
          haversineMeters(o.gps_lat, o.gps_lon, other.gps_lat, other.gps_lon) <= NEARBY_RADIUS_M
      )
      .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at))

    const repeatCount = nearby.length
    const repeatIndex = nearby.findIndex((n) => n.id === o.id) + 1

    return { ...o, ageDays, repeatCount, repeatIndex }
  })
}

export function findNearby(observations, lat, lon, radiusM = CAPTURE_NEARBY_RADIUS_M) {
  if (lat == null || lon == null) return []
  return observations
    .filter((o) => o.gps_lat != null && o.gps_lon != null)
    .map((o) => ({ ...o, distanceM: haversineMeters(lat, lon, o.gps_lat, o.gps_lon) }))
    .filter((o) => o.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
}
