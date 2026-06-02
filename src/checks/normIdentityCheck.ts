import type { CharacterTable } from '../types/characterTable'
import { resolveCheckBlocked } from './expansionReadiness'
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'
import { getExpandedTableAtQ, weightedNormSq } from './expandedTableAtQ'

export function runNormIdentityAtQ(
  table: CharacterTable,
  q: number,
): {
  passes: boolean
  groupOrder: number
  badRows: { key: string; normSum: number }[]
} {
  const expanded = getExpandedTableAtQ(table, q)
  const { groupOrder, flatRows, rowValues, flatColWeights } = expanded
  const badRows: { key: string; normSum: number }[] = []

  for (let i = 0; i < flatRows.length; i++) {
    const normSum = weightedNormSq(rowValues[i], flatColWeights)
    if (Math.abs(normSum - groupOrder) > 1e-4) {
      badRows.push({
        key: flatRows[i].key,
        normSum,
      })
      if (badRows.length >= 10) {
        break
      }
    }
  }

  return {
    passes: badRows.length === 0,
    groupOrder,
    badRows,
  }
}

export const normIdentityCheck: TableCheck = {
  id: 'norm-identity',
  title: 'Irreducible norm identity',
  description: String.raw`\text{Row orthogonality with } \chi = \psi \text{ gives } \langle \chi, \chi \rangle = 1, \text{ hence } \sum_{[g]} |[g]| \, |\chi(g)|^2 = |G| \text{ for each expanded irreducible.}`,
  formulaLatex: String.raw`\sum_j |C_j| \sum_{cs} |z_{i,j}|^2 = |G|`,
  tier: 'numeric',
  requiresGroupOrder: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('norm-identity', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = runNormIdentityAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
}
