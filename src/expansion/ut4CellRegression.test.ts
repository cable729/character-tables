import { describe, expect, it } from 'vitest'
import { ut4Example } from '../data/ut4Example'
import { expandRowOrCol } from './expandDiagram'
import { evalCellAtQ, makeAdditiveTheta } from './evalCell'

describe('UT4 row 1:0 col 1:0 triple θ (q=2)', () => {
  const q = 2
  const theta = makeAdditiveTheta(q)
  const rows = ut4Example.rows.map((s, i) => expandRowOrCol(s, 4, i, q))
  const cols = ut4Example.columns.map((s, i) => expandRowOrCol(s, 4, i, q))
  const rowAssign = rows[1][0].assignment
  const colAssign = cols[1][0].assignment
  const latex = ut4Example.matrix[1][1]

  it('records slice assignments (debug anchor)', () => {
    expect(rowAssign).toMatchObject({ '\\alpha': 0, '\\beta': 0, '\\gamma': 1 })
    expect(colAssign).toMatchObject({ b: 1, a: 0, c: 1 })
  })

  it('θ(0·a)θ(0·b)θ(γ·c) = θ(0)θ(0)θ(1) = -1', () => {
    const v = evalCellAtQ(latex, rowAssign, colAssign, q, theta)
    expect(v.re).toBeCloseTo(-1, 10)
  })

  it('per-factor: γ·c = 1 mod 2', () => {
    // γ=1, c=1 → inner 1*1 = 1
    const v = evalCellAtQ('\\theta(\\gamma c)', rowAssign, colAssign, q, theta)
    expect(v.re).toBeCloseTo(-1, 10)
  })
})
