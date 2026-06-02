import { inferN } from '../diagram/utils'
import { expansionCountAtQ } from '../expansion/expansionCount'
import { DEFAULT_CHECK_Q_VALUES } from './conjugacyClassOrderCheck'
import {
  flatExpandedColCount,
  flatExpandedRowCount,
} from '../expansion/iterateExpandedPairs'
import type { CharacterTable } from '../types/characterTable'
import { expansionBlockInfo, type CheckBlockInfo } from './types'

export function effectiveQValues(
  qValues: readonly number[],
): readonly number[] {
  return qValues.length > 0 ? qValues : DEFAULT_CHECK_Q_VALUES
}

export function runExpandedCountBalanceAtQ(
  table: CharacterTable,
  q: number,
): { rowTotal: number; colTotal: number; passes: boolean } {
  const rowTotal = flatExpandedRowCount(table, q)
  const colTotal = flatExpandedColCount(table, q)
  return {
    rowTotal,
    colTotal,
    passes: rowTotal === colTotal,
  }
}

/** Declared n_j totals from YAML (expansionCount / arc formulas). */
export function runDeclaredCountBalanceAtQ(
  table: CharacterTable,
  q: number,
): { rowTotal: number; colTotal: number; passes: boolean } {
  const n = inferN(table)
  const rowTotal = table.rows.reduce(
    (sum, spec) => sum + expansionCountAtQ(spec, n, q),
    0,
  )
  const colTotal = table.columns.reduce(
    (sum, spec) => sum + expansionCountAtQ(spec, n, q),
    0,
  )
  return {
    rowTotal,
    colTotal,
    passes: rowTotal === colTotal,
  }
}

/** Table YAML allows computing expansion counts (no missing expansionCount). */
export function expansionMetadataBlockInfo(
  table: CharacterTable,
): CheckBlockInfo {
  return expansionBlockInfo(table)
}

/** Table can be fully expanded to a square character table at each test q. */
export function fullExpansionBlockInfo(
  table: CharacterTable,
  qValues: readonly number[] = DEFAULT_CHECK_Q_VALUES,
): CheckBlockInfo {
  const qList = effectiveQValues(qValues)
  const meta = expansionMetadataBlockInfo(table)
  if (meta.blocked) {
    return meta
  }

  if (!table.groupOrder) {
    return {
      blocked: true,
      reason: 'groupOrder is required',
    }
  }

  try {
    for (const q of qList) {
      const enumerated = runExpandedCountBalanceAtQ(table, q)
      const declared = runDeclaredCountBalanceAtQ(table, q)

      if (!enumerated.passes) {
        return {
          blocked: true,
          reason: `Table is not fully expanded at q=${q}: ${enumerated.rowTotal} enumerated character slices vs ${enumerated.colTotal} class slices.`,
        }
      }
      if (!declared.passes) {
        return {
          blocked: true,
          reason: `Declared expansion counts disagree at q=${q}: ${declared.rowTotal} row choices vs ${declared.colTotal} column choices.`,
        }
      }
      if (
        enumerated.rowTotal !== declared.rowTotal ||
        enumerated.colTotal !== declared.colTotal
      ) {
        return {
          blocked: true,
          reason: `Enumerated slice counts do not match declared expansionCount at q=${q} (enumerated ${enumerated.rowTotal}×${enumerated.colTotal}, declared ${declared.rowTotal}×${declared.colTotal}).`,
        }
      }
    }
  } catch (err) {
    return {
      blocked: true,
      reason: err instanceof Error ? err.message : String(err),
    }
  }

  return { blocked: false }
}

export function groupOrderBlockInfo(table: CharacterTable): CheckBlockInfo {
  if (!table.groupOrder) {
    return {
      blocked: true,
      reason: 'groupOrder is required',
    }
  }
  const meta = expansionMetadataBlockInfo(table)
  if (meta.blocked) {
    return meta
  }
  return { blocked: false }
}

export const ALWAYS_ACTIVE_CHECK_IDS = new Set([
  'trivial-row-column',
  'theta-sum',
])
export const METADATA_ONLY_CHECK_IDS = new Set(['expanded-count-balance'])
export const GROUP_ORDER_ONLY_CHECK_IDS = new Set(['conjugacy'])
export const FULL_EXPANSION_CHECK_IDS = new Set([
  'trivial-orthogonality',
  'row-orthogonality',
  'column-orthogonality',
  'degree-sum',
  'duplicate-irrep',
  'norm-identity',
  'arc-patterns',
])

/** Single source of truth for whether a check can run on this table. */
export function resolveCheckBlocked(
  checkId: string,
  table: CharacterTable,
  qValues: readonly number[] = DEFAULT_CHECK_Q_VALUES,
): CheckBlockInfo {
  if (ALWAYS_ACTIVE_CHECK_IDS.has(checkId)) {
    return { blocked: false }
  }
  if (METADATA_ONLY_CHECK_IDS.has(checkId)) {
    return expansionMetadataBlockInfo(table)
  }
  if (GROUP_ORDER_ONLY_CHECK_IDS.has(checkId)) {
    return groupOrderBlockInfo(table)
  }
  return fullExpansionBlockInfo(table, effectiveQValues(qValues))
}

export function partitionTableChecks(
  table: CharacterTable,
  qValues: readonly number[],
  checks: readonly { id: string }[],
): {
  enabled: string[]
  disabled: { id: string; reason?: string }[]
} {
  const qList = effectiveQValues(qValues)
  const fullExpansionBlock = fullExpansionBlockInfo(table, qList)
  const enabled: string[] = []
  const disabled: { id: string; reason?: string }[] = []

  for (const check of checks) {
    if (ALWAYS_ACTIVE_CHECK_IDS.has(check.id)) {
      enabled.push(check.id)
      continue
    }

    if (METADATA_ONLY_CHECK_IDS.has(check.id)) {
      const meta = expansionMetadataBlockInfo(table)
      if (meta.blocked) {
        disabled.push({ id: check.id, reason: meta.reason })
      } else {
        enabled.push(check.id)
      }
      continue
    }

    if (GROUP_ORDER_ONLY_CHECK_IDS.has(check.id)) {
      const block = groupOrderBlockInfo(table)
      if (block.blocked) {
        disabled.push({ id: check.id, reason: block.reason })
      } else {
        enabled.push(check.id)
      }
      continue
    }

    if (FULL_EXPANSION_CHECK_IDS.has(check.id)) {
      if (fullExpansionBlock.blocked) {
        disabled.push({ id: check.id, reason: fullExpansionBlock.reason })
      } else {
        enabled.push(check.id)
      }
      continue
    }

    enabled.push(check.id)
  }

  return { enabled, disabled }
}
