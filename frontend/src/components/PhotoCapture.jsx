import { useMemo, useState } from 'react'
import { getDeviceId } from '../lib/deviceId'
import { findNearby } from '../lib/reportStats'
import { STATUS_STYLE } from '../constants'
import { NearbyReportsList } from './NearbyReportsList'
import { PrimaryButton } from './Button'

const API = import.meta.env.VITE_API_BASE_URL

export function PhotoCapture({ observations, onSubmitted }) {
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
    form.append('device_id', getDeviceId())

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
    <div>
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
