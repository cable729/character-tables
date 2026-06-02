import { evalCellAtQ, isDegreeOnlyCell, makeAdditiveTheta } from '../expansion/evalCell'
import { expandRowOrCol } from '../expansion/expandDiagram'
import { headerToDiagram, inferN } from '../diagram/utils'
import { collectLabels } from '../expansion/restrictions'
import type { CharacterTable } from '../types/characterTable'
import {
  resolveCheckBlocked,
  runExpandedCountBalanceAtQ,
} from './expansionReadiness'
import {
  mapCheckAtQ,
  mergeCheckResults,
  type CheckResult,
  type TableCheck,
} from './types'

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

export { runExpandedCountBalanceAtQ } from './expansionReadiness'

export function runArcPatternCheckAtQ(
  table: CharacterTable,
  q: number,
): { passes: boolean; violations: string[] } {
  const n = inferN(table)
  const theta = makeAdditiveTheta(q)
  const violations: string[] = []

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const rowSlices = expandRowOrCol(table.rows[rowIndex], n, rowIndex, q)
    for (let colIndex = 0; colIndex < table.columns.length; colIndex++) {
      const latex = table.matrix[rowIndex]?.[colIndex] ?? ''
      if (latex === '0') {
        continue
      }
      const colDiagram = headerToDiagram(table.columns[colIndex], n)
      const rowDiagram = headerToDiagram(table.rows[rowIndex], n)
      const { aboveLabels: colAbove } = collectLabels(colDiagram)
      const { aboveLabels: rowAbove } = collectLabels(rowDiagram)
      const requiresNonzero = colAbove.length > 0 || rowAbove.length > 0

      if (!requiresNonzero) {
        continue
      }

      const colSlices = expandRowOrCol(table.columns[colIndex], n, colIndex, q)
      for (const rowSlice of rowSlices) {
        for (const colSlice of colSlices) {
          const z = evalCellAtQ(
            latex,
            rowSlice.assignment,
            colSlice.assignment,
            q,
            theta,
          )
          if (z.re === 0 && z.im === 0) {
            violations.push(`[${rowIndex},${colIndex}] vanishes on some expansion`)
            if (violations.length >= 5) {
              return { passes: false, violations }
            }
          }
        }
      }
    }
  }

  return { passes: violations.length === 0, violations }
}

export const arcPatternCheck: TableCheck = {
  id: 'arc-patterns',
  title: 'Arc, zero, and δ pattern checks',
  description: String.raw`\text{Above arcs mark parameters that must be nonzero; on valid expansions, substituted cells should not vanish. Literal } 0 \text{ entries are skipped.}`,
  formulaLatex: String.raw`\text{above arcs} \Rightarrow \chi(g) \neq 0`,
  tier: 'numeric',
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('arc-patterns', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = runArcPatternCheckAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
}

export const expandedCountBalanceCheck: TableCheck = {
  id: 'expanded-count-balance',
  title: 'Expanded row and column counts match',
  description: String.raw`\text{A character table has one row per irreducible character and one column per conjugacy class, so the fully expanded table must be square. After expanding headers, the total number of character slices must equal the total number of class slices.}`,
  formulaLatex: String.raw`\sum_i n_i^{\mathrm{row}}(q) = \sum_j n_j^{\mathrm{col}}(q)`,
  tier: 'numeric',
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('expanded-count-balance', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const { rowTotal, colTotal, passes } = runExpandedCountBalanceAtQ(table, q)
      return {
        q,
        passes,
        details: { rowTotal, colTotal },
        message: passes
          ? undefined
          : `expanded rows ${rowTotal} ≠ expanded columns ${colTotal}`,
      }
    })
    return mergeCheckResults(perQ)
  },
}
