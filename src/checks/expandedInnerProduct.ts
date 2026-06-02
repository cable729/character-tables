import {
  complexAdd,
  evalCellAtQ,
  isComplexZero,
  makeAdditiveTheta,
  type Complex,
  type ThetaFn,
} from '../expansion/evalCell'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { expandRowOrCol } from '../expansion/expandDiagram'
import { inferN } from '../diagram/utils'
import type { CharacterTable } from '../types/characterTable'
import {
  getExpandedTableAtQ,
  weightedColumnSum,
  weightedDot,
} from './expandedTableAtQ'

export type FlatRowKey = string

export function flatRowKey(rowIndex: number, rowSliceIndex: number): FlatRowKey {
  return `${rowIndex}:${rowSliceIndex}`
}

export function listFlatRows(
  table: CharacterTable,
  q: number,
): { key: FlatRowKey; rowIndex: number; rowSliceIndex: number }[] {
  const n = inferN(table)
  const rows: { key: FlatRowKey; rowIndex: number; rowSliceIndex: number }[] = []
  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const slices = expandRowOrCol(table.rows[rowIndex], n, rowIndex, q)
    for (let rowSliceIndex = 0; rowSliceIndex < slices.length; rowSliceIndex++) {
      rows.push({
        key: flatRowKey(rowIndex, rowSliceIndex),
        rowIndex,
        rowSliceIndex,
      })
    }
  }
  return rows
}

export function weightedInnerProduct(
  table: CharacterTable,
  q: number,
  _theta: ThetaFn,
  rowA: number,
  rowSliceA: number,
  rowB: number,
  rowSliceB: number,
): Complex {
  const expanded = getExpandedTableAtQ(table, q)
  const indexA = expanded.flatRows.findIndex(
    (r) => r.rowIndex === rowA && r.rowSliceIndex === rowSliceA,
  )
  const indexB = expanded.flatRows.findIndex(
    (r) => r.rowIndex === rowB && r.rowSliceIndex === rowSliceB,
  )
  if (indexA < 0 || indexB < 0) {
    return { re: 0, im: 0 }
  }
  return weightedDot(
    expanded.rowValues[indexA],
    expanded.rowValues[indexB],
    expanded.flatColWeights,
  )
}

export function trivialOrthogonalitySums(
  table: CharacterTable,
  q: number,
  _theta: ThetaFn = makeAdditiveTheta(q),
): { rowIndex: number; sum: Complex; expectedZero: boolean }[] {
  const expanded = getExpandedTableAtQ(table, q)
  const results: { rowIndex: number; sum: Complex; expectedZero: boolean }[] = []

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    let total = { re: 0, im: 0 }
    for (let i = 0; i < expanded.flatRows.length; i++) {
      if (expanded.flatRows[i].rowIndex !== rowIndex) {
        continue
      }
      total = complexAdd(
        total,
        weightedColumnSum(
          expanded.rowValues[i],
          expanded.flatColWeights,
        ),
      )
    }
    results.push({
      rowIndex,
      sum: total,
      expectedZero: rowIndex !== 0,
    })
  }

  return results
}

export function groupOrderAtQ(table: CharacterTable, q: number): number {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required')
  }
  return evalQPolynomial(table.groupOrder, q)
}
