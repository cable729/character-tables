import {
  buildCombinedSageScript as assembleSageScript,
  buildSageConjugacyCheckCode,
} from '../sage/checkBuilders'
import { isSupercharacterTable } from '../schema/tableSchema'
import type { CharacterTable } from '../types/characterTable'
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
import { SUPERCHARACTER_CHECKS } from './supercharacterChecks'
import { resolveSupercharacterCheckBlocked } from './supercharacterReadiness'
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
export { SUPERCHARACTER_CHECKS } from './supercharacterChecks'

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

const ALL_CHECKS: TableCheck[] = [...TABLE_CHECKS, ...SUPERCHARACTER_CHECKS]

export function getActiveChecks(table: CharacterTable): TableCheck[] {
  return isSupercharacterTable(table) ? SUPERCHARACTER_CHECKS : TABLE_CHECKS
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
): {
  enabled: TableCheck[]
  disabled: { check: TableCheck; reason?: string }[]
} {
  const activeChecks = getActiveChecks(table)
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
  for (const check of getActiveChecks(table)) {
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
