import { effectiveQValues } from './expansionReadiness'

/** Fast checks (metadata / θ only). Full adds expanded-table character verification. */
export type SageCheckDepth = 'quick' | 'full'

/** Sage checks included in quick mode (<1s target). */
export const QUICK_SAGE_CHECK_IDS = new Set([
  'conjugacy',
  'expanded-count-balance',
  'theta-sum',
])

export const SAGE_CHECK_DEPTH_LABELS: Record<
  SageCheckDepth,
  { label: string; hint: string }
> = {
  quick: {
    label: 'Quick',
    hint: 'Conjugacy counts, slice balance, and θ sum at one small q (no full expansion).',
  },
  full: {
    label: 'Full',
    hint: 'All checks including orthogonality, norms, and arc patterns on the fully expanded table (can take minutes).',
  },
}

export function sageCheckRunsInDepth(
  checkId: string,
  depth: SageCheckDepth,
): boolean {
  if (depth === 'full') {
    return true
  }
  return QUICK_SAGE_CHECK_IDS.has(checkId)
}

/** Quick mode uses a single small q to keep Sage time negligible. */
export function qValuesForDepth(
  qValues: readonly number[],
  depth: SageCheckDepth,
): readonly number[] {
  const list = effectiveQValues(qValues)
  if (depth === 'full') {
    return list
  }
  return [Math.min(...list)]
}

export function isFullOnlySageCheck(checkId: string): boolean {
  return !QUICK_SAGE_CHECK_IDS.has(checkId)
}
