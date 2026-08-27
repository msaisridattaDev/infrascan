import { CameraIcon, ChartIcon, HomeIcon } from './icons'

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'dashboard', label: 'Dashboard', icon: ChartIcon },
  { id: 'capture', label: 'Capture', icon: CameraIcon },
]

export function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${active ? 'text-slate-900' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
