function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

export function buildReportSummary(observation, jurisdiction) {
  const type = capitalize(observation.defect_type?.replace('_', ' ')) || 'Defect'
  return [
    `${type} reported on ${jurisdiction.road_name}.`,
    `Severity: ${observation.severity}.`,
    `Tender ${jurisdiction.tender_number}, contractor ${jurisdiction.contractor_name}, officer ${jurisdiction.responsible_officer}.`,
    'Reported via InfraScan.',
  ].join(' ')
}
