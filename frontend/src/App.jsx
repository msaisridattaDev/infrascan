import { useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { PrimaryButton } from './components/Button'
import { HeroCTA } from './components/HeroCTA'
import { MapCard } from './components/MapCard'
import { MetricCard } from './components/MetricCard'
import { ReportCard } from './components/ReportCard'
import { SectionHeader } from './components/SectionHeader'
import { STATUS_STYLE } from './constants'
import { withAgeAndRepeat } from './lib/reportStats'

const API = import.meta.env.VITE_API_BASE_URL

function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">IS</div>
        <div>
          <p className="font-semibold text-slate-900 leading-tight">InfraScan</p>
          <p className="text-xs text-slate-500 leading-tight">Road Defect Detection</p>
        </div>
      </div>
    </header>
  )
}

function Dashboard() {
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/observations`)
      .then((res) => res.json())
      .then((data) => {
        setObservations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const total = observations.length
    const review = observations.filter((o) => o.status === 'review').length
    const accepted = observations.filter((o) => o.status === 'accepted').length
    const avgConf = total ? Math.round((observations.reduce((s, o) => s + o.confidence, 0) / total) * 100) : 0
    return { total, review, accepted, avgConf }
  }, [observations])

  const enrichedObservations = useMemo(() => withAgeAndRepeat(observations), [observations])

  const center = observations.length
    ? [observations[0].gps_lat, observations[0].gps_lon]
    : [28.6139, 77.209]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Reports" value={stats.total} />
        <MetricCard label="Under Review" value={stats.review} accent="#d97706" />
        <MetricCard label="Accepted" value={stats.accepted} accent="#16a34a" />
        <MetricCard label="Avg Confidence" value={`${stats.avgConf}%`} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5 space-y-2 md:max-h-[560px] md:overflow-y-auto">
          <SectionHeader>Recent Reports</SectionHeader>
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {!loading && observations.length === 0 && (
            <p className="text-sm text-slate-400">No reports yet — submit one from the Capture tab.</p>
          )}
          {enrichedObservations.map((o) => (
            <ReportCard key={o.id} o={o} />
          ))}
        </div>

        <div className="md:w-3/5">
          <MapCard observations={observations} center={center} />
        </div>
      </div>
    </div>
  )
}

function Capture({ onSubmitted }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function onFileChange(e) {
    const f = e.target.files[0]
    setFile(f)
    setResult(null)
    setError(null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function submitReport() {
    if (!file) return
    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('uploading')
        const form = new FormData()
        form.append('image', file)
        form.append('gps_lat', pos.coords.latitude)
        form.append('gps_lon', pos.coords.longitude)
        form.append('device_id', 'web-capture')

        fetch(`${API}/observations`, { method: 'POST', body: form })
          .then((res) => res.json())
          .then((data) => {
            setResult(data)
            setStatus('done')
            onSubmitted?.()
          })
          .catch(() => {
            setError('Upload failed — is the backend reachable?')
            setStatus('idle')
          })
      },
      () => {
        setError('Location permission denied — GPS is required to report.')
        setStatus('idle')
      }
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <HeroCTA
        title="See a road defect?"
        subtitle="Snap a photo, we'll geotag it and flag it for review automatically."
      />

      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-8 mb-4 cursor-pointer bg-white hover:border-slate-400 transition">
        <input type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
        {preview ? (
          <img src={preview} alt="preview" className="max-h-56 rounded-lg" />
        ) : (
          <>
            <span className="text-3xl">📷</span>
            <span className="text-sm text-slate-500">Tap to take a photo</span>
          </>
        )}
      </label>

      <PrimaryButton
        disabled={!file || status === 'uploading' || status === 'locating'}
        onClick={submitReport}
        className="w-full"
      >
        {status === 'locating' && 'Getting location…'}
        {status === 'uploading' && 'Submitting…'}
        {(status === 'idle' || status === 'done') && 'Submit Report'}
      </PrimaryButton>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {result && (
        <div className={`mt-4 rounded-xl border p-4 ${STATUS_STYLE[result.status] || STATUS_STYLE.new}`}>
          <p className="font-semibold capitalize">{result.defect_type?.replace('_', ' ')}</p>
          <p className="text-sm mt-1">Severity: {result.severity}</p>
          <p className="text-sm">Confidence: {Math.round(result.confidence * 100)}%</p>
          <p className="text-sm">Status: {result.status}</p>
        </div>
      )}
    </div>
  )
}

function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="pb-16">
        {tab === 'dashboard' ? <Dashboard /> : <Capture onSubmitted={() => setTab('dashboard')} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}

export default App
