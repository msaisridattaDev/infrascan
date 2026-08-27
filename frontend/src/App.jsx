import { useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { SecondaryButton } from './components/Button'
import { DriveCapture } from './components/DriveCapture'
import { FilterChipRow } from './components/FilterChipRow'
import { HeroCTA } from './components/HeroCTA'
import { PinIcon, XIcon } from './components/icons'
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
import { getDeviceId, resetDeviceId } from './lib/deviceId'
import { useAccountability } from './lib/useAccountability'
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
    <div className="max-w-md mx-auto px-4 py-6">
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

      <div className="mt-6">
        <InfoDisclosureCard />
      </div>
    </div>
  )
}

const LIABILITY_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'attributed', label: 'Attributed' },
  { id: 'unattributed', label: 'Unattributed' },
  { id: 'contractor_liable', label: 'Contractor-liable' },
  { id: 'corporation_liable', label: 'Corporation-liable' },
]

function Explore({ observations, loading, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [liabilityFilter, setLiabilityFilter] = useState('all')
  const [myLocation, setMyLocation] = useState(null)
  const [radiusKm, setRadiusKm] = useState('all')
  const [locating, setLocating] = useState(false)

  const { perObservation, byWard, byContractor, byOfficer, loading: accLoading } = useAccountability(observations)

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

  const nearbyFiltered = useMemo(() => {
    if (!myLocation || radiusKm === 'all') return statusFiltered
    return findNearby(statusFiltered, myLocation.lat, myLocation.lon, Number(radiusKm) * 1000)
  }, [statusFiltered, myLocation, radiusKm])

  const filteredObservations = useMemo(() => {
    if (liabilityFilter === 'all') return nearbyFiltered
    return nearbyFiltered.filter((o) => {
      const j = perObservation.get(o.id)
      if (liabilityFilter === 'attributed') return j?.match_confidence === 'confident'
      if (liabilityFilter === 'unattributed') return !j || j.match_confidence !== 'confident'
      if (liabilityFilter === 'contractor_liable') return j?.liability_status === 'in_warranty'
      if (liabilityFilter === 'corporation_liable') return j?.liability_status === 'expired'
      return true
    })
  }, [nearbyFiltered, liabilityFilter, perObservation])

  const center = myLocation
    ? [myLocation.lat, myLocation.lon]
    : observations.length
    ? [observations[0].gps_lat, observations[0].gps_lon]
    : [28.6139, 77.209]

  return (
    <div>
      <div className="relative h-[52vh] sm:h-[58vh] md:h-[65vh]">
        <MapCard
          observations={filteredObservations}
          center={center}
          zoom={myLocation ? 13 : 5}
          height="100%"
          showMe={!!myLocation}
          cluster
          radiusCircle={myLocation && radiusKm !== 'all' ? { center, radiusM: Number(radiusKm) * 1000 } : null}
        />

        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          {!myLocation ? (
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="pointer-events-auto self-start flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              <PinIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {locating ? 'Locating…' : 'Near me'}
            </button>
          ) : (
            <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 self-start">
              <PinIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {radiusKm === 'all' ? 'Near you' : `${filteredObservations.length} within ${radiusKm}km`}
              </span>
              <div className="flex gap-1 ml-1">
                {RADIUS_OPTIONS.filter((o) => o.id !== 'all').map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setRadiusKm(o.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${radiusKm === o.id ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMyLocation(null)}
                className="ml-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pointer-events-auto overflow-x-auto -mx-3 px-3">
            <div className="inline-flex gap-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 rounded-full p-1">
              {LIABILITY_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setLiabilityFilter(o.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${liabilityFilter === o.id ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mt-4 rounded-t-2xl bg-slate-50 dark:bg-slate-900">
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <MetricCard label="Total Reports" value={stats.total} />
            <MetricCard label="Under Review" value={stats.review} accent="#d97706" />
            <MetricCard label="Accepted" value={stats.accepted} accent="#16a34a" />
            <MetricCard label="Avg Confidence" value={`${stats.avgConf}%`} />
          </div>

          <div className="mb-3">
            <FilterChipRow value={statusFilter} onChange={setStatusFilter} />
          </div>

          <SectionHeader>Recent Reports</SectionHeader>
          {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
          {!loading && filteredObservations.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {observations.length === 0 ? 'No reports yet — submit one from Home.' : 'No reports match this filter.'}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredObservations.map((o) => (
              <ReportCard key={o.id} o={o} onClick={() => onSelect(o.id)} />
            ))}
          </div>

          <div className="mt-6">
            <RoadWatchBreakdown byWard={byWard} byContractor={byContractor} byOfficer={byOfficer} loading={accLoading} />
          </div>
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
