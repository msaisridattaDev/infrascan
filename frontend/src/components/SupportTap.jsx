import { useState } from 'react'
import { isSupported, toggleSupport } from '../lib/localSupport'
import { HeartIcon } from './icons'

export function SupportTap({ observationId }) {
  const [supported, setSupported] = useState(() => isSupported(observationId))

  return (
    <button
      onClick={() => setSupported(toggleSupport(observationId))}
      className={`flex items-center gap-1.5 text-sm transition ${
        supported ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400'
      }`}
    >
      <HeartIcon className={`w-4 h-4 ${supported ? 'fill-current' : ''}`} />
      {supported ? 'You supported this' : 'Support this report'}
    </button>
  )
}
