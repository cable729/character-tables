import { describe, expect, it } from 'vitest'
import {
  calculatedExpansionCountLatex,
  displayExpansionCountLatex,
  hasExplicitExpansionCount,
  mergeExpansionCountAfterEdit,
} from './expansionCountDisplay'

describe('displayExpansionCountLatex', () => {
  it('uses explicit expansionCount when set', () => {
    const spec = { expansionCount: '(q-1)^{2}' }
    expect(displayExpansionCountLatex(spec)).toBe('(q-1)^{2}')
    expect(hasExplicitExpansionCount(spec)).toBe(true)
  })

  it('calculates from arcs when expansionCount omitted', () => {
    const spec = {
      arcs: { below: { a: [1, 2] as [number, number] }, above: { b: [2, 3] as [number, number] } },
    }
    expect(displayExpansionCountLatex(spec)).toBe('(q-1)q')
    expect(hasExplicitExpansionCount(spec)).toBe(false)
    expect(calculatedExpansionCountLatex(spec)).toBe('(q-1)q')
  })

  it('omits expansionCount on commit when value matches calculated', () => {
    const spec = {
      expansionCount: '(q-1)q',
      arcs: { below: { a: [1, 2] as [number, number] }, above: { b: [2, 3] as [number, number] } },
    }
    const next = mergeExpansionCountAfterEdit(spec, '(q-1)q')
    expect(next.expansionCount).toBeUndefined()
  })

  it('keeps expansionCount on commit when overridden', () => {
    const spec = {
      arcs: { below: { a: [1, 2] as [number, number] } },
    }
    const next = mergeExpansionCountAfterEdit(spec, 'q^{2}')
    expect(next.expansionCount).toBe('q^{2}')
  })

  it('counts duplicate above labels once', () => {
    const spec = {
      arcs: {
        above: {
          '\\beta': [
            [1, 3],
            [2, 4],
          ] as [number, number][],
        },
      },
    }
    expect(displayExpansionCountLatex(spec)).toBe('(q-1)')
    expect(calculatedExpansionCountLatex(spec)).toBe('(q-1)')
  })
})
