/**
 * Weighted column sum for a fixed expanded row — must be 0 for orthogonality vs trivial.
 */
import type { CharacterTable } from '../types/characterTable'
import { iterateExpandedPairs } from './iterateExpandedPairs'
import { evalCellAtQ, evalCellContextFromTable, makeAdditiveTheta } from './evalCell'

export type ExpandedRowCell = {
  colKey: string
  latex: string
  classWeight: number
  re: number
  im: number
}

export function expandedRowCells(
  table: CharacterTable,
  q: number,
  rowIndex: number,
  rowSliceIndex: number,
): ExpandedRowCell[] {
  const theta = makeAdditiveTheta(q)
  return iterateExpandedPairs(table, q)
    .filter(
      (p) => p.rowIndex === rowIndex && p.rowSliceIndex === rowSliceIndex,
    )
    .map((p) => {
      const v = evalCellAtQ(
        p.cellLatex,
        p.rowAssignment,
        p.colAssignment,
        q,
        theta,
        evalCellContextFromTable(table, p.rowIndex, p.colIndex),
      )
      return {
        colKey: `${p.colIndex}:${p.colSliceIndex}`,
        latex: p.cellLatex,
        classWeight: p.classWeight,
        re: v.re,
        im: v.im,
      }
    })
}

export function weightedRowSum(
  table: CharacterTable,
  q: number,
  rowIndex: number,
  rowSliceIndex: number,
): { re: number; im: number } {
  const cells = expandedRowCells(table, q, rowIndex, rowSliceIndex)
  let re = 0
  let im = 0
  for (const c of cells) {
    re += c.classWeight * c.re
    im += c.classWeight * c.im
  }
  return { re, im }
}
