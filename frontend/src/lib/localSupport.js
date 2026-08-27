const KEY = 'infrascan-supports'

function getSupportedSet() {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function isSupported(observationId) {
  return getSupportedSet().has(observationId)
}

export function toggleSupport(observationId) {
  const set = getSupportedSet()
  if (set.has(observationId)) {
    set.delete(observationId)
  } else {
    set.add(observationId)
  }
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)))
  return set.has(observationId)
}
