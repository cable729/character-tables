import { isComplexZero } from '../expansion/evalCell'
import type { CharacterTable } from '../types/characterTable'
import { resolveCheckBlocked } from './expansionReadiness'
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'
import { getExpandedTableAtQ, weightedDot } from './expandedTableAtQ'

export function runDuplicateIrrepAtQ(
  table: CharacterTable,
  q: number,
): {
  passes: boolean
  duplicatePairs: { a: string; b: string; ratio: string }[]
} {
  const expanded = getExpandedTableAtQ(table, q)
  const { flatRows, rowValues, flatColWeights } = expanded
  const duplicatePairs: { a: string; b: string; ratio: string }[] = []

  for (let i = 0; i < flatRows.length; i++) {
    for (let k = i + 1; k < flatRows.length; k++) {
      const a = flatRows[i]
      const b = flatRows[k]
      const ipAA = weightedDot(rowValues[i], rowValues[i], flatColWeights)
      if (isComplexZero(ipAA)) {
        continue
      }
      const ipAB = weightedDot(rowValues[i], rowValues[k], flatColWeights)
      const ipBB = weightedDot(rowValues[k], rowValues[k], flatColWeights)
      const crossSq = ipAB.re * ipAB.re + ipAB.im * ipAB.im
      const normProd = (ipAA.re * ipAA.re + ipAA.im * ipAA.im) *
        (ipBB.re * ipBB.re + ipBB.im * ipBB.im)
      if (normProd > 1e-12 && crossSq / normProd > 0.9999) {
        duplicatePairs.push({
          a: a.key,
          b: b.key,
          ratio: `${ipAB.re}+${ipAB.im}i`,
        })
        if (duplicatePairs.length >= 10) {
          break
        }
      }
    }
    if (duplicatePairs.length >= 10) {
      break
    }
  }

  return {
    passes: duplicatePairs.length === 0,
    duplicatePairs,
  }
}

export const duplicateIrrepCheck: TableCheck = {
  id: 'duplicate-irrep',
  title: 'No duplicate irreducibles (Schur consequence)',
  description: String.raw`\text{Schur's lemma: non-isomorphic irreducibles are not proportional as class functions. We flag distinct expanded rows that are nearly proportional on all classes.}`,
  formulaLatex: String.raw`\nexists\ \lambda \in \mathbb{C}^\times:\ \chi_i = \lambda \chi_k \Rightarrow i = k`,
  tier: 'numeric',
  requiresGroupOrder: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('duplicate-irrep', table, qValues),
  runLocal: (table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const result = runDuplicateIrrepAtQ(table, q)
      return {
        q,
        passes: result.passes,
        details: result,
      }
    })
    return mergeCheckResults(perQ)
  },
}
