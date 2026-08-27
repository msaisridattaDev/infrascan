import { useState } from 'react'
import { addComment, getComments } from '../lib/localComments'
import { SendIcon } from './icons'

export function CommentThread({ observationId }) {
  const [comments, setComments] = useState(() => getComments(observationId))
  const [text, setText] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    setComments(addComment(observationId, trimmed))
    setText('')
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Comments</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
        Stored on this device only — not synced or shared.
      </p>

      {comments.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">No comments yet.</p>
      )}
      <div className="space-y-2 mb-3">
        {comments.map((c) => (
          <div key={c.id} className="text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-2">
            <p>{c.text}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {new Date(c.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Add a comment…"
          className="flex-1 text-sm rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
