import { useEffect, useMemo, useState } from 'react'
import { ActionTileGrid } from './components/ActionTile'
import { BottomNav } from './components/BottomNav'
import { PrimaryButton } from './components/Button'
import { FilterChipRow } from './components/FilterChipRow'
import { CameraIcon, ChartIcon } from './components/icons'
import { HeroCTA } from './components/HeroCTA'
import { InfoDisclosureCard } from './components/InfoDisclosureCard'
import { MapCard } from './components/MapCard'
import { MetricCard } from './components/MetricCard'
import { NearbyReportsList } from './components/NearbyReportsList'
import { ReportCard } from './components/ReportCard'
import { ReportDetail } from './components/ReportDetail'
import { SectionHeader } from './components/SectionHeader'
import { ThemeToggle } from './components/ThemeToggle'
import { STATUS_STYLE } from './constants'
import { findNearby, withAgeAndRepeat } from './lib/reportStats'
import { useDarkMode } from './lib/useDarkMode'

const API = import.meta.env.VITE_API_BASE_URL

function Header({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm">IS</div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">InfraScan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Road Defect Detection</p>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}

function Home({ observations, loading, onSelect, onNavigate }) {
  const recent = observations.slice(0, 3)

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <HeroCTA
        title="See a road defect?"
        subtitle="Snap a photo, we'll geotag it and flag it for review automatically."
      />

      <ActionTileGrid
        tiles={[
          { icon: CameraIcon, label: 'Capture', onClick: () => onNavigate('capture') },
          { icon: ChartIcon, label: 'Dashboard', onClick: () => onNavigate('dashboard') },
        ]}
      />

      <div className="mt-6 space-y-2">
        <SectionHeader>Recent</SectionHeader>
        {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
        {!loading && recent.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No reports yet — submit one from Capture.</p>
        )}
        {recent.map((o) => (
          <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
        ))}
      </div>

      <div className="mt-6">
        <InfoDisclosureCard />
      </div>
    </div>
  )
}

function Dashboard({ observations, loading, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(() => {
    const total = observations.length
    const review = observations.filter((o) => o.status === 'review').length
    const accepted = observations.filter((o) => o.status === 'accepted').length
    const avgConf = total ? Math.round((observations.reduce((s, o) => s + o.confidence, 0) / total) * 100) : 0
    return { total, review, accepted, avgConf }
  }, [observations])

  const filteredObservations = useMemo(
    () => (statusFilter === 'all' ? observations : observations.filter((o) => o.status === statusFilter)),
    [observations, statusFilter]
  )

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

      <div className="mb-4">
        <FilterChipRow value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5 space-y-2 md:max-h-[560px] md:overflow-y-auto">
          <SectionHeader>Recent Reports</SectionHeader>
          {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
          {!loading && filteredObservations.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {observations.length === 0 ? 'No reports yet — submit one from the Capture tab.' : 'No reports match this filter.'}
            </p>
          )}
          {filteredObservations.map((o) => (
            <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
          ))}
        </div>

        <div className="md:w-3/5">
          <MapCard observations={filteredObservations} center={center} />
        </div>
      </div>
    </div>
  )
}

function Capture({ observations, onSubmitted }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const nearby = useMemo(
    () => (location ? findNearby(observations, location.lat, location.lon) : []),
    [observations, location]
  )

  function onFileChange(e) {
    const f = e.target.files[0]
    setFile(f)
    setResult(null)
    setError(null)
    setLocation(null)
    setPreview(f ? URL.createObjectURL(f) : null)
    if (!f) return

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus('idle')
      },
      () => {
        setError('Location permission denied — GPS is required to report.')
        setStatus('idle')
      }
    )
  }

  function submitReport() {
    if (!file || !location) return
    setStatus('uploading')
    setError(null)

    const form = new FormData()
    form.append('image', file)
    form.append('gps_lat', location.lat)
    form.append('gps_lon', location.lon)
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
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <HeroCTA
        title="See a road defect?"
        subtitle="Snap a photo, we'll geotag it and flag it for review automatically."
      />

      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 mb-4 cursor-pointer bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition">
        <input type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
        {preview ? (
          <img src={preview} alt="preview" className="max-h-56 rounded-lg" />
        ) : (
          <>
            <span className="text-3xl">📷</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Tap to take a photo</span>
          </>
        )}
      </label>

      <NearbyReportsList nearby={nearby} />

      <PrimaryButton
        disabled={!file || !location || status === 'uploading' || status === 'locating'}
        onClick={submitReport}
        className="w-full"
      >
        {status === 'locating' && 'Getting location…'}
        {status === 'uploading' && 'Submitting…'}
        {(status === 'idle' || status === 'done') && 'Submit Report'}
      </PrimaryButton>

      {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>}

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
  const [tab, setTab] = useState('home')
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [theme, toggleTheme] = useDarkMode()

  function fetchObservations() {
    setLoading(true)
    fetch(`${API}/observations`)
      .then((res) => res.json())
      .then((data) => {
        setObservations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchObservations()
  }, [])

  const enrichedObservations = useMemo(() => withAgeAndRepeat(observations), [observations])
  const selected = enrichedObservations.find((o) => o.id === selectedId) || null

  function selectTab(t) {
    setSelectedId(null)
    setTab(t)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="pb-16">
        {selected ? (
          <ReportDetail observation={selected} onBack={() => setSelectedId(null)} />
        ) : tab === 'home' ? (
          <Home
            observations={enrichedObservations}
            loading={loading}
            onSelect={setSelectedId}
            onNavigate={selectTab}
          />
        ) : tab === 'dashboard' ? (
          <Dashboard observations={enrichedObservations} loading={loading} onSelect={setSelectedId} />
        ) : (
          <Capture
            observations={observations}
            onSubmitted={() => {
              fetchObservations()
              selectTab('dashboard')
            }}
          />
        )}
      </div>
      <BottomNav tab={tab} setTab={selectTab} />
    </div>
  )
}

export default App
