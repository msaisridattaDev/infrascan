import { useEffect, useMemo, useState } from 'react'
import { AccountabilityRollup } from './components/AccountabilityRollup'
import { BottomNav } from './components/BottomNav'
import { SecondaryButton } from './components/Button'
import { DriveCapture } from './components/DriveCapture'
import { FilterChipRow } from './components/FilterChipRow'
import { HeroCTA } from './components/HeroCTA'
import { PinIcon } from './components/icons'
import { InfoDisclosureCard } from './components/InfoDisclosureCard'
import { MapCard } from './components/MapCard'
import { MetricCard } from './components/MetricCard'
import { PhotoCapture } from './components/PhotoCapture'
import { ReportCard } from './components/ReportCard'
import { ReportDetail } from './components/ReportDetail'
import { SectionHeader } from './components/SectionHeader'
import { ThemeToggle } from './components/ThemeToggle'
import { getDeviceId, resetDeviceId } from './lib/deviceId'
import { useAccountabilityRollup } from './lib/useAccountabilityRollup'
import { findNearby, withAgeAndRepeat } from './lib/reportStats'
import { useDarkMode } from './lib/useDarkMode'

const RADIUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '1', label: '1 km' },
  { id: '5', label: '5 km' },
  { id: '10', label: '10 km' },
]

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

function Home({ observations, onSubmitted }) {
  const [mode, setMode] = useState('drive')

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <HeroCTA
        title="See a road defect?"
        subtitle={
          mode === 'drive'
            ? "Start a drive and we'll capture, geotag, and review frames automatically."
            : "Snap a photo, we'll geotag it and flag it for review automatically."
        }
      />

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4">
        <button
          onClick={() => setMode('drive')}
          className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${mode === 'drive' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Drive
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${mode === 'photo' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Single Photo
        </button>
      </div>

      {mode === 'drive' ? (
        <DriveCapture />
      ) : (
        <PhotoCapture observations={observations} onSubmitted={onSubmitted} />
      )}

      <div className="mt-6">
        <InfoDisclosureCard />
      </div>
    </div>
  )
}

function Explore({ observations, loading, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [myLocation, setMyLocation] = useState(null)
  const [radiusKm, setRadiusKm] = useState('all')
  const [locating, setLocating] = useState(false)

  const { rollup, loading: rollupLoading } = useAccountabilityRollup(observations)

  function useMyLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setRadiusKm('5')
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const stats = useMemo(() => {
    const total = observations.length
    const review = observations.filter((o) => o.status === 'review').length
    const accepted = observations.filter((o) => o.status === 'accepted').length
    const avgConf = total ? Math.round((observations.reduce((s, o) => s + o.confidence, 0) / total) * 100) : 0
    return { total, review, accepted, avgConf }
  }, [observations])

  const statusFiltered = useMemo(
    () => (statusFilter === 'all' ? observations : observations.filter((o) => o.status === statusFilter)),
    [observations, statusFilter]
  )

  const filteredObservations = useMemo(() => {
    if (!myLocation || radiusKm === 'all') return statusFiltered
    return findNearby(statusFiltered, myLocation.lat, myLocation.lon, Number(radiusKm) * 1000)
  }, [statusFiltered, myLocation, radiusKm])

  const center = myLocation
    ? [myLocation.lat, myLocation.lon]
    : observations.length
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

      {!myLocation ? (
        <button
          onClick={useMyLocation}
          disabled={locating}
          className="w-full flex items-center gap-3 mb-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition text-left"
        >
          <span className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center flex-shrink-0">
            <PinIcon className="w-4 h-4 text-white dark:text-slate-900" />
          </span>
          <span>
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              {locating ? 'Locating…' : 'Browse reports near me'}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Use your current location to filter by distance
            </span>
          </span>
        </button>
      ) : (
        <div className="mb-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
              <PinIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Showing reports near you
            </span>
            <button
              onClick={() => setMyLocation(null)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <FilterChipRow value={radiusKm} onChange={setRadiusKm} options={RADIUS_OPTIONS} />
        </div>
      )}

      <div className="mb-3">
        <FilterChipRow value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5 space-y-2 md:max-h-[560px] md:overflow-y-auto">
          <SectionHeader>Recent Reports</SectionHeader>
          {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
          {!loading && filteredObservations.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {observations.length === 0 ? 'No reports yet — submit one from Home.' : 'No reports match this filter.'}
            </p>
          )}
          {filteredObservations.map((o) => (
            <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
          ))}
        </div>

        <div className="md:w-3/5">
          <MapCard observations={filteredObservations} center={center} />
          <AccountabilityRollup rollup={rollup} loading={rollupLoading} />
        </div>
      </div>
    </div>
  )
}

function MyReports({ observations, loading, onSelect }) {
  const mine = useMemo(() => observations.filter((o) => o.device_id === getDeviceId()), [observations])

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <SectionHeader>My Reports</SectionHeader>
      {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
      {!loading && mine.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          You haven't submitted any reports from this device yet.
        </p>
      )}
      <div className="space-y-2">
        {mine.map((o) => (
          <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
        ))}
      </div>
    </div>
  )
}

function Me({ observations }) {
  const [deviceId, setDeviceId] = useState(() => getDeviceId())
  const myCount = useMemo(() => observations.filter((o) => o.device_id === deviceId).length, [observations, deviceId])

  function handleReset() {
    resetDeviceId()
    setDeviceId(getDeviceId())
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <SectionHeader>Me</SectionHeader>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">This device</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-all font-mono">{deviceId}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{myCount} report{myCount === 1 ? '' : 's'} from this device</p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          InfraScan doesn't use accounts or logins — reports are tied to this browser only, not to you personally.
        </p>
      </div>

      <div className="mt-4">
        <SecondaryButton className="w-full" onClick={handleReset}>
          Reset this device's identity
        </SecondaryButton>
      </div>
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
            observations={observations}
            onSubmitted={() => {
              fetchObservations()
              selectTab('explore')
            }}
          />
        ) : tab === 'explore' ? (
          <Explore observations={enrichedObservations} loading={loading} onSelect={setSelectedId} />
        ) : tab === 'reports' ? (
          <MyReports observations={enrichedObservations} loading={loading} onSelect={setSelectedId} />
        ) : (
          <Me observations={observations} />
        )}
      </div>
      <BottomNav tab={tab} setTab={selectTab} />
    </div>
  )
}

export default App
