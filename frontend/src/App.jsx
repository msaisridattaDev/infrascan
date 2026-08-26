import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus('unreachable'))
  }, [])

  return (
    <main className="placeholder">
      <h1>InfraScan — coming online</h1>
      <p>Backend status: {backendStatus}</p>
    </main>
  )
}

export default App
