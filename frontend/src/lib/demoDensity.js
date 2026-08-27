import { haversineMeters } from './geo'

// Deterministic PRNG (mulberry32) so the generated layout is stable for a given location instead
// of reshuffling on every render — but still varies naturally from city to city.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromCenter([lat, lon]) {
  const la = Math.round(lat * 100)
  const lo = Math.round(lon * 100)
  return (la * 73856093) ^ (lo * 19349663)
}

const EARTH_RADIUS_KM = 6371

function offsetPoint([lat, lon], distanceKm, bearingRad) {
  const latRad = (lat * Math.PI) / 180
  const lonRad = (lon * Math.PI) / 180
  const angularDist = distanceKm / EARTH_RADIUS_KM

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDist) + Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearingRad)
  )
  const newLonRad =
    lonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(newLatRad)
    )

  return [(newLatRad * 180) / Math.PI, (newLonRad * 180) / Math.PI]
}

// Illustrative-only defect density layer: this is NOT real report data. It generates a plausible,
// naturally-scattered set of severity-colored aggregate clusters within radiusKm of wherever the
// viewer actually is, so the map feels populated for a demo regardless of location — clearly kept
// visually distinct (and should be labeled in the UI) from the small set of real curated reports.
export function generateDemoClusters(center, { count = 18, radiusKm = 50, redCount = 5, yellowCount = 10 } = {}) {
  const rand = mulberry32(seedFromCenter(center))
  const minSeparationKm = radiusKm / 6
  const points = []
  let attempts = 0

  while (points.length < count && attempts < count * 50) {
    attempts++
    const bearing = rand() * Math.PI * 2
    // sqrt() biases samples toward a uniform-per-area distribution instead of clumping near center
    const distanceKm = Math.max(2, Math.sqrt(rand()) * radiusKm)
    const [lat, lon] = offsetPoint(center, distanceKm, bearing)

    const tooClose = points.some((p) => haversineMeters(lat, lon, p.lat, p.lon) / 1000 < minSeparationKm)
    if (tooClose) continue

    const reds = points.filter((p) => p.severity === 'high').length
    const yellows = points.filter((p) => p.severity === 'medium').length
    const severity = reds < redCount ? 'high' : yellows < yellowCount ? 'medium' : 'low'
    const defectCount =
      severity === 'high'
        ? 8 + Math.floor(rand() * 25)
        : severity === 'medium'
        ? 4 + Math.floor(rand() * 14)
        : 2 + Math.floor(rand() * 8)

    points.push({ lat, lon, severity, count: defectCount })
  }

  return points
}
