import { useEffect, useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId'
import { haversineMeters } from '../lib/geo'
import { PrimaryButton } from './Button'
import { CameraIcon, PlayIcon, StopIcon } from './icons'
import { ReportCard } from './ReportCard'

const API = import.meta.env.VITE_API_BASE_URL
const FRAME_INTERVAL_MS = 4000

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function DriveCapture() {
  const [driving, setDriving] = useState(false)
  const [error, setError] = useState(null)
  const [frameCount, setFrameCount] = useState(0)
  const [evidence, setEvidence] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [speedKmh, setSpeedKmh] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const watchIdRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const tickIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const locationRef = useRef(null)
  const evidenceIdsRef = useRef(new Set())

  useEffect(() => stopDriving, [])

  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    const loc = locationRef.current
    if (!video || !canvas || !loc || video.videoWidth === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setFrameCount((n) => n + 1)

        const form = new FormData()
        form.append('image', blob, 'frame.jpg')
        form.append('gps_lat', loc.lat)
        form.append('gps_lon', loc.lon)
        form.append('device_id', getDeviceId())

        fetch(`${API}/observations`, { method: 'POST', body: form })
          .then((res) => res.json())
          .then((data) => {
            if (!data?.id || evidenceIdsRef.current.has(data.id)) return
            evidenceIdsRef.current.add(data.id)
            setEvidence((prev) => [data, ...prev])
          })
          .catch(() => {})
      },
      'image/jpeg',
      0.85
    )
  }

  async function startDriving() {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch {
      setError('Camera permission denied — camera access is required for live capture.')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude, t: Date.now() }
        const prev = locationRef.current
        if (prev) {
          const distM = haversineMeters(prev.lat, prev.lon, next.lat, next.lon)
          const dtH = (next.t - prev.t) / 3600000
          if (dtH > 0) setSpeedKmh(distM / 1000 / dtH)
        }
        locationRef.current = next
      },
      () => setError('Location permission denied — GPS is required for live capture.'),
      { enableHighAccuracy: true }
    )

    startTimeRef.current = Date.now()
    frameIntervalRef.current = setInterval(captureFrame, FRAME_INTERVAL_MS)
    tickIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    setDriving(true)
  }

  function stopDriving() {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    frameIntervalRef.current = null
    tickIntervalRef.current = null
    watchIdRef.current = null
    streamRef.current = null
    setDriving(false)
    setSpeedKmh(0)
  }

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video mb-3">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {!driving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
            <CameraIcon className="w-8 h-8" />
            <p className="text-sm">Camera preview appears here while driving</p>
          </div>
        )}

        {driving && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-white">LIVE</span>
          </div>
        )}
      </div>

      {driving && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-center">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatElapsed(elapsedSeconds)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">elapsed</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{frameCount}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">frames</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{evidence.length}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">evidence</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{speedKmh.toFixed(0)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">km/h</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <PrimaryButton onClick={driving ? stopDriving : startDriving} className="flex-1 flex items-center justify-center gap-2">
          {driving ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {driving ? 'Stop drive' : 'Start drive'}
        </PrimaryButton>
        {driving && (
          <button
            onClick={captureFrame}
            className="px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition"
          >
            Capture now
          </button>
        )}
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>}

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        Every {FRAME_INTERVAL_MS / 1000}s, a real frame is captured and sent through the same pipeline as a manual
        photo — dedup, classification, and status routing all apply. There's no live on-device detection overlay;
        results appear below once the backend has classified each frame. Keep this tab open and the screen on
        while driving.
      </p>

      {evidence.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Evidence captured</p>
          {evidence.map((o) => (
            <ReportCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </div>
  )
}
