/**
 * Tests for UT2 theta forms with nested parentheses.
 * Exercises: θ(β(a+b)), θ((α+β)a), θ(2βa), θ([βa-γb,γa])
 */
import { describe, expect, it } from 'vitest'
import { substituteCell, normalizeThetaInnerProducts } from './substituteCell'
import { evalCellAtQ, makeAdditiveTheta } from './evalCell'

describe('UT2 theta forms with nested parens', () => {
  const q3 = 3
  const theta3 = makeAdditiveTheta(q3)

  describe('H1: substituteCell regex captures full inner for nested parens', () => {
    it('θ(β(a+b)) substitution preserves parenthetical structure', () => {
      const sub = substituteCell('\\theta(\\beta(a+b))', { '\\beta': 1 }, { a: 1, b: 1 })
      expect(sub).toBe('\\theta(1*(1+1))')
    })

    it('θ((α+β)a) substitution preserves parenthetical structure', () => {
      const sub = substituteCell(
        '\\theta((\\alpha + \\beta)a)',
        { '\\alpha': 1, '\\beta': 1 },
        { a: 1 },
      )
      expect(sub).toContain('\\theta(')
    })
  })

  describe('H2: splitFactors handles θ with nested parens', () => {
    it('θ(1*(1+1)) evaluates to θ(2) = ζ₃², not θ(1)', () => {
      const v = evalCellAtQ('\\theta(1*(1+1))', {}, {}, q3, theta3)
      const expected = theta3(2)
      expect(v.re).toBeCloseTo(expected.re, 6)
      expect(v.im).toBeCloseTo(expected.im, 6)
    })

    it('θ((1+1)*1) evaluates to θ(2)', () => {
      const v = evalCellAtQ('\\theta((1+1)*1)', {}, {}, q3, theta3)
      const expected = theta3(2)
      expect(v.re).toBeCloseTo(expected.re, 6)
      expect(v.im).toBeCloseTo(expected.im, 6)
    })
  })

  describe('H3: parseThetaFactors handles nested parens', () => {
    it('θ(β(a+b)) evaluates to θ(2) when β=1,a=1,b=1', () => {
      const v = evalCellAtQ(
        '\\theta(\\beta(a+b))',
        { '\\beta': 1 },
        { a: 1, b: 1 },
        q3,
        theta3,
      )
      const expected = theta3(2)
      expect(v.re).toBeCloseTo(expected.re, 6)
      expect(v.im).toBeCloseTo(expected.im, 6)
    })

    it('θ((α+β)a) evaluates to θ(2) when α=1,β=1,a=1', () => {
      const v = evalCellAtQ(
        '\\theta((\\alpha + \\beta)a)',
        { '\\alpha': 1, '\\beta': 1 },
        { a: 1 },
        q3,
        theta3,
      )
      const expected = theta3(2)
      expect(v.re).toBeCloseTo(expected.re, 6)
      expect(v.im).toBeCloseTo(expected.im, 6)
    })
  })

  describe('normalizeThetaInnerProducts handles paren forms', () => {
    it('1(1+1) → 1*(1+1)', () => {
      expect(normalizeThetaInnerProducts('1(1+1)')).toBe('1*(1+1)')
    })
    it('(1+1)1 → (1+1)*1', () => {
      expect(normalizeThetaInnerProducts('(1+1)1')).toBe('(1+1)*1')
    })
    it('(2)(3) → (2)*(3)', () => {
      expect(normalizeThetaInnerProducts('(2)(3)')).toBe('(2)*(3)')
    })
  })

  describe('UT2 end-to-end orthogonality', () => {
    it.todo('row orthogonality (table entries under review)')
    it.todo('column orthogonality (table entries under review)')
  })
})
