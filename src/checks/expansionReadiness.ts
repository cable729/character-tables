import { inferN } from '../diagram/utils'
import { expansionCountAtQ } from '../expansion/expansionCountDisplay'
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

export type ExpansionBalanceAtQ = {
  q: number
  enumerated: { rowTotal: number; colTotal: number; passes: boolean }
  declared: { rowTotal: number; colTotal: number; passes: boolean }
  declaredMatchesEnumerated: boolean
}

export function expansionBalanceAtQ(
  table: CharacterTable,
  q: number,
): ExpansionBalanceAtQ {
  const enumerated = runExpandedCountBalanceAtQ(table, q)
  const declared = runDeclaredCountBalanceAtQ(table, q)
  return {
    q,
    enumerated,
    declared,
    declaredMatchesEnumerated:
      enumerated.rowTotal === declared.rowTotal &&
      enumerated.colTotal === declared.colTotal,
  }
}

export function runCountBalanceCheckAtQ(
  table: CharacterTable,
  q: number,
): { passes: boolean; reason?: string } & ExpansionBalanceAtQ {
  const balance = expansionBalanceAtQ(table, q)
  if (!balance.enumerated.passes) {
    return {
      ...balance,
      passes: false,
      reason: `Table is not fully expanded at q=${q}: ${balance.enumerated.rowTotal} enumerated character slices vs ${balance.enumerated.colTotal} class slices.`,
    }
  }
  if (!balance.declared.passes) {
    return {
      ...balance,
      passes: false,
      reason: `Declared expansion counts disagree at q=${q}: ${balance.declared.rowTotal} row choices vs ${balance.declared.colTotal} column choices.`,
    }
  }
  if (!balance.declaredMatchesEnumerated) {
    return {
      ...balance,
      passes: false,
      reason: `Enumerated slice counts do not match declared expansionCount at q=${q} (enumerated ${balance.enumerated.rowTotal}×${balance.enumerated.colTotal}, declared ${balance.declared.rowTotal}×${balance.declared.colTotal}).`,
    }
  }
  return { ...balance, passes: true }
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
      const result = runCountBalanceCheckAtQ(table, q)
      if (!result.passes) {
        return {
          blocked: true,
          reason: result.reason,
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
export const GROUP_ORDER_ONLY_CHECK_IDS = new Set(['conjugacy'])
export const COUNT_BALANCE_CHECK_IDS = new Set(['expanded-count-balance'])
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
  if (GROUP_ORDER_ONLY_CHECK_IDS.has(checkId)) {
    return groupOrderBlockInfo(table)
  }
  if (COUNT_BALANCE_CHECK_IDS.has(checkId)) {
    const meta = expansionMetadataBlockInfo(table)
    if (meta.blocked) {
      return meta
    }
    return groupOrderBlockInfo(table)
  }
  if (FULL_EXPANSION_CHECK_IDS.has(checkId)) {
    return fullExpansionBlockInfo(table, effectiveQValues(qValues))
  }
  return { blocked: false }
}

export function partitionTableChecks(
  table: CharacterTable,
  qValues: readonly number[],
  checks: readonly { id: string }[],
): {
  enabled: string[]
  disabled: { id: string; reason?: string }[]
} {
  const enabled: string[] = []
  const disabled: { id: string; reason?: string }[] = []

  for (const check of checks) {
    const block = resolveCheckBlocked(check.id, table, qValues)
    if (block.blocked) {
      disabled.push({ id: check.id, reason: block.reason })
    } else {
      enabled.push(check.id)
    }
  }

  return { enabled, disabled }
}
