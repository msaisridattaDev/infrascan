const PREFIX = 'infrascan-comments-'

export function getComments(observationId) {
  try {
    const raw = localStorage.getItem(PREFIX + observationId)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addComment(observationId, text) {
  const comments = getComments(observationId)
  const next = [...comments, { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }]
  localStorage.setItem(PREFIX + observationId, JSON.stringify(next))
  return next
}
