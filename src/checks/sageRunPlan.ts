import { effectiveQValues } from './expansionReadiness'

/** Minimal verifier checks, or verifier plus legacy diagnostic checks. */
export type SageCheckScope = 'verifier' | 'diagnostics'

export const VERIFIER_SAGE_CHECK_IDS = new Set([
  'conjugacy',
  'expanded-count-balance',
  'row-orthogonality',
  'column-orthogonality',
])

export const DIAGNOSTIC_SAGE_CHECK_IDS = new Set([
  'theta-sum',
  'trivial-orthogonality',
  'degree-sum',
  'duplicate-irrep',
  'norm-identity',
  'arc-patterns',
])

/** @deprecated Use VERIFIER_SAGE_CHECK_IDS */
export const QUICK_SAGE_CHECK_IDS = VERIFIER_SAGE_CHECK_IDS

export const SAGE_CHECK_SCOPE_LABELS: Record<
  SageCheckScope,
  { label: string; hint: string }
> = {
  verifier: {
    label: 'Verifier checks',
    hint: 'Conjugacy, slice balance, and row/column orthogonality.',
  },
  diagnostics: {
    label: 'Include diagnostics',
    hint: 'Also runs θ sum, trivial orthogonality, degree sum, duplicate irrep, norm identity, and arc patterns.',
  },
}

/**
 * UT₄ benchmark (isolated executes, 2026-06-02). Large tables scale similarly;
 * bundled runs are usually faster than the sum.
 */
export const UT4_CHECK_TIMING_MS: Record<string, Partial<Record<number, number>>> =
  {
    conjugacy: { 2: 63, 3: 64, 5: 95 },
    'expanded-count-balance': { 2: 98, 3: 93, 5: 64 },
    'theta-sum': { 2: 96, 3: 64, 5: 70 },
    'degree-sum': { 2: 64, 3: 98, 5: 85 },
    'trivial-orthogonality': { 2: 108, 3: 125, 5: 1700 },
    'row-orthogonality': { 2: 102, 3: 1100, 5: 306_000 },
    'column-orthogonality': { 2: 101, 3: 1000, 5: 240_000 },
    'duplicate-irrep': { 2: 108, 3: 183, 5: 4000 },
    'norm-identity': { 2: 70, 3: 135, 5: 2400 },
    'arc-patterns': { 2: 70, 3: 114, 5: 1200 },
  }

const DEFAULT_CHECK_MS = 200
/** One kernel execute shares expansion work across checks and q. */
const BUNDLED_RUN_FACTOR = 0.55

export type TimingWarningLevel = 'none' | 'info' | 'warn' | 'severe'

export type SageTimingEstimate = {
  msMin: number
  msMax: number
  level: TimingWarningLevel
  message: string
  detail?: string
}

export function sageCheckRunsInScope(
  checkId: string,
  scope: SageCheckScope,
): boolean {
  if (VERIFIER_SAGE_CHECK_IDS.has(checkId)) {
    return true
  }
  if (scope === 'diagnostics') {
    return DIAGNOSTIC_SAGE_CHECK_IDS.has(checkId)
  }
  return false
}

export function isVerifierCheckId(checkId: string): boolean {
  return (
    VERIFIER_SAGE_CHECK_IDS.has(checkId) ||
    checkId === 'trivial-row-column' ||
    checkId.startsWith('superchar-')
  )
}

export function sortSelectedQ(selected: Iterable<number>): number[] {
  return [...selected].filter((q) => q >= 2).sort((a, b) => a - b)
}

export function intersectSelectedQ(
  pool: readonly number[],
  selected: readonly number[],
): number[] {
  const poolSet = new Set(effectiveQValues(pool))
  return sortSelectedQ(selected.filter((q) => poolSet.has(q)))
}

export function defaultSelectedQ(pool: readonly number[]): number[] {
  const list = effectiveQValues(pool)
  const preferred = [2, 3].filter((q) => list.includes(q))
  if (preferred.length > 0) {
    return preferred
  }
  if (list.includes(2)) {
    return [2]
  }
  return list.length > 0 ? [list[0]] : []
}

export function estimateCheckMs(checkId: string, q: number): number {
  return UT4_CHECK_TIMING_MS[checkId]?.[q] ?? DEFAULT_CHECK_MS
}

export function estimateSageRunTiming(opts: {
  selectedQ: readonly number[]
  scope: SageCheckScope
  sageCheckIds: readonly string[]
}): SageTimingEstimate {
  const { selectedQ, scope, sageCheckIds } = opts
  if (selectedQ.length === 0) {
    return {
      msMin: 0,
      msMax: 0,
      level: 'none',
      message: 'Select at least one q to run Sage checks.',
    }
  }

  const checks = sageCheckIds.filter((id) => sageCheckRunsInScope(id, scope))
  if (checks.length === 0) {
    return {
      msMin: 0,
      msMax: 0,
      level: 'none',
      message: 'No Sage checks will run.',
    }
  }

  let sum = 0
  for (const q of selectedQ) {
    for (const id of checks) {
      sum += estimateCheckMs(id, q)
    }
  }

  const msMin = Math.max(50, Math.round(sum * BUNDLED_RUN_FACTOR * 0.85))
  const msMax = Math.max(msMin, Math.round(sum * BUNDLED_RUN_FACTOR * 1.15))

  const level = timingLevelFromMs(msMax)
  const range = formatDurationRange(msMin, msMax)
  const qLabel = selectedQ.join(', ')
  const scopeLabel =
    scope === 'diagnostics' ? 'verifier + diagnostics' : 'verifier checks'

  let detail: string | undefined
  if (selectedQ.includes(5)) {
    detail =
      'UT₄ at q=5: row + column orthogonality can take several minutes. Bundled run is usually faster than isolated totals.'
  }

  return {
    msMin,
    msMax,
    level,
    message: `Estimated ${range} for ${scopeLabel} at q = ${qLabel} (UT₄ reference).`,
    detail,
  }
}

export function timingLevelFromMs(ms: number): TimingWarningLevel {
  if (ms < 3000) {
    return 'none'
  }
  if (ms < 30_000) {
    return 'info'
  }
  if (ms < 120_000) {
    return 'warn'
  }
  return 'severe'
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

export function formatDurationRange(msMin: number, msMax: number): string {
  if (msMax - msMin < 500) {
    return formatDurationMs(msMin)
  }
  return `${formatDurationMs(msMin)}–${formatDurationMs(msMax)}`
}

export function formatElapsedSince(startedAt: number, now = Date.now()): string {
  return formatDurationMs(Math.max(0, now - startedAt))
}
