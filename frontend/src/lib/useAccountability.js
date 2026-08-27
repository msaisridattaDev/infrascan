function emptyGroup(key, extra) {
  return { key, defects: 0, attributed: 0, inWarranty: 0, contractorLiable: 0, ...extra }
}

function buildBreakdown(matched, keyFn, extraFn) {
  const groups = new Map()
  for (const o of matched) {
    const key = keyFn(o) || 'Unspecified'
    if (!groups.has(key)) groups.set(key, emptyGroup(key, extraFn?.(o)))
    const g = groups.get(key)
    g.defects += 1
    g.attributed += 1
    if (o.liability_status === 'in_warranty') {
      g.inWarranty += 1
      g.contractorLiable += 1
    }
  }
  return Array.from(groups.values())
    .map((g) => ({ ...g, contractorLiablePct: g.defects ? Math.round((g.contractorLiable / g.defects) * 100) : 0 }))
    .sort((a, b) => b.defects - a.defects)
}

// road_name/ward/contractor_name/liability_status now arrive pre-resolved on every observation
// (the backend matches each one against the seeded road register at serialize time), so this is
// a pure client-side aggregation over data already fetched — no per-observation jurisdiction
// fetch needed, unlike the earlier N+1 version.
export function useAccountability(observations) {
  const matched = observations.filter((o) => o.road_name)

  const summary = {
    openDefects: observations.length,
    attributed: matched.length,
    inWarranty: matched.filter((o) => o.liability_status === 'in_warranty').length,
    corporationLiable: matched.filter((o) => o.liability_status === 'expired').length,
  }

  const byWard = buildBreakdown(matched, (o) => o.ward)
  const byContractor = buildBreakdown(matched, (o) => o.contractor_name, (o) => ({
    responsibleOfficer: o.responsible_officer,
  }))
  const byOfficer = buildBreakdown(matched, (o) => o.responsible_officer || 'Officer attribution unavailable')

  return { summary, byWard, byContractor, byOfficer, loading: false }
}
