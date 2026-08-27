const STORAGE_KEY = 'infrascan-device-id'

export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function resetDeviceId() {
  localStorage.removeItem(STORAGE_KEY)
}
