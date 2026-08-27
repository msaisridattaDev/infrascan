import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL

// Real counts from the seeded road/contract register — not aggregated from reports, so this
// stays meaningful even when very few observations have been captured yet.
export function useCoverage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/coverage`)
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}
