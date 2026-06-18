import type { CharacterTable } from '../types/characterTable'
import { iterateExpandedPairs } from './iterateExpandedPairs'
import {
  complexAdd,
  complexConj,
  complexEq,
  complexMul,
  evalCellAtQ,
  evalCellContextFromTable,
  makeAdditiveTheta,
  type Complex,
} from './evalCell'
import { evalQPolynomial } from './evalClassSize'

export type OrthogonalityBadPair = {
  a: string
  b: string
  ipRe: number
  ipIm: number
  expected: number
}

export type ColumnOrthogonalityResult = {
  G: number
  colCount: number
  rowCount: number
  bad: OrthogonalityBadPair[]
}

/** Dual orthogonality on expanded column slices (matches Sage `column_dot`). */
export function columnOrthogonalityAtQ(
  table: CharacterTable,
  q: number,
  maxBad = 10,
): ColumnOrthogonalityResult {
  const theta = makeAdditiveTheta(q)
  const pairs = iterateExpandedPairs(table, q)
  const G = evalQPolynomial(table.groupOrder ?? '1', q)

  const cols: { key: string; values: Complex[]; classWeight: number }[] = []

  for (const p of pairs) {
    const key = `${p.colIndex}:${p.colSliceIndex}`
    let col = cols.find((c) => c.key === key)
    if (!col) {
      col = { key, values: [], classWeight: p.classWeight }
      cols.push(col)
    }
    col.values.push(
      evalCellAtQ(
        p.cellLatex,
        p.rowAssignment,
        p.colAssignment,
        q,
        theta,
        evalCellContextFromTable(table, p.rowIndex, p.colIndex),
      ),
    )
  }

  const bad: OrthogonalityBadPair[] = []
  for (let j = 0; j < cols.length; j++) {
    for (let k = 0; k < cols.length; k++) {
      let ip: Complex = { re: 0, im: 0 }
      for (let i = 0; i < cols[j]!.values.length; i++) {
        const prod = complexMul(
          cols[j]!.values[i]!,
          complexConj(cols[k]!.values[i]!),
        )
        ip = complexAdd(ip, prod)
      }
      const weight = cols[j]!.classWeight
      const expected = j === k ? (weight ? G / weight : G) : 0
      const ok =
        expected === 0
          ? complexEq(ip, { re: 0, im: 0 })
          : complexEq(ip, { re: expected, im: 0 })
      if (!ok && bad.length < maxBad) {
        bad.push({
          a: cols[j]!.key,
          b: cols[k]!.key,
          ipRe: ip.re,
          ipIm: ip.im,
          expected,
        })
      }
    }
  }

  return {
    G,
    colCount: cols.length,
    rowCount: cols[0]?.values.length ?? 0,
    bad,
  }
}

export function passesColumnOrthogonality(
  table: CharacterTable,
  q: number,
): boolean {
  return columnOrthogonalityAtQ(table, q).bad.length === 0
}
