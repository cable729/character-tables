import {
  buildSageConjugacyCheckCode,
  conjugacyCheckAtQ,
  conjugacyCheckSymbolic,
} from './conjugacyClassOrderCheck'
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
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'

export { DEFAULT_CHECK_Q_VALUES, parseSageCheckAllOk } from './conjugacyClassOrderCheck'

export const conjugacyClassCheck: TableCheck = {
  id: 'conjugacy',
  title: 'Conjugacy class sizes are correct',
  description: String.raw`\text{Each condensed column } j \text{ represents } n_j \text{ conjugacy classes, each of size } |C_j|. \text{ The partition identity } \sum_j n_j |C_j| = |G| \text{ says the column headers account for every element of } G. \text{ This check does not use character values.}`,
  formulaLatex: String.raw`\sum_j n_j |C_j| = |G|`,
  tier: 'symbolic',
  requiresGroupOrder: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('conjugacy', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = conjugacyCheckAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
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
    disabled: disabledEntries
      .map(({ id, reason }) => ({
        check: getCheckById(id),
        reason,
      }))
      .filter((d): d is { check: TableCheck; reason?: string } => d.check != null),
  }
}

export function buildCombinedSageCode(
  table: import('../types/characterTable').CharacterTable,
  qValues: readonly number[],
): string {
  const parts: string[] = ['overall_ok = True']
  for (const check of TABLE_CHECKS) {
    if (
      !check.buildSageCode ||
      resolveCheckBlocked(check.id, table, qValues).blocked
    ) {
      continue
    }
    const code = check.buildSageCode(table, qValues)
    if (code) {
      parts.push(
        `# --- ${check.id} ---\n_check_ok = True\n${code.replace(/all_ok/g, '_check_ok')}\noverall_ok = overall_ok and _check_ok`,
      )
    }
  }
  parts.push('print(f"all_ok={overall_ok}")')
  return parts.join('\n\n')
}

export { conjugacyCheckSymbolic, runExpandedCountBalanceAtQ }
