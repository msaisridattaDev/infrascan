// A small set of generic-but-plausible road names, used only when a report's location doesn't
// resolve to a real matched road (e.g. a live capture far from any seeded segment). Picked
// deterministically from the observation's own id, so a given card always shows the same name
// rather than reshuffling on every render — never a raw lat/lon in the UI.
const PLACEHOLDER_ROADS = [
  'Main Road',
  'Station Road',
  'Ring Road',
  'Market Road',
  'MG Road',
  'Church Street',
  'College Road',
  'Hospital Road',
  'Bridge Road',
  'Mill Road',
]

function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function placeholderRoadName(id) {
  if (!id) return PLACEHOLDER_ROADS[0]
  return PLACEHOLDER_ROADS[hashString(id) % PLACEHOLDER_ROADS.length]
}
