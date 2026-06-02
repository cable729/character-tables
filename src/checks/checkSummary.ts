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

export type CheckSummarySegment = {
  text: string
  /** Secondary clauses (e.g. checks omitted in quick mode). */
  muted?: boolean
}

export type CheckSummaryResult = {
  segments: CheckSummarySegment[]
  accent: CheckSummaryAccent
}

function joinSummaryText(segments: CheckSummarySegment[]): string {
  return segments.map((s) => s.text).join(' · ')
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

  const segments: CheckSummarySegment[] = []

  if (resolved > 0) {
    let primary = `${pass} of ${resolved} passed`
    if (fail > 0) {
      primary += `, ${fail} failed`
    }
    segments.push({ text: primary })
  } else if (sageBlocked && blocked > 0) {
    segments.push({ text: 'Needs Sage' })
  } else if (running > 0) {
    segments.push({ text: 'Running checks…' })
  }

  if (running > 0 && resolved > 0) {
    segments.push({ text: 'running…' })
  }
  if (blocked > 0 && !(resolved === 0 && sageBlocked)) {
    segments.push({ text: `${blocked} need Sage` })
  }
  if (skipped > 0) {
    const label =
      skipped === 1
        ? '1 manual-run only'
        : `${skipped} manual-run only`
    segments.push({ text: label, muted: true })
  }
  if (disabledCount > 0) {
    segments.push({ text: `${disabledCount} disabled` })
  }

  if (segments.length === 0) {
    segments.push({ text: 'No checks configured' })
  }

  let accent: CheckSummaryAccent = 'pending'
  if (fail > 0) {
    accent = 'fail'
  } else if (fail === 0 && resolved > 0 && running === 0) {
    accent = 'pass'
  } else if (blocked > 0 || (disabledCount > 0 && resolved === 0)) {
    accent = 'warn'
  }

  return { segments, accent }
}

export function summaryDisplayText(result: CheckSummaryResult): string {
  return joinSummaryText(result.segments)
}
