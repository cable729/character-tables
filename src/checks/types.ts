import { findExpansionCountIssues } from '../schema/expansionCountValidation'
import type { CharacterTable } from '../types/characterTable'

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
  /** Numeric / symbolic spot-checks run in Sage only when true. */
  requiresSage?: boolean
  /** When true, Sage code is emitted in the combined kernel run. */
  usesSage?: boolean
  isBlocked: (
    table: CharacterTable,
    qValues?: readonly number[],
  ) => CheckBlockInfo
  /** Structural checks only; numeric checks return blocked stub. */
  runLocal: (table: CharacterTable, qValues: readonly number[]) => CheckResult
  buildSageCode?: (
    table: CharacterTable,
    qValues: readonly number[],
  ) => string | null
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
