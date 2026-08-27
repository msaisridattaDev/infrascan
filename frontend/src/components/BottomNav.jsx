import { ClipboardListIcon, CompassIcon, HomeIcon, ShieldIcon } from './icons'

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'explore', label: 'Explore', icon: CompassIcon },
  { id: 'reports', label: 'My Reports', icon: ClipboardListIcon },
  { id: 'roadwatch', label: 'RoadWatch', icon: ShieldIcon },
]

export function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}
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
