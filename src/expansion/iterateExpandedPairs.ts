import { inferN } from '../diagram/utils'
import { evalQPolynomial } from './evalClassSize'
import { expandRowOrCol } from './expandDiagram'
import type {
  CharacterTable,
  ExpansionSlice,
  LabelAssignment,
} from '../types/characterTable'

export type ExpandedPair = {
  rowIndex: number
  colIndex: number
  rowSliceIndex: number
  colSliceIndex: number
  rowSlice: ExpansionSlice
  colSlice: ExpansionSlice
  /** |C_j| for column family j */
  classWeight: number
  cellLatex: string
  rowAssignment: LabelAssignment
  colAssignment: LabelAssignment
}

export function iterateExpandedPairs(
  table: CharacterTable,
  q: number,
): ExpandedPair[] {
  const n = inferN(table)
  const rowExpansions = table.rows.map((spec, index) =>
    expandRowOrCol(spec, n, index, q),
  )
  const colExpansions = table.columns.map((spec, index) =>
    expandRowOrCol(spec, n, index, q),
  )

  const pairs: ExpandedPair[] = []

  for (let rowIndex = 0; rowIndex < rowExpansions.length; rowIndex++) {
    const rowSlices = rowExpansions[rowIndex]
    for (let rowSliceIndex = 0; rowSliceIndex < rowSlices.length; rowSliceIndex++) {
      const rowSlice = rowSlices[rowSliceIndex]
      for (let colIndex = 0; colIndex < colExpansions.length; colIndex++) {
        const classSize = table.columns[colIndex].classSize ?? '1'
        const classWeight = evalQPolynomial(classSize, q)
        const colSlices = colExpansions[colIndex]
        for (let colSliceIndex = 0; colSliceIndex < colSlices.length; colSliceIndex++) {
          const colSlice = colSlices[colSliceIndex]
          pairs.push({
            rowIndex,
            colIndex,
            rowSliceIndex,
            colSliceIndex,
            rowSlice,
            colSlice,
            classWeight,
            cellLatex: table.matrix[rowIndex]?.[colIndex] ?? '0',
            rowAssignment: rowSlice.assignment,
            colAssignment: colSlice.assignment,
          })
        }
      }
    }
  }

  return pairs
}

export function flatExpandedRowCount(table: CharacterTable, q: number): number {
  const n = inferN(table)
  return table.rows.reduce(
    (sum, spec, index) => sum + expandRowOrCol(spec, n, index, q).length,
    0,
  )
}

export function flatExpandedColCount(table: CharacterTable, q: number): number {
  const n = inferN(table)
  return table.columns.reduce(
    (sum, spec, index) => sum + expandRowOrCol(spec, n, index, q).length,
    0,
  )
}
