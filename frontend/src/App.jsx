import { useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { SecondaryButton } from './components/Button'
import { DriveCapture } from './components/DriveCapture'
import { FilterChipRow } from './components/FilterChipRow'
import { HeroCTA } from './components/HeroCTA'
import { HomeDemo } from './components/HomeDemo'
import { PinIcon } from './components/icons'
import { InfoDisclosureCard } from './components/InfoDisclosureCard'
import { LiabilityMethodology } from './components/LiabilityMethodology'
import { MapCard } from './components/MapCard'
import { MetricCard } from './components/MetricCard'
import { PhotoCapture } from './components/PhotoCapture'
import { RoadWatchBreakdown } from './components/RoadWatchBreakdown'
import { UploadVideoCapture } from './components/UploadVideoCapture'
import { ReportCard } from './components/ReportCard'
import { ReportDetail } from './components/ReportDetail'
import { SectionHeader } from './components/SectionHeader'
import { ThemeToggle } from './components/ThemeToggle'
import { generateDemoClusters } from './lib/demoDensity'
import { getDeviceId, resetDeviceId } from './lib/deviceId'
import { useAccountability } from './lib/useAccountability'
import { withAgeAndRepeat } from './lib/reportStats'
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

const HOME_MODES = [
  { id: 'drive', label: 'Drive' },
  { id: 'video', label: 'Upload Video' },
  { id: 'photo', label: 'Single Photo' },
]

const HOME_SUBTITLES = {
  drive: "Start a drive and we'll capture, geotag, and review frames automatically.",
  video: "Upload a driving video and we'll pull frames from it for review, same as a live drive.",
  photo: "Snap a photo, we'll geotag it and flag it for review automatically.",
}

function Home({ observations, onSubmitted }) {
  const [mode, setMode] = useState('drive')

  return (
    <div>
      <div className="max-w-md mx-auto px-4 pt-6">
        <HeroCTA title="See a road defect?" subtitle={HOME_SUBTITLES[mode]} />

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4">
          {HOME_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${mode === m.id ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'drive' && <DriveCapture />}
        {mode === 'video' && <UploadVideoCapture onSubmitted={onSubmitted} />}
        {mode === 'photo' && <PhotoCapture observations={observations} onSubmitted={onSubmitted} />}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <HomeDemo />
      </div>

      <div className="max-w-md mx-auto px-4 pb-6">
        <InfoDisclosureCard />
      </div>
    </div>
  )
}

// No default center is hardcoded to any specific city — this is only the fallback shown for the
// brief moment before geolocation resolves (or if the user denies permission), zoomed out enough
// to read as "waiting for your location," not as a real answer.
const INDIA_CENTER = [22.3511, 78.6677]
const DEMO_RADIUS_KM = 50

function Explore({ observations, loading, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [myLocation, setMyLocation] = useState(null)
  const [locating, setLocating] = useState(true)

  function requestLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  // Ask for location automatically on arrival — this is the primary way Explore centers itself,
  // not something the user has to opt into with an extra tap.
  useEffect(() => {
    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const demoObservations = useMemo(() => observations.filter((o) => o.demo_tag), [observations])

  const filteredObservations = useMemo(
    () => (statusFilter === 'all' ? demoObservations : demoObservations.filter((o) => o.status === statusFilter)),
    [demoObservations, statusFilter]
  )

  const densityPoints = useMemo(
    () => (myLocation ? generateDemoClusters([myLocation.lat, myLocation.lon], { count: 18, radiusKm: DEMO_RADIUS_KM }) : []),
    [myLocation]
  )

  const center = myLocation ? [myLocation.lat, myLocation.lon] : INDIA_CENTER

  return (
    <div>
      <div className="relative h-[58vh] sm:h-[62vh] md:h-[68vh]">
        <MapCard
          observations={filteredObservations}
          center={center}
          zoom={myLocation ? 10 : 4}
          height="100%"
          rounded={false}
          showMe={!!myLocation}
          densityPoints={densityPoints}
          radiusCircle={myLocation ? { center, radiusM: DEMO_RADIUS_KM * 1000 } : null}
        />

        <button
          onClick={requestLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center"
        >
          <PinIcon className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${locating ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div className="relative -mt-4 rounded-t-2xl bg-slate-50 dark:bg-slate-900">
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-6">
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 mb-4">
            Rings on the map are an illustrative density estimate within {DEMO_RADIUS_KM}km of your location, not live
            reports. The cards below are this preview's real curated demo reports.
          </p>

          <div className="mb-3">
            <FilterChipRow value={statusFilter} onChange={setStatusFilter} />
          </div>

          <SectionHeader>Demo Reports</SectionHeader>
          {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
          {!loading && filteredObservations.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">No demo reports match this filter.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredObservations.map((o) => (
              <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Temporary demo override: shows only the curated PT3/PT4 entries rather than this device's real
// captures (o.device_id === getDeviceId()), per the current demo scope. The device-scoped filter
// is the real long-term design — swap this back once the curated-demo phase is done.
const MY_REPORTS_DEMO_TAGS = ['PT3', 'PT4']

function MyReports({ observations, loading, onSelect }) {
  const mine = useMemo(() => observations.filter((o) => MY_REPORTS_DEMO_TAGS.includes(o.demo_tag)), [observations])

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <SectionHeader>My Reports</SectionHeader>
      {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
      {!loading && mine.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">No demo reports selected for My Reports yet.</p>
      )}
      <div className="space-y-2">
        {mine.map((o) => (
          <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
        ))}
      </div>
    </div>
  )
}

function RoadWatch({ observations, loading }) {
  const [deviceId, setDeviceId] = useState(() => getDeviceId())
  const { summary, byWard, byContractor, byOfficer, loading: accLoading } = useAccountability(observations)

  function handleReset() {
    resetDeviceId()
    setDeviceId(getDeviceId())
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <SectionHeader>RoadWatch</SectionHeader>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Defect liability exposure</h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Where a contract is still under warranty, the repair is the contractor's obligation. Everything else falls to
        the corporation.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">
        <MetricCard label="Open defects" value={loading || accLoading ? '—' : summary.openDefects} />
        <MetricCard label="Attributed to a contract" value={loading || accLoading ? '—' : summary.attributed} />
        <MetricCard label="In liability period" value={loading || accLoading ? '—' : summary.inWarranty} accent="#16a34a" />
        <MetricCard label="Corporation's own cost" value={loading || accLoading ? '—' : summary.corporationLiable} accent="#d97706" />
      </div>

      <div className="mb-4">
        <RoadWatchBreakdown byWard={byWard} byContractor={byContractor} byOfficer={byOfficer} loading={loading || accLoading} />
      </div>

      <div className="mb-4">
        <LiabilityMethodology />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">This device</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 break-all font-mono">{deviceId}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          InfraScan doesn't use accounts or logins — your reports are tied to this browser only, findable under My
          Reports.
        </p>
        <div className="mt-3">
          <SecondaryButton onClick={handleReset}>Reset this device's identity</SecondaryButton>
        </div>
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
          <RoadWatch observations={observations} loading={loading} />
        )}
      </div>
      <BottomNav tab={tab} setTab={selectTab} />
    </div>
  )
}

export default App
