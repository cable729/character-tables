import {
  complexAdd,
  complexConj,
  complexMul,
  evalCellAtQ,
  makeAdditiveTheta,
  type Complex,
  type ThetaFn,
} from '../expansion/evalCell'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { expandRowOrCol } from '../expansion/expandDiagram'
import { inferN } from '../diagram/utils'
import type { CharacterTable, ExpansionSlice } from '../types/characterTable'
import { flatRowKey, groupOrderAtQ } from './expandedInnerProduct'

export type FlatRowRef = {
  key: string
  rowIndex: number
  rowSliceIndex: number
}

export type ExpandedTableAtQ = {
  q: number
  groupOrder: number
  flatRows: FlatRowRef[]
  /** |C_j| for each flat column slot */
  flatColWeights: number[]
  /** Unweighted cell values; length = flatColWeights.length */
  rowValues: Complex[][]
}

const tableCache = new WeakMap<CharacterTable, Map<number, ExpandedTableAtQ>>()

export function clearExpandedTableCache(table?: CharacterTable): void {
  if (table) {
    tableCache.delete(table)
    return
  }
  tableCache.clear()
}

export function getExpandedTableAtQ(
  table: CharacterTable,
  q: number,
): ExpandedTableAtQ {
  let byQ = tableCache.get(table)
  if (!byQ) {
    byQ = new Map()
    tableCache.set(table, byQ)
  }
  const cached = byQ.get(q)
  if (cached) {
    return cached
  }
  const built = buildExpandedTableAtQ(table, q)
  byQ.set(q, built)
  return built
}

function buildExpandedTableAtQ(
  table: CharacterTable,
  q: number,
): ExpandedTableAtQ {
  const n = inferN(table)
  const theta = makeAdditiveTheta(q)
  const rowExpansions = table.rows.map((spec, index) =>
    expandRowOrCol(spec, n, index, q),
  )
  const colExpansions = table.columns.map((spec, index) =>
    expandRowOrCol(spec, n, index, q),
  )

  const flatColWeights: number[] = []
  const flatColMeta: { colIndex: number; colSlice: ExpansionSlice }[] = []

  for (let colIndex = 0; colIndex < table.columns.length; colIndex++) {
    const classWeight = evalQPolynomial(
      table.columns[colIndex].classSize ?? '1',
      q,
    )
    for (const colSlice of colExpansions[colIndex]) {
      flatColWeights.push(classWeight)
      flatColMeta.push({ colIndex, colSlice })
    }
  }

  const flatRows: FlatRowRef[] = []
  const rowValues: Complex[][] = []

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const rowSlices = rowExpansions[rowIndex]
    for (let rowSliceIndex = 0; rowSliceIndex < rowSlices.length; rowSliceIndex++) {
      const rowSlice = rowSlices[rowSliceIndex]
      flatRows.push({
        key: flatRowKey(rowIndex, rowSliceIndex),
        rowIndex,
        rowSliceIndex,
      })

      const values: Complex[] = []
      for (const { colIndex, colSlice } of flatColMeta) {
        const latex = table.matrix[rowIndex]?.[colIndex] ?? '0'
        values.push(
          evalCellAtQ(
            latex,
            rowSlice.assignment,
            colSlice.assignment,
            q,
            theta,
          ),
        )
      }
      rowValues.push(values)
    }
  }

  return {
    q,
    groupOrder: groupOrderAtQ(table, q),
    flatRows,
    flatColWeights,
    rowValues,
  }
}

export function weightedDot(
  a: Complex[],
  b: Complex[],
  weights: number[],
): Complex {
  let re = 0
  let im = 0
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i]
    const ar = a[i].re
    const ai = a[i].im
    const br = b[i].re
    const bi = b[i].im
    const prodRe = ar * br + ai * bi
    const prodIm = ar * bi - ai * br
    re += w * prodRe
    im += w * prodIm
  }
  return { re, im }
}

export function weightedColumnSum(
  values: Complex[],
  weights: number[],
): Complex {
  let re = 0
  let im = 0
  for (let i = 0; i < weights.length; i++) {
    re += weights[i] * values[i].re
    im += weights[i] * values[i].im
  }
  return { re, im }
}

export function weightedNormSq(values: Complex[], weights: number[]): number {
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i]
    sum += w * (values[i].re * values[i].re + values[i].im * values[i].im)
  }
  return sum
}
