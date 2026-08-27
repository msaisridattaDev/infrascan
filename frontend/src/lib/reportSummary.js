function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

// Template-based draft, not an LLM call: StreetLens has no OpenAI (or similar) API key wired up,
// so this composes a complete, realistic civic-complaint draft from the real data already on
// hand (defect type/severity, the matched road/contractor/tender, GPS, capture time) rather than
// showing a vague placeholder. Swapping this for a real LLM call later is a drop-in change —
// callers only need the returned string.
export function buildReportSummary(observation, jurisdiction) {
  const type = capitalize(observation.defect_type?.replace('_', ' ')) || 'Defect'
  const capturedAt = observation.captured_at
    ? new Date(observation.captured_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    : 'an unspecified date'
  const coords = `${observation.gps_lat?.toFixed(5)}, ${observation.gps_lon?.toFixed(5)}`
  const dlpNote = jurisdiction.dlp_active
    ? `This road is still within its Defect Liability Period (expires ${jurisdiction.dlp_expiry}), so repair cost falls on the contractor, not the public purse.`
    : `This road's Defect Liability Period expired on ${jurisdiction.dlp_expiry}, so repair now falls to the maintaining authority.`

  return [
    `Subject: ${type} reported on ${jurisdiction.road_name}`,
    '',
    `To: ${jurisdiction.responsible_officer}`,
    '',
    `A ${observation.severity} severity ${type.toLowerCase()} was detected on ${jurisdiction.road_name} on ${capturedAt} at coordinates ${coords}, via StreetLens's automated road-defect scanning.`,
    '',
    `Tender reference ${jurisdiction.tender_number}, contractor of record: ${jurisdiction.contractor_name}. ${dlpNote}`,
    '',
    'Requesting inspection and repair at the earliest. Photographic evidence is attached/available via the StreetLens report link.',
  ].join('\n')
}

// A single-line version for the X/Twitter share intent, which has a hard character limit —
// the formal multi-paragraph draft above would just get truncated mid-sentence there.
export function buildTweetSummary(observation, jurisdiction) {
  const type = capitalize(observation.defect_type?.replace('_', ' ')) || 'Defect'
  return `${type} (${observation.severity} severity) on ${jurisdiction.road_name} — tender ${jurisdiction.tender_number}, contractor ${jurisdiction.contractor_name}. Reported via StreetLens.`
}
