import { describe, expect, it } from 'vitest'
import { formatDisplayLatex } from './formatDisplayLatex'

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
