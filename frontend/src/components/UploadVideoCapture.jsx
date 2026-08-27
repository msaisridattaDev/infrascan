import { useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId'
import { PrimaryButton } from './Button'
import { UploadIcon } from './icons'
import { ReportCard } from './ReportCard'

const API = import.meta.env.VITE_API_BASE_URL
const FRAME_INTERVAL_S = 2
const MAX_FRAMES = 12

async function extractFrames(file, onProgress) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = URL.createObjectURL(file)

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve
    video.onerror = () => reject(new Error('Could not read this video file.'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')

  const timestamps = []
  for (let t = 0.5; t < video.duration && timestamps.length < MAX_FRAMES; t += FRAME_INTERVAL_S) {
    timestamps.push(t)
  }

  const blobs = []
  for (let i = 0; i < timestamps.length; i++) {
    await new Promise((resolve) => {
      video.onseeked = resolve
      video.currentTime = timestamps[i]
    })
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (blob) blobs.push(blob)
    onProgress?.(i + 1, timestamps.length)
  }

  URL.revokeObjectURL(video.src)
  return blobs
}

export function UploadVideoCapture({ onSubmitted }) {
  const [file, setFile] = useState(null)
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [evidence, setEvidence] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  function onFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setEvidence([])
    setError(null)
    setStatus('locating')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus('idle')
      },
      () => {
        setError('Location permission denied — GPS is required to tag this video\'s frames.')
        setStatus('idle')
      }
    )
  }

  async function processVideo() {
    if (!file || !location) return
    setStatus('extracting')
    setError(null)
    setProgress({ done: 0, total: 0 })

    let blobs
    try {
      blobs = await extractFrames(file, (done, total) => setProgress({ done, total }))
    } catch (err) {
      setError(err.message || 'Could not process this video.')
      setStatus('idle')
      return
    }

    setStatus('uploading')
    const deviceId = getDeviceId()
    const seen = new Set()

    for (const blob of blobs) {
      const form = new FormData()
      form.append('image', blob, 'frame.jpg')
      form.append('gps_lat', location.lat)
      form.append('gps_lon', location.lon)
      form.append('device_id', deviceId)

      try {
        const res = await fetch(`${API}/observations`, { method: 'POST', body: form })
        const data = await res.json()
        if (data?.id && !seen.has(data.id)) {
          seen.add(data.id)
          setEvidence((prev) => [data, ...prev])
        }
      } catch {
        // one failed frame shouldn't stop the rest of the batch
      }
    }

    setStatus('done')
    onSubmitted?.()
  }

  const busy = status === 'locating' || status === 'extracting' || status === 'uploading'

  return (
    <div>
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 mb-4 cursor-pointer bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition">
        <input ref={inputRef} type="file" accept="video/*" onChange={onFileChange} className="hidden" />
        <UploadIcon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {file ? file.name : 'Choose a driving video from this device'}
        </span>
      </label>

      <PrimaryButton disabled={!file || !location || busy} onClick={processVideo} className="w-full">
        {status === 'locating' && 'Getting your location…'}
        {status === 'extracting' && `Extracting frames… ${progress.done}/${progress.total || '?'}`}
        {status === 'uploading' && 'Uploading frames…'}
        {(status === 'idle' || status === 'done') && 'Process video'}
      </PrimaryButton>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>}

      {evidence.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Evidence extracted</p>
          {evidence.map((o) => (
            <ReportCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </div>
  )
}
