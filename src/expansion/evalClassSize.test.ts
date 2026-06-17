import { describe, expect, it } from 'vitest'
import { evalQPolynomial } from './evalClassSize'

describe('evalQPolynomial', () => {
  it('evaluates common UT4 formulas at q=5', () => {
    expect(evalQPolynomial('1', 5)).toBe(1)
    expect(evalQPolynomial('q^{2}', 5)).toBe(25)
    expect(evalQPolynomial('q^{3}', 5)).toBe(125)
    expect(evalQPolynomial('q', 5)).toBe(5)
    expect(evalQPolynomial('(q-1)', 5)).toBe(4)
    expect(evalQPolynomial('(q-1)q', 5)).toBe(20)
  })

  it('evaluates subtractive expansionCount formulas', () => {
    expect(evalQPolynomial('(q-1)q^{2} - q', 5)).toBe(95)
    expect(evalQPolynomial('(q^2-1)(q-1)', 5)).toBe(96)
    expect(evalQPolynomial('(q-1)q^{2} - (q-1)', 5)).toBe(96)
    expect(evalQPolynomial('q^{2} - 1', 5)).toBe(24)
    expect(evalQPolynomial('q^{3} - 1', 5)).toBe(124)
    expect(evalQPolynomial('(q-1)^{2}q', 5)).toBe(80)
  })
})
