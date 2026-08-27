import { useState } from 'react'
import { buildReportSummary, buildTweetSummary } from '../lib/reportSummary'
import { CopyIcon, MailIcon, ShareIcon, XIcon } from './icons'

export function ContactActionRow({ observation, jurisdiction, loading }) {
  const [copied, setCopied] = useState(false)

  if (loading || !jurisdiction || jurisdiction.match_confidence !== 'confident') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Take action</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Escalation guidance becomes available once this report is confidently matched to a jurisdiction.
        </p>
      </div>
    )
  }

  const summary = buildReportSummary(observation, jurisdiction)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  function handleCopy() {
    navigator.clipboard?.writeText(summary).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    navigator.share?.({ text: summary }).catch(() => {})
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildTweetSummary(observation, jurisdiction))}`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Road defect report — ${jurisdiction.road_name}`)}&body=${encodeURIComponent(summary)}`

  const actions = [
    { key: 'copy', icon: CopyIcon, label: copied ? 'Copied' : 'Copy', onClick: handleCopy },
    canShare && { key: 'share', icon: ShareIcon, label: 'Share', onClick: handleShare },
    { key: 'post', icon: XIcon, label: 'Post', href: tweetUrl },
    { key: 'email', icon: MailIcon, label: 'Email', href: mailtoUrl },
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Take action</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        This report falls within {jurisdiction.responsible_officer}'s jurisdiction ({jurisdiction.road_name}).
      </p>

      <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 max-h-40 overflow-y-auto">
        {summary}
      </pre>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        Auto-drafted from this report's data — not written by a person, and not sent anywhere on its own. Review it,
        then copy, share, post, or email it yourself.
      </p>

      <div className="flex gap-4 mt-3">
        {actions.map(({ key, icon: Icon, label, onClick, href }) =>
          href ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300"
            >
              <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </a>
          ) : (
            <button
              key={key}
              onClick={onClick}
              className="flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300"
            >
              <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
