import { useEffect, useRef, useState } from 'react'
import { AlertTriangleIcon, CameraIcon, ChartIcon, SendIcon } from './icons'
import { SEVERITY_STYLE } from '../constants'

// Fractions of the demo video's duration at which each moment in the story happens. Tied to the
// video's own playback position (not a fixed timer) so the cards always land in step with what's
// on screen, however long the clip actually is.
const EVENTS = [
  { t: 0.1, step: 1, kind: 'flash' },
  { t: 0.26, step: 2, kind: 'card', icon: SendIcon, tone: 'neutral', title: 'Frame sent for review', desc: 'A snapshot of the road, with its location and time, goes off for a quick check.' },
  { t: 0.46, step: 3, kind: 'card', icon: AlertTriangleIcon, tone: 'high', title: 'Pothole detected', desc: 'Severity: High' },
  { t: 0.6, step: 3, kind: 'flash' },
  { t: 0.74, step: 3, kind: 'card', icon: AlertTriangleIcon, tone: 'medium', title: 'Road crack detected', desc: 'Severity: Medium' },
  { t: 0.9, step: 3, kind: 'card', icon: ChartIcon, tone: 'summary', title: 'Road condition analyzed', desc: '2 issues found on this stretch' },
]

const STEPS = ['Drive', 'Capture frames', 'Send for review', 'Detect issues']

const CARD_TONE = {
  neutral: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200',
  high: SEVERITY_STYLE.high,
  medium: SEVERITY_STYLE.medium,
  summary: 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900',
}

export function HomeDemo() {
  const videoRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const [cards, setCards] = useState([])
  const [flash, setFlash] = useState(false)
  const shownRef = useRef(new Set())
  const flashTimeoutRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function reset() {
      shownRef.current = new Set()
      setCards([])
      setActiveStep(0)
    }

    function handleTimeUpdate() {
      const duration = video.duration
      if (!duration || Number.isNaN(duration)) return
      const frac = video.currentTime / duration

      // The video loops; a big backward jump in position means a new pass just started.
      if (frac < 0.03 && shownRef.current.size > 0) reset()

      for (const event of EVENTS) {
        if (frac < event.t || shownRef.current.has(event.t)) continue
        shownRef.current.add(event.t)
        setActiveStep((s) => Math.max(s, event.step))

        if (event.kind === 'flash') {
          setFlash(true)
          clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = setTimeout(() => setFlash(false), 500)
        } else {
          const { kind: _kind, t: _t, step: _step, ...card } = event
          setCards((prev) => [...prev, card])
        }
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  return (
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">See it in action</p>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
        Just drive — InfraScan handles the rest
      </h2>

      <div className="grid md:grid-cols-[1.1fr_1fr] gap-4 items-start">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
          <video
            ref={videoRef}
            src="/demo-drive.mp4"
            className="w-full aspect-video object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
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

        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  i <= activeStep
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-2 min-h-[220px]">
            {cards.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                Watch the drive on the left — results will appear here as they're found.
              </p>
            )}
            {cards.map((card, i) => (
              <ResultCard key={`${card.title}-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
        Demo footage — shows how a real drive gets turned into road reports, start to finish.
      </p>
    </div>
  )
}

function ResultCard({ card }) {
  const Icon = card.icon
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 animate-[fadeIn_0.3s_ease-out] ${CARD_TONE[card.tone]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{card.title}</p>
        {card.desc && <p className="text-xs opacity-80 leading-tight mt-0.5">{card.desc}</p>}
      </div>
    </div>
  )
}
