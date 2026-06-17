import { useState, type ReactNode } from 'react'
import { CheckStatusBadge } from './CheckStatusBadge'
import type { CheckStatus } from './types'

export function CheckRow({
  title,
  status,
  children,
}: {
  title: string
  status: CheckStatus
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded border border-slate-200">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
            {expanded ? '▼' : '▶'}
          </span>
          <span className="text-sm font-medium text-slate-800">{title}</span>
        </div>
        <CheckStatusBadge status={status} />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-slate-200 px-3 py-3">{children}</div>
      )}
    </div>
  )
}
