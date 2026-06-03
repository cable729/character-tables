import { describe, expect, it } from 'vitest'
import { inferExpansionCountLatex } from './inferExpansionCountLatex'

describe('inferExpansionCountLatex', () => {
  it('matches common UT4 counts at q=5', () => {
    expect(inferExpansionCountLatex(4, 5)).toBe('(q-1)')
    expect(inferExpansionCountLatex(16, 5)).toBe('(q-1)^{2}')
    expect(inferExpansionCountLatex(20, 5)).toBe('(q-1)q')
    expect(inferExpansionCountLatex(24, 5)).toBe('q^{2}-1')
  })
})
