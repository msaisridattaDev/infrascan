import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL

export function useJurisdiction(observationId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!observationId) return
    setLoading(true)
    fetch(`${API}/observations/${observationId}/jurisdiction`)
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [observationId])

  return { data, loading }
}
