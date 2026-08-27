import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_BASE_URL

const SEVERITY_COLOR = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#16a34a',
}

const STATUS_STYLE = {
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  recapture: 'bg-red-50 text-red-700 border-red-200',
  new: 'bg-slate-50 text-slate-700 border-slate-200',
}

function Badge({ status, children }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.new}`}>
      {children}
    </span>
  )
}

function Header({ tab, setTab }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">IS</div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">InfraScan</p>
            <p className="text-xs text-slate-500 leading-tight">Road Defect Detection</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${tab === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('capture')}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${tab === 'capture' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Capture
          </button>
        </nav>
      </div>
    </header>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-2xl font-bold text-slate-900" style={accent ? { color: accent } : undefined}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function ReportCard({ o }) {
  const time = o.captured_at ? new Date(o.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="flex gap-3 bg-white rounded-xl border border-slate-200 p-3">
      <img src={o.image_data_url} alt={o.defect_type} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-slate-900 capitalize truncate">{o.defect_type?.replace('_', ' ')}</p>
          <Badge status={o.status}>{o.status}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {Math.round(o.confidence * 100)}% confidence · {o.severity} severity
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {o.gps_lat?.toFixed(4)}, {o.gps_lon?.toFixed(4)} · {time}
        </p>
      </div>
    </div>
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

  const center = observations.length
    ? [observations[0].gps_lat, observations[0].gps_lon]
    : [28.6139, 77.209]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Reports" value={stats.total} />
        <StatCard label="Under Review" value={stats.review} accent="#d97706" />
        <StatCard label="Accepted" value={stats.accepted} accent="#16a34a" />
        <StatCard label="Avg Confidence" value={`${stats.avgConf}%`} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5 space-y-2 md:max-h-[560px] md:overflow-y-auto">
          <p className="text-sm font-medium text-slate-500 mb-1">Recent Reports</p>
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {!loading && observations.length === 0 && (
            <p className="text-sm text-slate-400">No reports yet — submit one from the Capture tab.</p>
          )}
          {observations.map((o) => (
            <ReportCard key={o.id} o={o} />
          ))}
        </div>

        <div className="md:w-3/5 rounded-xl overflow-hidden border border-slate-200" style={{ height: 560 }}>
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {observations.map((o) => (
              <CircleMarker
                key={o.id}
                center={[o.gps_lat, o.gps_lon]}
                radius={9}
                pathOptions={{
                  color: SEVERITY_COLOR[o.severity] || '#64748b',
                  fillColor: SEVERITY_COLOR[o.severity] || '#64748b',
                  fillOpacity: 0.8,
                }}
              >
                <Popup>
                  <p className="font-medium capitalize">{o.defect_type?.replace('_', ' ')} — {o.severity}</p>
                  <p>{Math.round(o.confidence * 100)}% confidence · {o.status}</p>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-5 mb-5">
        <p className="text-lg font-semibold">See a road defect?</p>
        <p className="text-sm text-slate-300 mt-1">Snap a photo, we'll geotag it and flag it for review automatically.</p>
      </div>

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

      <button
        disabled={!file || status === 'uploading' || status === 'locating'}
        onClick={submitReport}
        className="w-full py-3 rounded-xl font-medium text-white bg-slate-900 disabled:bg-slate-300 transition"
      >
        {status === 'locating' && 'Getting location…'}
        {status === 'uploading' && 'Submitting…'}
        {(status === 'idle' || status === 'done') && 'Submit Report'}
      </button>

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
      <Header tab={tab} setTab={setTab} />
      {tab === 'dashboard' ? <Dashboard /> : <Capture onSubmitted={() => setTab('dashboard')} />}
    </div>
  )
}

export default App
