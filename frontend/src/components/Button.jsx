export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:bg-slate-300 disabled:active:scale-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 dark:focus-visible:ring-white/30 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-slate-900 border border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:text-slate-300 disabled:border-slate-200 disabled:bg-white disabled:active:scale-100 dark:text-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700/60 dark:disabled:text-slate-600 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-300/30 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
