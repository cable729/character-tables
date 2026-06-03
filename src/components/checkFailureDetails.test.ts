import { describe, expect, it } from 'vitest'
import { formatCheckFailureLines } from './checkFailureDetails'

describe('formatCheckFailureLines', () => {
  it('formats arc violations', () => {
    expect(
      formatCheckFailureLines('arc-patterns', {
        violations: ['[1,3] vanishes on some expansion', '[4,5] vanishes on some expansion'],
      }),
    ).toEqual([
      '[1,3] vanishes on some expansion',
      '[4,5] vanishes on some expansion',
    ])
  })

  it('formats trivial orthogonality failed rows', () => {
    const lines = formatCheckFailureLines('trivial-orthogonality', {
      groupOrder: 15625,
      rows: [
        { rowIndex: 0, sumRe: 15625, sumIm: 0, ok: true },
        { rowIndex: 1, sumRe: 100, sumIm: 0, ok: false },
      ],
    })
    expect(lines.some((l) => l.includes('row 1'))).toBe(true)
    expect(lines.some((l) => l.includes('expected sum ≈ 0'))).toBe(true)
  })

  it('uses message when present', () => {
    expect(
      formatCheckFailureLines('expanded-count-balance', { rowTotal: 10, colTotal: 9 }, 'counts differ'),
    ).toContain('counts differ')
  })

  it('formats Sage trivial-orthogonality badRows', () => {
    const lines = formatCheckFailureLines('trivial-orthogonality', {
      groupOrder: 64,
      badRows: [{ rowIndex: 1, sum: '100' }],
    })
    expect(lines.some((l) => l.includes('row 1'))).toBe(true)
    expect(lines.some((l) => l.includes('expected sum ≈ 0'))).toBe(true)
  })

  it('formats Sage orthogonality badPairs with ip string', () => {
    const lines = formatCheckFailureLines('row-orthogonality', {
      groupOrder: 64,
      badPairs: [{ a: 'h1.0', b: 'h2.0', ip: '3*zeta', expected: 0 }],
    })
    expect(lines.some((l) => l.includes('h1.0'))).toBe(true)
    expect(lines.some((l) => l.includes('3*zeta'))).toBe(true)
  })

  it('formats Sage theta-sum with string sum', () => {
    expect(
      formatCheckFailureLines('theta-sum', { sum: 'zeta^2 + 1' }),
    ).toEqual(['∑ θ(c·x) = zeta^2 + 1, expected 0'])
  })
})
