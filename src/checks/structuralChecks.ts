import { isDegreeOnlyCell } from '../expansion/evalCell'
import { buildSageCheckCode } from '../sage/checkBuilders'
import type { CharacterTable } from '../types/characterTable'
import {
  effectiveQValues,
  resolveCheckBlocked,
  runCountBalanceCheckAtQ,
} from './expansionReadiness'

export { runExpandedCountBalanceAtQ } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import { type CheckResult, type TableCheck } from './types'

export function runTrivialRowColumnCheck(table: CharacterTable): CheckResult {
  const row0Issues: string[] = []
  for (let j = 0; j < table.columns.length; j++) {
    const cell = table.matrix[0]?.[j] ?? ''
    if (cell !== '1') {
      row0Issues.push(`matrix[0][${j}] = ${cell}, expected 1`)
    }
  }

  const col0Issues: string[] = []
  for (let i = 0; i < table.rows.length; i++) {
    const cell = table.matrix[i]?.[0] ?? ''
    if (!isDegreeOnlyCell(cell)) {
      col0Issues.push(`matrix[${i}][0] = ${cell}, expected q-polynomial degree only`)
    }
  }

  const passes = row0Issues.length === 0 && col0Issues.length === 0
  return {
    passes,
    details: { row0Issues, col0Issues },
  }
}

export const trivialRowColumnCheck: TableCheck = {
  id: 'trivial-row-column',
  title: 'Trivial row and identity column',
  description: String.raw`\text{The first row is the trivial character } \mathbf{1}, \text{ so every entry in row } 0 \text{ must be } 1. \text{ The first column is the identity conjugacy class, so } \chi(1) \text{ is the degree and must be a polynomial in } q \text{ only (e.g.\ } 1,\ q,\ q^2\text{), with no } \theta \text{ or } \delta.`,
  formulaLatex: String.raw`\chi_{\mathbf{1}} = 1,\quad \chi_i(1) \in \mathbb{Z}[q]`,
  tier: 'structural',
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('trivial-row-column', table, qValues),
  runLocal: (table, _qValues) => runTrivialRowColumnCheck(table),
}

export const arcPatternCheck: TableCheck = {
  id: 'arc-patterns',
  title: 'Arc, zero, and δ pattern checks',
  description: String.raw`\text{Above arcs mark parameters that must be nonzero; on valid expansions, substituted cells should not vanish. Literal } 0 \text{ entries are skipped.}`,
  formulaLatex: String.raw`\text{above arcs} \Rightarrow \chi(g) \neq 0`,
  tier: 'numeric',
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('arc-patterns', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('arc-patterns', table, qValues),
}

export const expandedCountBalanceCheck: TableCheck = {
  id: 'expanded-count-balance',
  title: 'Expanded row and column counts match',
  description: String.raw`\text{A character table has one row per irreducible character and one column per conjugacy class, so the fully expanded table must be square. After expanding headers, the total number of character slices must equal the total number of class slices. Declared Choices totals must match arc enumeration.}`,
  formulaLatex: String.raw`\sum_i n_i^{\mathrm{row}}(q) = \sum_j n_j^{\mathrm{col}}(q)`,
  tier: 'structural',
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('expanded-count-balance', table, qValues),
  runLocal: (table, qValues) => {
    const qList = effectiveQValues(qValues)
    const failures: { q: number; reason: string }[] = []
    for (const q of qList) {
      const result = runCountBalanceCheckAtQ(table, q)
      if (!result.passes && result.reason) {
        failures.push({ q, reason: result.reason })
      }
    }
    return {
      passes: failures.length === 0,
      details: { failures },
    }
  },
  requiresSage: true,
  usesSage: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('expanded-count-balance', table, qValues),
}
