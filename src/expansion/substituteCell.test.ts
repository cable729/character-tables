import { describe, expect, it } from 'vitest'
import {
  normalizeThetaInnerProducts,
  substituteCell,
  substituteCellForDisplay,
} from './substituteCell'
import {
  EVAL_THETA_FIELD_ELT_CASES,
  THETA_INNER_NORMALIZE_CASES,
  THETA_SUBST_CASES,
  thetaAngle,
} from './thetaTestVectors'

function expandThetaViaSubstitute(
  inner: string,
  row: Record<string, number>,
  col: Record<string, number>,
): string {
  const latex = `\\theta(${inner})`
  const sub = substituteCell(latex, row, col)
  const m = /\\theta\(([^)]+)\)/.exec(sub)
  return m?.[1] ?? sub
}

describe('normalizeThetaInnerProducts', () => {
  it.each(THETA_INNER_NORMALIZE_CASES)(
    'normalizes $input → $expected',
    ({ input, expected }) => {
      expect(normalizeThetaInnerProducts(input)).toBe(expected)
    },
  )
})

describe('θ inner substitution', () => {
  it.each(THETA_SUBST_CASES)(
    'expands $inner with row/col assignments',
    ({ inner, row, col, expected }) => {
      expect(expandThetaViaSubstitute(inner, row, col)).toBe(expected)
    },
  )

  it('does not treat substituted digits as a multi-digit integer', () => {
    expect(expandThetaViaSubstitute('\\alpha a', { '\\alpha': 2 }, { a: 1 })).toBe(
      '2*1',
    )
    expect(expandThetaViaSubstitute('\\alpha a', { '\\alpha': 1 }, { a: 1 })).toBe(
      '1*1',
    )
    expect(expandThetaViaSubstitute('\\alpha a', { '\\alpha': 1 }, { a: 2 })).toBe(
      '1*2',
    )
  })

  it('substitutes Greek labels with backslash in full cell', () => {
    expect(
      substituteCell(
        '\\theta(\\alpha a)',
        { '\\alpha': 2 },
        { a: 1 },
      ),
    ).toBe('\\theta(2*1)')
  })

  it('substitutes triple θ product for UT4 row template', () => {
    const latex =
      '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    const row = { '\\alpha': 0, '\\beta': 0, '\\gamma': 1 }
    const col = { b: 1, a: 1, c: 0 }
    expect(substituteCell(latex, row, col)).toBe(
      '\\theta(0*1)\\theta(0*1)\\theta(1*0)',
    )
  })

  it('inserts * between label and substituted column digit in θ inner', () => {
    expect(
      substituteCell('\\theta(\\alpha a)', {}, { a: 9 }),
    ).toBe('\\theta(\\alpha*9)')
  })

  it('display substitution uses cdot instead of asterisk', () => {
    expect(
      substituteCellForDisplay('\\theta(\\alpha a)', { '\\alpha': 2 }, { a: 1 }),
    ).toBe('\\theta(2\\cdot 1)')
  })
})

describe('θ substitution angles (field element mod q)', () => {
  it.each(EVAL_THETA_FIELD_ELT_CASES.filter((c) => !c.latex.includes('\\beta')))(
    '$latex at q=$q has field element $fieldElt',
    ({ latex, row, col, q, fieldElt }) => {
      const sub = substituteCell(latex, row, col)
      const inner = /\\theta\(([^)]+)\)/.exec(sub)?.[1]
      expect(inner).toBeTruthy()
      const parts = inner!.split('*').map(Number)
      const product = parts.reduce((p, n) => p * n, 1)
      expect(product % q).toBe(fieldElt % q)
      expect(thetaAngle(q, product)).toBeCloseTo(thetaAngle(q, fieldElt), 10)
    },
  )
})
