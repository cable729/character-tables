import { describe, expect, it } from 'vitest'
import { evalQPolynomial } from './evalClassSize'
import {
  addQPolynomialLatex,
  parseQPolyToCoeffs,
  sumQPolynomialLatex,
} from './qPolynomial'

describe('addQPolynomialLatex', () => {
  it('adds simple terms', () => {
    expect(addQPolynomialLatex('1', '1')).toBe('2')
    expect(addQPolynomialLatex('(q-1)', '(q-1)')).toBe('2(q-1)')
  })

  it('sums UT3 row 2–4 into q^2 - 1', () => {
    const sum = sumQPolynomialLatex(['q-1', 'q-1', '(q-1)^2'])
    expect(sum).toBe('q^{2} - 1')
    expect(evalQPolynomial(sum, 5)).toBe(24)
  })

  it('handles negated cells', () => {
    expect(addQPolynomialLatex('-(q-1)', '(q-1)')).toBe('0')
    expect(addQPolynomialLatex('-(q-1)', '1')).toBe('2 - q')
    expect(addQPolynomialLatex('-1', '1')).toBe('0')
  })

  it('sums q(q-1) style cells', () => {
    const sum = addQPolynomialLatex('q(q - 1)', '0')
    expect(evalQPolynomial(sum, 3)).toBe(6)
  })

  it('sums three-term expression consistently', () => {
    const sum = sumQPolynomialLatex(['(q-1)^2', '-(q-1)', '1'])
    expect(sum).toBe('q^{2} - 3q + 3')
  })
})

describe('parseQPolyToCoeffs', () => {
  it('parses q^2 - 1', () => {
    expect(parseQPolyToCoeffs('q^{2} - 1')).toEqual([-1, 0, 1])
  })
})
