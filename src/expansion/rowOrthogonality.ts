import type { CharacterTable } from '../types/characterTable'
import { iterateExpandedPairs } from './iterateExpandedPairs'
import {
  complexAdd,
  complexConj,
  complexEq,
  complexMul,
  evalCellAtQ,
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

export type RowOrthogonalityResult = {
  G: number
  rowCount: number
  colCount: number
  bad: OrthogonalityBadPair[]
}

export function rowOrthogonalityAtQ(
  table: CharacterTable,
  q: number,
  maxBad = 10,
): RowOrthogonalityResult {
  const theta = makeAdditiveTheta(q)
  const pairs = iterateExpandedPairs(table, q)
  const G = evalQPolynomial(table.groupOrder ?? '1', q)

  const rows: { key: string; values: Complex[]; weights: number[] }[] = []

  for (const p of pairs) {
    const key = `${p.rowIndex}:${p.rowSliceIndex}`
    let row = rows.find((r) => r.key === key)
    if (!row) {
      row = { key, values: [], weights: [] }
      rows.push(row)
    }
    row.values.push(
      evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta),
    )
    row.weights.push(p.classWeight)
  }

  const bad: OrthogonalityBadPair[] = []
  for (let i = 0; i < rows.length; i++) {
    for (let k = 0; k < rows.length; k++) {
      let ip = { re: 0, im: 0 }
      for (let j = 0; j < rows[i].values.length; j++) {
        const w = rows[i].weights[j]
        const prod = complexMul(rows[i].values[j], complexConj(rows[k].values[j]))
        ip = complexAdd(ip, { re: w * prod.re, im: w * prod.im })
      }
      const expected = i === k ? G : 0
      const ok =
        expected === 0
          ? complexEq(ip, { re: 0, im: 0 })
          : complexEq(ip, { re: expected, im: 0 })
      if (!ok && bad.length < maxBad) {
        bad.push({
          a: rows[i].key,
          b: rows[k].key,
          ipRe: ip.re,
          ipIm: ip.im,
          expected,
        })
      }
    }
  }

  return {
    G,
    rowCount: rows.length,
    colCount: rows[0]?.values.length ?? 0,
    bad,
  }
}

export function passesRowOrthogonality(
  table: CharacterTable,
  q: number,
): boolean {
  return rowOrthogonalityAtQ(table, q).bad.length === 0
}
