import { CameraIcon, ClockIcon, PinIcon } from './icons'

const ITEMS = [
  { icon: CameraIcon, title: 'Photo', desc: 'The image you capture, used to detect the defect type and severity.' },
  { icon: PinIcon, title: 'Location', desc: 'GPS coordinates at the moment of capture, used to place your report on the map.' },
  { icon: ClockIcon, title: 'Timestamp', desc: 'When the photo was taken, used to track how long an issue has been open.' },
]

export function InfoDisclosureCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">How this works</p>
      <p className="text-xs text-slate-500 mt-1">
        Reports are reviewed by AI, routed by confidence, and shown publicly on the map — no account or login needed.
      </p>
      <div className="mt-3 space-y-2">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-2">
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-medium text-slate-700">{title}.</span> {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
