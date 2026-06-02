export type CheckStatusForSummary =
  | 'pass'
  | 'fail'
  | 'running'
  | 'disabled'
  | 'pending'
  | 'blocked'
  | 'skipped'

export type CheckSummaryAccent = 'pass' | 'fail' | 'warn' | 'pending'

export type CheckSummaryInput = {
  enabledStatuses: CheckStatusForSummary[]
  disabledCount: number
  sageBlocked?: boolean
}

export type CheckSummaryResult = {
  text: string
  accent: CheckSummaryAccent
}

export function formatCheckSummary({
  enabledStatuses,
  disabledCount,
  sageBlocked = false,
}: CheckSummaryInput): CheckSummaryResult {
  const pass = enabledStatuses.filter((s) => s === 'pass').length
  const fail = enabledStatuses.filter((s) => s === 'fail').length
  const running = enabledStatuses.filter(
    (s) => s === 'running' || s === 'pending',
  ).length
  const blocked = enabledStatuses.filter((s) => s === 'blocked').length
  const skipped = enabledStatuses.filter((s) => s === 'skipped').length
  const resolved = pass + fail

  const segments: string[] = []

  if (resolved > 0) {
    let primary = `${pass} of ${resolved} passed`
    if (fail > 0) {
      primary += `, ${fail} failed`
    }
    segments.push(primary)
  } else if (sageBlocked && blocked > 0) {
    segments.push('Needs Sage')
  } else if (running > 0) {
    segments.push('Running checks…')
  }

  if (running > 0 && resolved > 0) {
    segments.push('running…')
  }
  if (blocked > 0 && !(resolved === 0 && sageBlocked)) {
    segments.push(`${blocked} need Sage`)
  }
  if (skipped > 0) {
    segments.push(`${skipped} full only`)
  }
  if (disabledCount > 0) {
    segments.push(`${disabledCount} disabled`)
  }

  const text =
    segments.length > 0 ? segments.join(' · ') : 'No checks configured'

  let accent: CheckSummaryAccent = 'pending'
  if (fail > 0) {
    accent = 'fail'
  } else if (fail === 0 && resolved > 0 && running === 0) {
    accent = 'pass'
  } else if (blocked > 0 || (disabledCount > 0 && resolved === 0)) {
    accent = 'warn'
  }

  return { text, accent }
}
