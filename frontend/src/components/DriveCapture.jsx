import { useEffect, useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId'
import { haversineMeters } from '../lib/geo'
import { PrimaryButton } from './Button'
import { ActivityIcon, CameraIcon, PlayIcon, StopIcon } from './icons'
import { MapCard } from './MapCard'
import { ReportCard } from './ReportCard'

const API = import.meta.env.VITE_API_BASE_URL
const FRAME_INTERVAL_MS = 4000
// Jerk = rate of change of acceleration (m/s^3). A pothole or hard bump produces a sharp,
// short spike well above ordinary driving vibration; this threshold is a practical starting
// point, not a calibrated value from real vehicle data.
const JERK_THRESHOLD = 25
const JERK_DEBOUNCE_MS = 3000

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function DriveCapture() {
  const [driving, setDriving] = useState(false)
  const [error, setError] = useState(null)
  const [frameCount, setFrameCount] = useState(0)
  const [jerkEvents, setJerkEvents] = useState(0)
  const [motionSupported, setMotionSupported] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [mapCenter, setMapCenter] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const watchIdRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const tickIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const locationRef = useRef(null)
  const evidenceIdsRef = useRef(new Set())
  const lastAccelRef = useRef(null)
  const lastJerkCaptureRef = useRef(0)
  const motionHandlerRef = useRef(null)

  useEffect(() => stopDriving, [])

  function captureFrame(reason = 'interval') {
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
        if (reason === 'jerk') setJerkEvents((n) => n + 1)

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

  function handleMotion(event) {
    const a = event.acceleration?.x != null ? event.acceleration : event.accelerationIncludingGravity
    if (!a || a.x == null) return

    const magnitude = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)
    const now = Date.now()
    const prev = lastAccelRef.current

    if (prev) {
      const dt = (now - prev.t) / 1000
      if (dt > 0) {
        const jerk = Math.abs(magnitude - prev.magnitude) / dt
        if (jerk > JERK_THRESHOLD && now - lastJerkCaptureRef.current > JERK_DEBOUNCE_MS) {
          lastJerkCaptureRef.current = now
          captureFrame('jerk')
        }
      }
    }
    lastAccelRef.current = { magnitude, t: now }
  }

  async function setupJerkDetection() {
    if (typeof DeviceMotionEvent === 'undefined') {
      setMotionSupported(false)
      return
    }
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission()
        if (result !== 'granted') {
          setMotionSupported(false)
          return
        }
      } catch {
        setMotionSupported(false)
        return
      }
    }
    motionHandlerRef.current = handleMotion
    window.addEventListener('devicemotion', motionHandlerRef.current)
    setMotionSupported(true)
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
        setMapCenter([next.lat, next.lon])
      },
      () => setError('Location permission denied — GPS is required for live capture.'),
      { enableHighAccuracy: true }
    )

    setFrameCount(0)
    setJerkEvents(0)
    lastAccelRef.current = null
    lastJerkCaptureRef.current = 0
    await setupJerkDetection()

    startTimeRef.current = Date.now()
    frameIntervalRef.current = setInterval(() => captureFrame('interval'), FRAME_INTERVAL_MS)
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
    if (motionHandlerRef.current) window.removeEventListener('devicemotion', motionHandlerRef.current)
    frameIntervalRef.current = null
    tickIntervalRef.current = null
    watchIdRef.current = null
    streamRef.current = null
    motionHandlerRef.current = null
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
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
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
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
              <ActivityIcon className="w-3 h-3" />
              {jerkEvents}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">jerk events</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {motionSupported === null ? '—' : motionSupported ? 'On' : 'Off'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">motion sensor</p>
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
            onClick={() => captureFrame('manual')}
            className="px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition"
          >
            Capture now
          </button>
        )}
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>}

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        Every {FRAME_INTERVAL_MS / 1000}s, a real frame is captured on a timer. When your phone's motion sensor is
        available, a sudden jerk (the kind a pothole or hard bump causes) triggers an extra capture right away,
        using your device's real accelerometer — not a simulated detector. Every captured frame runs through the
        same pipeline as a manual photo (dedup, classification, status routing). There's no live on-device
        bounding-box overlay; results appear below once the backend has classified each frame. Keep this tab open
        and the screen on while driving.
      </p>

      {driving && mapCenter && (
        <div className="mt-3">
          <MapCard observations={evidence} center={mapCenter} zoom={16} height={220} showMe />
        </div>
      )}

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
