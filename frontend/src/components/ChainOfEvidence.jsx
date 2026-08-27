function Step({ title, detail }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
        <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
      </div>
      <div className="pb-3 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{title}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

// A record of what StreetLens actually did to produce this report — every line here maps to a
// real field on the observation or a real backend call, not a simulated pipeline. Archive entries
// (seeded from real photographs, device_id is null) are labeled as such rather than implying they
// went through live capture.
export function ChainOfEvidence({ observation: o, jurisdiction }) {
  const isArchive = !o.device_id
  const capturedAt = o.captured_at
    ? new Date(o.captured_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'unknown time'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Chain of evidence</p>

      <Step
        title={isArchive ? 'Sourced from a real photograph' : 'Frame captured on-device'}
        detail={
          isArchive
            ? `Archive entry — a real, freely-licensed photograph of this road defect, dated ${capturedAt}.`
            : `Captured via StreetLens (photo, drive, or video upload) at ${capturedAt}.`
        }
      />
      <Step
        title="Geotagged"
        detail={`${o.gps_lat?.toFixed(5)}, ${o.gps_lon?.toFixed(5)} — from the capturing device's GPS.`}
      />
      <Step
        title={isArchive ? 'Labeled' : 'Classified'}
        detail={
          isArchive
            ? `Defect type and severity set from the source photograph, not run through the live classifier.`
            : `StreetLens's Tier-2 classifier (currently a placeholder pending a real vision model) returned ${o.defect_type?.replace('_', ' ')}, ${o.severity} severity, ${Math.round(o.confidence * 100)}% confidence.`
        }
      />
      {jurisdiction && jurisdiction.match_confidence === 'confident' ? (
        <Step
          title="Matched to the road register"
          detail={`${jurisdiction.road_name} — ${jurisdiction.distance_m}m from the nearest seeded segment (within the 50m match radius).`}
        />
      ) : (
        <Step
          title="Road register match"
          detail={
            jurisdiction
              ? `No seeded segment within 50m (nearest is ${jurisdiction.distance_m ?? '?'}m away) — left unattributed rather than guessing.`
              : 'Checking…'
          }
        />
      )}
      {jurisdiction?.match_confidence === 'confident' && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Contract attributed</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Tender {jurisdiction.tender_number}, contractor {jurisdiction.contractor_name}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
