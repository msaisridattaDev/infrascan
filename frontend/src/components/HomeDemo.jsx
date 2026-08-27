import { useEffect, useRef, useState } from 'react'
import { ActivityIcon, AlertTriangleIcon, CameraIcon, ClockIcon, PinIcon } from './icons'

// Fractions of the demo video's own duration — tied to actual playback position, not a fixed
// timer, so the signal cards always land in step with what's on screen regardless of clip length.
const EVENTS = [
  { t: 0.08, signal: 'frame', value: '1' },
  { t: 0.22, signal: 'jerk', value: 'Detected' },
  { t: 0.3, signal: 'location', value: 'Locked' },
  { t: 0.3, signal: 'timestamp', value: true },
  { t: 0.55, signal: 'road', value: 'Pothole · High' },
  { t: 0.6, signal: 'frame', value: '2' },
  { t: 0.75, signal: 'road', value: 'Crack · Medium' },
  { t: 0.92, signal: 'road', value: '2 issues found' },
]

const SIGNAL_META = {
  frame: { icon: CameraIcon, label: 'Frame' },
  jerk: { icon: ActivityIcon, label: 'Jerk' },
  location: { icon: PinIcon, label: 'Location' },
  timestamp: { icon: ClockIcon, label: 'Timestamp' },
  road: { icon: AlertTriangleIcon, label: 'Road condition' },
}

const EMPTY_SIGNALS = { frame: null, jerk: null, location: null, timestamp: null, road: null }

export function HomeDemo() {
  const videoRef = useRef(null)
  const [signals, setSignals] = useState(EMPTY_SIGNALS)
  const [flash, setFlash] = useState(false)
  const shownRef = useRef(new Set())
  const flashTimeoutRef = useRef(null)
  const clockRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 1.75

    function reset() {
      shownRef.current = new Set()
      setSignals(EMPTY_SIGNALS)
      clearInterval(clockRef.current)
      clockRef.current = null
    }

    function tickClock() {
      setSignals((prev) => ({ ...prev, timestamp: new Date().toLocaleTimeString([], { hour12: false }) }))
    }

    function handleTimeUpdate() {
      const duration = video.duration
      if (!duration || Number.isNaN(duration)) return
      const frac = video.currentTime / duration

      if (frac < 0.03 && shownRef.current.size > 0) reset()

      for (const event of EVENTS) {
        const key = `${event.t}-${event.signal}`
        if (frac < event.t || shownRef.current.has(key)) continue
        shownRef.current.add(key)

        if (event.signal === 'frame') {
          setFlash(true)
          clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = setTimeout(() => setFlash(false), 400)
        }

        if (event.signal === 'timestamp') {
          tickClock()
          clockRef.current = setInterval(tickClock, 1000)
        } else {
          setSignals((prev) => ({ ...prev, [event.signal]: event.value }))
        }
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      clearTimeout(flashTimeoutRef.current)
      clearInterval(clockRef.current)
    }
  }, [])

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
        <video ref={videoRef} src="/demo-drive.mp4" className="w-full aspect-video object-cover" autoPlay muted loop playsInline />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Demo drive
        </div>
        <div
          className={`absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`}
        >
          <CameraIcon className="w-3 h-3" />
          Frame captured
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
        {Object.entries(SIGNAL_META).map(([key, { icon: Icon, label }]) => {
          const value = signals[key]
          const active = value != null
          return (
            <div
              key={key}
              className={`rounded-xl border p-2.5 transition-colors duration-300 ${
                active
                  ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500'}`} />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider truncate ${active ? 'text-white/70 dark:text-slate-900/60' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {label}
                </span>
              </div>
              <p className={`text-xs font-semibold leading-tight mt-1 truncate ${active ? 'text-white dark:text-slate-900' : 'text-slate-300 dark:text-slate-600'}`}>
                {value || '—'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
