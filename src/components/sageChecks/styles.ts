import type { CheckSummaryAccent } from '../../checks/checkSummary'

export const TIMING_BOX_CLASS = {
  none: 'border-slate-200 bg-slate-50 text-slate-700',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  severe: 'border-red-200 bg-red-50 text-red-900',
} as const

export const SUMMARY_ACCENT_BORDER: Record<CheckSummaryAccent, string> = {
  pass: 'border-l-emerald-500',
  fail: 'border-l-red-500',
  warn: 'border-l-amber-500',
  pending: 'border-l-slate-300',
}

export const SUMMARY_ACCENT_TEXT: Record<CheckSummaryAccent, string> = {
  pass: 'text-emerald-800',
  fail: 'text-red-800',
  warn: 'text-amber-800',
  pending: 'text-slate-600',
}
