import { useState } from 'react'
import { PrimaryButton } from './Button'

const STORAGE_KEY = 'streetlens-unlocked'
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD

// This is a casual deterrent, not real security: VITE_ env vars are bundled straight into the
// public JS, so the password is readable by anyone who opens dev tools or views the bundle. It
// stops a shared link from being stumbled into by accident — it does not stop someone who
// actually wants in, and it does nothing to protect the API itself (still open to direct calls).
// Real protection would need server-side auth on the backend, which is out of scope here.
export function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => !APP_PASSWORD || localStorage.getItem(STORAGE_KEY) === APP_PASSWORD
  )
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return children

  function handleSubmit(e) {
    e.preventDefault()
    if (value === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, APP_PASSWORD)
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm"
      >
        <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
          SL
        </div>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">StreetLens</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          This preview is private. Enter the access password to continue.
        </p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 ${
            error
              ? 'border-red-400 dark:border-red-500 focus:ring-red-300/50'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-400/40'
          }`}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">Incorrect password.</p>}

        <div className="mt-4">
          <PrimaryButton type="submit" className="w-full">
            Continue
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
