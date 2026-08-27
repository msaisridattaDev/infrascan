export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-white bg-slate-900 disabled:bg-slate-300 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`py-3 rounded-xl font-medium text-slate-900 border border-slate-300 bg-white hover:border-slate-400 disabled:text-slate-300 disabled:border-slate-200 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
