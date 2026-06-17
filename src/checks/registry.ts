import { buildCombinedSageScript as assembleSageScript } from '../sage/checkBuilders'
import { isSupercharacterTable } from '../schema/tableSchema'
import type { CharacterTable } from '../types/characterTable'
import {
  conjugacyClassCheck,
  conjugacyCheckSymbolic,
  DEFAULT_CHECK_Q_VALUES,
} from './conjugacyClassOrderCheck'
import {
  arcPatternCheck,
  expandedCountBalanceCheck,
  trivialRowColumnCheck,
} from './structuralChecks'
import {
  columnOrthogonalityCheck,
  degreeSumCheck,
  duplicateIrrepCheck,
  normIdentityCheck,
  rowOrthogonalityCheck,
  thetaSumCheck,
  trivialOrthogonalityCheck,
} from './sageChecks'
import { SUPERCHARACTER_CHECKS } from './supercharacterChecks'
import { resolveSupercharacterCheckBlocked } from './supercharacterReadiness'
import {
  partitionTableChecks,
  resolveCheckBlocked,
  runExpandedCountBalanceAtQ,
} from './expansionReadiness'
import {
  sageCheckRunsInScope,
  sortSelectedQ,
  type SageCheckScope,
} from './sageRunPlan'
import type { TableCheck } from './types'

export {
  estimateSageRunTiming,
  DIAGNOSTIC_SAGE_CHECK_IDS,
  isVerifierCheckId,
  QUICK_SAGE_CHECK_IDS,
  SAGE_CHECK_SCOPE_LABELS,
  VERIFIER_SAGE_CHECK_IDS,
  type SageCheckScope,
  type SageTimingEstimate,
} from './sageRunPlan'

export type SageRunOptions = {
  selectedQ: readonly number[]
  scope: SageCheckScope
}

export { DEFAULT_CHECK_Q_VALUES }
export { parseSageCheckAllOk, parseSageCheckResults } from './parseSageOutput'
export { conjugacyCheckSymbolic, runExpandedCountBalanceAtQ }
export { SUPERCHARACTER_CHECKS } from './supercharacterChecks'
export { conjugacyClassCheck }

/** Minimal pass/fail checks for ordinary character tables. */
export const CHARACTER_VERIFIER_CHECKS: TableCheck[] = [
  conjugacyClassCheck,
  expandedCountBalanceCheck,
  trivialRowColumnCheck,
  rowOrthogonalityCheck,
  columnOrthogonalityCheck,
]

/** Optional legacy checks; not required for verifier pass/fail. */
export const CHARACTER_DIAGNOSTIC_CHECKS: TableCheck[] = [
  thetaSumCheck,
  trivialOrthogonalityCheck,
  degreeSumCheck,
  duplicateIrrepCheck,
  normIdentityCheck,
  arcPatternCheck,
]

/** @deprecated Use CHARACTER_VERIFIER_CHECKS */
export const TABLE_CHECKS: TableCheck[] = [
  ...CHARACTER_VERIFIER_CHECKS,
  ...CHARACTER_DIAGNOSTIC_CHECKS,
]

const ALL_CHECKS: TableCheck[] = [
  ...CHARACTER_VERIFIER_CHECKS,
  ...CHARACTER_DIAGNOSTIC_CHECKS,
  ...SUPERCHARACTER_CHECKS,
]

export function getActiveChecks(
  table: CharacterTable,
  scope: SageCheckScope = 'verifier',
): TableCheck[] {
  if (isSupercharacterTable(table)) {
    return SUPERCHARACTER_CHECKS
  }
  if (scope === 'diagnostics') {
    return [...CHARACTER_VERIFIER_CHECKS, ...CHARACTER_DIAGNOSTIC_CHECKS]
  }
  return CHARACTER_VERIFIER_CHECKS
}

export function getCheckById(id: string): TableCheck | undefined {
  return ALL_CHECKS.find((c) => c.id === id)
}

export { partitionTableChecks, resolveCheckBlocked }

function partitionSupercharacterChecks(
  table: CharacterTable,
  checks: readonly { id: string }[],
): {
  enabled: string[]
  disabled: { id: string; reason?: string }[]
} {
  const enabled: string[] = []
  const disabled: { id: string; reason?: string }[] = []

  for (const check of checks) {
    const block = resolveSupercharacterCheckBlocked(check.id, table)
    if (block.blocked) {
      disabled.push({ id: check.id, reason: block.reason })
    } else {
      enabled.push(check.id)
    }
  }

  return { enabled, disabled }
}

export function getChecksPartition(
  table: CharacterTable,
  qValues: readonly number[],
  scope: SageCheckScope = 'verifier',
): {
  enabled: TableCheck[]
  disabled: { check: TableCheck; reason?: string }[]
} {
  const activeChecks = getActiveChecks(table, scope)
  const partition = isSupercharacterTable(table)
    ? partitionSupercharacterChecks(table, activeChecks)
    : partitionTableChecks(table, qValues, activeChecks)

  return {
    enabled: partition.enabled
      .map((id) => getCheckById(id))
      .filter((c): c is TableCheck => c != null),
    disabled: partition.disabled.flatMap(({ id, reason }) => {
      const check = getCheckById(id)
      return check ? [{ check, reason }] : []
    }),
  }
}

export function buildCombinedSageCode(
  table: CharacterTable,
  options: SageRunOptions,
): string {
  const qList = sortSelectedQ(options.selectedQ)
  const superTable = isSupercharacterTable(table)
  const fragments: string[] = []
  for (const check of getActiveChecks(table, options.scope)) {
    const blocked = superTable
      ? resolveSupercharacterCheckBlocked(check.id, table).blocked
      : resolveCheckBlocked(check.id, table, qList).blocked
    if (
      !check.buildSageCode ||
      (!superTable && !sageCheckRunsInScope(check.id, options.scope)) ||
      blocked
    ) {
      continue
    }
    const code = check.buildSageCode(table, qList)
    if (code) {
      fragments.push(code)
    }
  }
  return assembleSageScript(table, fragments)
}
