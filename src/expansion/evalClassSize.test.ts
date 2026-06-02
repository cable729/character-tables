import { describe, expect, it } from 'vitest'
import { evalClassSize } from './evalClassSize'

describe('evalClassSize', () => {
  it('evaluates common UT4 formulas at q=5', () => {
    expect(evalClassSize('1', 5)).toBe(1)
    expect(evalClassSize('q^{2}', 5)).toBe(25)
    expect(evalClassSize('q^{3}', 5)).toBe(125)
    expect(evalClassSize('q', 5)).toBe(5)
    expect(evalClassSize('(q-1)', 5)).toBe(4)
    expect(evalClassSize('(q-1)q', 5)).toBe(20)
  })
})
