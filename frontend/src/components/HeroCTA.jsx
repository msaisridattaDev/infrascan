export function HeroCTA({ title, subtitle }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-5 mb-5">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-slate-300 mt-1">{subtitle}</p>
    </div>
  )
}
