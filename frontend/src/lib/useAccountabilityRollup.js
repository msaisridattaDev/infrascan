import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL

export function useAccountabilityRollup(observations) {
  const [rollup, setRollup] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (observations.length === 0) {
      setRollup([])
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      observations.map((o) =>
        fetch(`${API}/observations/${o.id}/jurisdiction`)
          .then((res) => res.json())
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return

      const byContractor = new Map()
      for (const r of results) {
        if (!r || r.match_confidence !== 'confident') continue
        const key = r.contractor_name
        if (!byContractor.has(key)) {
          byContractor.set(key, {
            contractorName: r.contractor_name,
            responsibleOfficer: r.responsible_officer,
            roadNames: new Set(),
            count: 0,
            dlpActiveCount: 0,
          })
        }
        const entry = byContractor.get(key)
        entry.count += 1
        entry.roadNames.add(r.road_name)
        if (r.dlp_active) entry.dlpActiveCount += 1
      }

      const sorted = Array.from(byContractor.values())
        .map((entry) => ({ ...entry, roadNames: Array.from(entry.roadNames) }))
        .sort((a, b) => b.count - a.count)

      setRollup(sorted)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [observations])

  return { rollup, loading }
}
