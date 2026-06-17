import { describe, expect, it } from 'vitest'
import { substituteCell } from './substituteCell'
import {
  evalCellAtQ,
  isComplexZero,
  isDegreeOnlyCell,
  makeAdditiveTheta,
  thetaSumOverField,
} from './evalCell'

describe('evalCell', () => {
  const q = 3
  const theta = makeAdditiveTheta(q)

  it('evaluates constants and q-powers', () => {
    const z = evalCellAtQ('q^2', {}, {}, q, theta)
    expect(z.re).toBe(9)
    expect(z.im).toBeCloseTo(0)
  })

  it('substituted θ(αa) at α=1,a=1 uses 1*1 not merged 11 (UT3 q=3 bug)', () => {
    expect(substituteCell('\\theta(\\alpha a)', { '\\alpha': 1 }, { a: 1 })).toBe(
      '\\theta(1*1)',
    )
    const v = evalCellAtQ('\\theta(\\alpha a)', { '\\alpha': 1 }, { a: 1 }, q, theta)
    expect(v.im).toBeCloseTo(0.8660254, 5)
  })

  it('α=1,a=2 gives θ(2) via 1*2 normalization', () => {
    const v = evalCellAtQ('\\theta(\\alpha a)', { '\\alpha': 1 }, { a: 2 }, q, theta)
    const wrong = evalCellAtQ('\\theta(11)', {}, {}, q, theta)
    expect(v.re).toBeCloseTo(-0.5, 6)
    expect(v.im).toBeCloseTo(-0.8660254, 5)
    expect(wrong.im).not.toBeCloseTo(v.im, 2)
  })

  it('evaluates delta', () => {
    const z = evalCellAtQ(
      '\\delta_{\\alpha a = \\beta b}',
      { alpha: 1, beta: 1 },
      { a: 2, b: 2 },
      q,
      theta,
    )
    expect(z.re).toBe(1)
    const z0 = evalCellAtQ(
      '\\delta_{\\alpha a = \\beta b}',
      { alpha: 1, beta: 2 },
      { a: 1, b: 1 },
      q,
      theta,
    )
    expect(z0.re).toBe(0)
  })

  it('theta sum over field is zero', () => {
    const sum = thetaSumOverField(q, 1, theta)
    expect(isComplexZero(sum)).toBe(true)
  })

  it('detects degree-only cells', () => {
    expect(isDegreeOnlyCell('q^2')).toBe(true)
    expect(isDegreeOnlyCell('\\theta(a)')).toBe(false)
  })

  it('evaluates q times theta with Greek row/column labels', () => {
    const z = evalCellAtQ(
      'q\\theta(\\alpha a)\\theta(\\beta b)',
      { '\\alpha': 1, '\\beta': 2 },
      { a: 1, b: 1 },
      q,
      theta,
    )
    expect(Number.isFinite(z.re)).toBe(true)
  })

  it('evaluates q times a delta that evaluates to 1', () => {
    const z = evalCellAtQ(
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)',
      { '\\alpha': 1, '\\beta': 1 },
      { a: 1, b: 1 },
      q,
      theta,
    )
    expect(Number.isFinite(z.re)).toBe(true)
  })
})
