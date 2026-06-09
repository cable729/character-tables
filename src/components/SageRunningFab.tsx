import { useEffect, useState } from 'react'
import { formatElapsedSince } from '../checks/sageRunPlan'

type SageRunningFabProps = {
  startedAt: number
  onStop: () => void
}

export function SageRunningFab({ startedAt, onStop }: SageRunningFabProps) {
  const [elapsed, setElapsed] = useState(() =>
    formatElapsedSince(startedAt),
  )

  useEffect(() => {
    const tick = () => setElapsed(formatElapsedSince(startedAt))
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [startedAt])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[var(--z-fab)] flex justify-end p-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-indigo-200 bg-white py-1.5 pl-3 pr-1.5 shadow-lg shadow-indigo-100/80">
        <span
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-indigo-500"
          aria-hidden
        />
        <span className="text-xs font-medium text-slate-800">
          Sage running
        </span>
        <span className="font-mono text-xs tabular-nums text-slate-600">
          {elapsed}
        </span>
        <button
          type="button"
          onClick={onStop}
          className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Stop
        </button>
      </div>
    </div>
  )
}
