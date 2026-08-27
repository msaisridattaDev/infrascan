import { useState } from 'react'
import { PrimaryButton } from './Button'
import { ActivityIcon, CameraIcon, PinIcon, ShieldIcon } from './icons'

const STORAGE_KEY = 'streetlens-privacy-agreed'

const ITEMS = [
  {
    icon: PinIcon,
    title: 'Location',
    detail: 'Used to place your report on the map and match it to the right road and ward. Never used to track you.',
  },
  {
    icon: CameraIcon,
    title: 'Camera',
    detail: "Used to capture the photo or video frame that's actually reported — nothing is recorded in the background.",
  },
  {
    icon: ActivityIcon,
    title: 'Motion sensor',
    detail: "Used only in Drive mode, to trigger an extra photo when your phone detects a sudden jerk (a pothole or hard bump).",
  },
]

// A real, honest consent screen — not legal boilerplate we can't back up. No claims of specific
// regulatory compliance we haven't actually verified; just a plain statement of what device
// capabilities StreetLens uses, why, and what happens to the data (see the fuller breakdown on
// the RoadLedger tab's "Privacy & data" card).
export function PrivacyGate({ children }) {
  const [agreed, setAgreed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  if (agreed) return children

  function handleAgree() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setAgreed(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center text-center mb-5">
          <ShieldIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Before you start</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what StreetLens uses on your device, and why.
          </p>
        </div>

        <div className="space-y-4">
          {ITEMS.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No accounts, names, or emails are collected. Reports are tied only to a random id stored in this browser
            — see the full breakdown anytime under RoadLedger.
          </p>
        </div>

        <div className="mt-5">
          <PrimaryButton onClick={handleAgree} className="w-full">
            I Agree
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
