import { findExpansionCountIssues } from '../schema/expansionCountValidation'
import type { CharacterTable } from '../types/characterTable'
import { effectiveQValues } from './expansionReadiness'

export type CheckTier = 'symbolic' | 'structural' | 'numeric'

export type CheckBlockInfo = {
  blocked: boolean
  reason?: string
}

export type PerQResult = {
  q: number
  passes: boolean
  message?: string
  details?: unknown
}

export type CheckResult = {
  passes: boolean
  blocked?: boolean
  blockReason?: string
  perQ?: PerQResult[]
  details?: unknown
}

export type TableCheck = {
  id: string
  title: string
  /** LaTeX prose for the check panel (use \\text{...} for ordinary words). */
  description: string
  formulaLatex: string
  tier: CheckTier
  requiresGroupOrder?: boolean
  /** When true, Sage confirmation code is emitted (numeric checks). */
  usesSage?: boolean
  isBlocked: (
    table: CharacterTable,
    qValues?: readonly number[],
  ) => CheckBlockInfo
  runLocal: (table: CharacterTable, qValues: readonly number[]) => CheckResult
  buildSageCode?: (
    table: CharacterTable,
    qValues: readonly number[],
  ) => string | null
}

export function mapCheckAtQ<T>(
  qValues: readonly number[],
  fn: (q: number) => T,
): T[] {
  return effectiveQValues(qValues).map(fn)
}

export function mergeCheckResults(perQ: PerQResult[]): CheckResult {
  if (perQ.length === 0) {
    return {
      passes: false,
      perQ,
      details: 'No test q values',
    }
  }
  return {
    passes: perQ.every((r) => r.passes),
    perQ,
  }
}

export function expansionBlockInfo(table: CharacterTable): CheckBlockInfo {
  const issues = findExpansionCountIssues(table)
  if (issues.length > 0) {
    return {
      blocked: true,
      reason: 'expansionCount required for restricted headers',
    }
  }
  return { blocked: false }
}
