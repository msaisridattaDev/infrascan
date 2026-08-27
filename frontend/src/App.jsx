import { useEffect, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_BASE_URL

function CaptureView() {
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
    <div className="capture">
      <h2>Report a Road Defect</h2>

      <label className="capture-input">
        <input type="file" accept="image/*" capture="environment" onChange={onFileChange} />
        {preview ? <img src={preview} alt="preview" className="preview" /> : <span>Tap to take a photo</span>}
      </label>

      <button disabled={!file || status === 'uploading' || status === 'locating'} onClick={submitReport}>
        {status === 'locating' && 'Getting location...'}
        {status === 'uploading' && 'Submitting...'}
        {(status === 'idle' || status === 'done') && 'Submit Report'}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className={`result result-${result.status}`}>
          <p className="defect-type">{result.defect_type}</p>
          <p>Severity: {result.severity}</p>
          <p>Confidence: {Math.round(result.confidence * 100)}%</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  )
}

function QueueView() {
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

  if (loading) return <p>Loading...</p>
  if (observations.length === 0) return <p>No reports yet — submit one from the Capture tab.</p>

  return (
    <div className="queue">
      <h2>Reports ({observations.length})</h2>
      {observations.map((o) => (
        <div key={o.id} className={`queue-item status-${o.status}`}>
          <img src={o.image_data_url} alt={o.defect_type} />
          <div>
            <p className="defect-type">{o.defect_type} — {o.severity}</p>
            <p>{Math.round(o.confidence * 100)}% confidence — {o.status}</p>
            <p className="gps">{o.gps_lat.toFixed(5)}, {o.gps_lon.toFixed(5)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [tab, setTab] = useState('capture')

  return (
    <main className="app">
      <header>
        <h1>InfraScan</h1>
        <nav>
          <button className={tab === 'capture' ? 'active' : ''} onClick={() => setTab('capture')}>Capture</button>
          <button className={tab === 'queue' ? 'active' : ''} onClick={() => setTab('queue')}>Queue</button>
        </nav>
      </header>
      {tab === 'capture' ? <CaptureView /> : <QueueView />}
    </main>
  )
}

export default App
