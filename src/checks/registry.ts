import {
  buildCombinedSageScript as assembleSageScript,
  buildSageConjugacyCheckCode,
} from '../sage/checkBuilders'
import { conjugacyCheckSymbolic } from './conjugacyClassOrderCheck'
import { degreeSumCheck } from './degreeSumCheck'
import { duplicateIrrepCheck } from './duplicateIrrepCheck'
import {
  arcPatternCheck,
  expandedCountBalanceCheck,
  trivialRowColumnCheck,
} from './structuralChecks'
import { normIdentityCheck } from './normIdentityCheck'
import { columnOrthogonalityCheck, rowOrthogonalityCheck } from './rowOrthogonalityCheck'
import { thetaSumCheck } from './thetaSumCheck'
import { trivialOrthogonalityCheck } from './trivialOrthogonalityCheck'
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
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export {
  estimateSageRunTiming,
  QUICK_SAGE_CHECK_IDS,
  SAGE_CHECK_SCOPE_LABELS,
  type SageCheckScope,
  type SageTimingEstimate,
} from './sageRunPlan'

export type SageRunOptions = {
  selectedQ: readonly number[]
  scope: SageCheckScope
}

export { DEFAULT_CHECK_Q_VALUES } from './conjugacyClassOrderCheck'
export { parseSageCheckAllOk, parseSageCheckResults } from './parseSageOutput'
export { conjugacyCheckSymbolic, runExpandedCountBalanceAtQ }

export const conjugacyClassCheck: TableCheck = {
  id: 'conjugacy',
  title: 'Conjugacy class sizes are correct',
  description: String.raw`\text{Each condensed column } j \text{ represents } n_j \text{ conjugacy classes, each of size } |C_j|. \text{ The partition identity } \sum_j n_j |C_j| = |G| \text{ says the column headers account for every element of } G. \text{ This check does not use character values.}`,
  formulaLatex: String.raw`\sum_j n_j |C_j| = |G|`,
  tier: 'symbolic',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('conjugacy', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) => buildSageConjugacyCheckCode(table, qValues),
}

export const TABLE_CHECKS: TableCheck[] = [
  conjugacyClassCheck,
  expandedCountBalanceCheck,
  trivialRowColumnCheck,
  trivialOrthogonalityCheck,
  thetaSumCheck,
  rowOrthogonalityCheck,
  columnOrthogonalityCheck,
  degreeSumCheck,
  duplicateIrrepCheck,
  normIdentityCheck,
  arcPatternCheck,
]

export function getCheckById(id: string): TableCheck | undefined {
  return TABLE_CHECKS.find((c) => c.id === id)
}

export { partitionTableChecks, resolveCheckBlocked }

export function getChecksPartition(
  table: import('../types/characterTable').CharacterTable,
  qValues: readonly number[],
): {
  enabled: TableCheck[]
  disabled: { check: TableCheck; reason?: string }[]
} {
  const { enabled: enabledIds, disabled: disabledEntries } = partitionTableChecks(
    table,
    qValues,
    TABLE_CHECKS,
  )
  return {
    enabled: enabledIds
      .map((id) => getCheckById(id))
      .filter((c): c is TableCheck => c != null),
    disabled: disabledEntries.flatMap(({ id, reason }) => {
      const check = getCheckById(id)
      return check ? [{ check, reason }] : []
    }),
  }
}

export function buildCombinedSageCode(
  table: import('../types/characterTable').CharacterTable,
  options: SageRunOptions,
): string {
  const qList = sortSelectedQ(options.selectedQ)
  const fragments: string[] = []
  for (const check of TABLE_CHECKS) {
    if (
      !check.buildSageCode ||
      !sageCheckRunsInScope(check.id, options.scope) ||
      resolveCheckBlocked(check.id, table, qList).blocked
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
