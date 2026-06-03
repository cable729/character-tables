import { describe, expect, it } from 'vitest'
import {
  formatCompactDisplayLatex,
  formatDisplayLatex,
  kernEqualityInMath,
  tightenEqualitySpacing,
} from './formatDisplayLatex'

describe('formatDisplayLatex', () => {
  it('leaves a single theta unchanged', () => {
    expect(formatDisplayLatex('\\theta(\\alpha a)')).toBe('\\theta(\\alpha a)')
  })

  it('merges consecutive theta factors', () => {
    expect(
      formatDisplayLatex(
        '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)',
      ),
    ).toBe('\\theta\\!\\left(\\alpha a, \\beta b, \\gamma c\\right)')
  })

  it('preserves leading scalar prefix', () => {
    expect(formatDisplayLatex('q\\theta(\\alpha a)\\theta(\\beta b)')).toBe(
      'q\\theta\\!\\left(\\alpha a, \\beta b\\right)',
    )
  })

  it('preserves delta prefix before theta run', () => {
    const input =
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)'
    expect(formatDisplayLatex(input)).toBe(
      'q\\delta_{\\alpha a = \\beta b}\\theta\\!\\left(\\alpha a, \\gamma b\\right)',
    )
  })

  it('returns empty string unchanged', () => {
    expect(formatDisplayLatex('')).toBe('')
  })
})

describe('tightenEqualitySpacing', () => {
  it('removes spaces around equals', () => {
    expect(tightenEqualitySpacing('\\neg(\\alpha = \\beta = \\gamma = 0)')).toBe(
      '\\neg(\\alpha=\\beta=\\gamma=0)',
    )
  })

  it('does not alter \\neq', () => {
    expect(tightenEqualitySpacing('a \\neq b')).toBe('a \\neq b')
  })
})

describe('kernEqualityInMath', () => {
  it('inserts mkern around equals without breaking \\neg', () => {
    expect(kernEqualityInMath('\\neg(\\alpha=\\beta=0)')).toBe(
      '\\neg(\\alpha\\mkern{-2mu}=\\mkern{-2mu}\\beta\\mkern{-2mu}=\\mkern{-2mu}0)',
    )
  })
})

describe('formatCompactDisplayLatex', () => {
  it('merges theta and kern-equals', () => {
    expect(
      formatCompactDisplayLatex(
        '\\theta(a)\\theta(b) \\neg(x = y)',
      ),
    ).toBe(
      '\\theta\\!\\left(a, b\\right) \\neg(x\\mkern{-2mu}=\\mkern{-2mu}y)',
    )
  })
})
