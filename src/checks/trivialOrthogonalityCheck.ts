import { isComplexZero } from '../expansion/evalCell'
import type { CharacterTable } from '../types/characterTable'
import { resolveCheckBlocked } from './expansionReadiness'
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'
import { groupOrderAtQ, trivialOrthogonalitySums } from './expandedInnerProduct'

export function runTrivialOrthogonalityAtQ(
  table: CharacterTable,
  q: number,
): {
  passes: boolean
  groupOrder: number
  rows: { rowIndex: number; sumRe: number; sumIm: number; ok: boolean }[]
} {
  const groupOrder = groupOrderAtQ(table, q)
  const sums = trivialOrthogonalitySums(table, q)
  const rows = sums.map(({ rowIndex, sum, expectedZero }) => {
    const ok = expectedZero
      ? isComplexZero(sum)
      : Math.abs(sum.re - groupOrder) < 1e-6 && Math.abs(sum.im) < 1e-6
    return {
      rowIndex,
      sumRe: sum.re,
      sumIm: sum.im,
      ok,
    }
  })
  return {
    passes: rows.every((r) => r.ok),
    groupOrder,
    rows,
  }
}

export const trivialOrthogonalityCheck: TableCheck = {
  id: 'trivial-orthogonality',
  title: 'Orthogonality with the trivial character',
  description: String.raw`\text{For a finite group, } \langle \chi, \mathbf{1} \rangle = \frac{1}{|G|} \sum_{g \in G} \chi(g). \text{ Non-trivial irreducibles are orthogonal to } \mathbf{1}, \text{ so the class-weighted sum over all expanded label choices must vanish. For the trivial row, the sum must equal } |G|.`,
  formulaLatex: String.raw`S_i = \sum_j |C_j| \sum_{rs,cs} z_{i,j}(rs,cs);\quad S_0 = |G|,\ S_i = 0\ (i \neq 0)`,
  tier: 'numeric',
  requiresGroupOrder: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('trivial-orthogonality', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = runTrivialOrthogonalityAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
}
