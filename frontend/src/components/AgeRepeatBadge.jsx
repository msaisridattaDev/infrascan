const ORDINAL_SUFFIX = (n) => {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function AgeRepeatBadge({ ageDays, repeatCount, repeatIndex }) {
  if (ageDays == null) return null
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
      <span className="text-slate-400">{ageDays} {ageDays === 1 ? 'day' : 'days'} open</span>
      {repeatCount > 1 && (
        <span className="text-amber-600">· {repeatIndex}{ORDINAL_SUFFIX(repeatIndex)} report</span>
      )}
    </div>
  )
}
