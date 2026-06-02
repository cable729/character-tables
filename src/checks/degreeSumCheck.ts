import { evalCellAtQ, makeAdditiveTheta } from '../expansion/evalCell'
import { expandRowOrCol } from '../expansion/expandDiagram'
import { inferN } from '../diagram/utils'
import type { CharacterTable } from '../types/characterTable'
import { resolveCheckBlocked } from './expansionReadiness'
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'
import { groupOrderAtQ } from './expandedInnerProduct'

export function runDegreeSumAtQ(
  table: CharacterTable,
  q: number,
): { passes: boolean; sumSq: number; groupOrder: number } {
  const n = inferN(table)
  const theta = makeAdditiveTheta(q)
  const groupOrder = groupOrderAtQ(table, q)
  const col0Slices = expandRowOrCol(table.columns[0], n, 0, q)
  let sumSq = 0

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const rowSlices = expandRowOrCol(table.rows[rowIndex], n, rowIndex, q)
    const latex = table.matrix[rowIndex]?.[0] ?? '0'
    for (const rowSlice of rowSlices) {
      for (const colSlice of col0Slices) {
        const z = evalCellAtQ(
          latex,
          rowSlice.assignment,
          colSlice.assignment,
          q,
          theta,
        )
        sumSq += z.re * z.re + z.im * z.im
      }
    }
  }

  return {
    passes: sumSq === groupOrder,
    sumSq,
    groupOrder,
  }
}

export const degreeSumCheck: TableCheck = {
  id: 'degree-sum',
  title: 'Character degrees and ∑ dim² = |G|',
  description: String.raw`\text{For an irreducible } \chi, \quad \chi(1) = \dim(\chi). \text{ Moreover } \sum_{\chi \in \mathrm{Irr}(G)} \dim(\chi)^2 = |G|. \text{ After expansion, degrees are read from column } 0.`,
  formulaLatex: String.raw`\sum_{\chi \in \mathrm{Irr}} \chi(1)^2 = |G|`,
  tier: 'numeric',
  requiresGroupOrder: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('degree-sum', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = runDegreeSumAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
}
