import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL

function emptyGroup(key, extra) {
  return { key, defects: 0, attributed: 0, inWarranty: 0, contractorLiable: 0, ...extra }
}

function buildBreakdown(matches, keyFn, extraFn) {
  const groups = new Map()
  for (const m of matches) {
    const key = keyFn(m) || 'Unspecified'
    if (!groups.has(key)) groups.set(key, emptyGroup(key, extraFn?.(m)))
    const g = groups.get(key)
    g.defects += 1
    g.attributed += 1
    if (m.liability_status === 'in_warranty') {
      g.inWarranty += 1
      g.contractorLiable += 1
    }
  }
  return Array.from(groups.values())
    .map((g) => ({ ...g, contractorLiablePct: g.defects ? Math.round((g.contractorLiable / g.defects) * 100) : 0 }))
    .sort((a, b) => b.defects - a.defects)
}

// Every count here comes from a real per-observation jurisdiction lookup against the seeded
// road/contract registry — nothing is aggregated server-side yet (that's a deliberate scope cut:
// frontend first), so this fetches jurisdiction for the full observation list client-side, same
// N+1 pattern the existing accountability rollup already used, just extended to cover ward and
// officer breakdowns too.
export function useAccountability(observations) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (observations.length === 0) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)

    Promise.all(
      observations.map((o) =>
        fetch(`${API}/observations/${o.id}/jurisdiction`)
          .then((res) => res.json())
          .then((jurisdiction) => ({ observation: o, jurisdiction }))
          .catch(() => ({ observation: o, jurisdiction: null }))
      )
    ).then((rows) => {
      if (!cancelled) {
        setResults(rows)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [observations])

  const perObservation = new Map(results.map((r) => [r.observation.id, r.jurisdiction]))
  const confidentMatches = results
    .map((r) => r.jurisdiction)
    .filter((j) => j && j.match_confidence === 'confident')

  const summary = {
    openDefects: observations.length,
    attributed: confidentMatches.length,
    inWarranty: confidentMatches.filter((j) => j.liability_status === 'in_warranty').length,
    corporationLiable: confidentMatches.filter((j) => j.liability_status === 'expired').length,
  }

  const byWard = buildBreakdown(confidentMatches, (m) => m.ward || m.zone)
  const byContractor = buildBreakdown(confidentMatches, (m) => m.contractor_name, (m) => ({
    responsibleOfficer: m.responsible_officer,
  }))
  const byOfficer = buildBreakdown(confidentMatches, (m) => m.responsible_officer || 'Officer attribution unavailable')

  return { perObservation, summary, byWard, byContractor, byOfficer, loading }
}
