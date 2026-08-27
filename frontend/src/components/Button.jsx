export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-white bg-slate-900 disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-slate-900 border border-slate-300 bg-white hover:border-slate-400 disabled:text-slate-300 disabled:border-slate-200 dark:text-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:disabled:text-slate-600 dark:disabled:border-slate-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
