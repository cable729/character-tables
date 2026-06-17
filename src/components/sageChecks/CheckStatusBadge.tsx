import type { CheckStatus } from './types'

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'running') {
    return <span className="text-xs text-slate-500">Running…</span>
  }
  if (status === 'pending') {
    return <span className="text-xs text-slate-400">Pending</span>
  }
  if (status === 'skipped') {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Full only
      </span>
    )
  }
  if (status === 'blocked') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Needs Sage
      </span>
    )
  }
  if (status === 'disabled') {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Disabled
      </span>
    )
  }
  if (status === 'pass') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Pass
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Fail
    </span>
  )
}
