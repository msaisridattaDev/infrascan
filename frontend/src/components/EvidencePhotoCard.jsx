export function EvidencePhotoCard({ src, caption }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <img src={src} alt={caption || 'evidence photo'} className="w-full h-64 object-cover" />
      {caption && <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2">{caption}</p>}
    </div>
  )
}
