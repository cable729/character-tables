import { describe, expect, it } from 'vitest'
import { summarizeExpansionCountGuidance } from './expansionCountSummary'

describe('summarizeExpansionCountGuidance', () => {
  it('reports expanded slice count mismatch with numbers', () => {
    const guidance = summarizeExpansionCountGuidance({
      expansionStatus: [
        {
          q: 2,
          rowTotal: 52,
          colTotal: 46,
          passes: false,
          declaredRowTotal: 52,
          declaredColTotal: 46,
          declaredPasses: false,
          declaredMatchesEnumerated: true,
        },
      ],
      hasExpansionCountIssues: false,
    })
    expect(guidance?.headline).toBe('52 row choices vs 46 column choices')
    expect(guidance?.countsMismatch).toBe(true)
    expect(guidance?.detail).toContain('q = 2')
  })

  it('reports declared Choices imbalance before enumerated-only square tables', () => {
    const guidance = summarizeExpansionCountGuidance({
      expansionStatus: [
        {
          q: 2,
          rowTotal: 14,
          colTotal: 14,
          passes: true,
          declaredRowTotal: 15,
          declaredColTotal: 14,
          declaredPasses: false,
          declaredMatchesEnumerated: false,
        },
      ],
      hasExpansionCountIssues: false,
    })
    expect(guidance?.headline).toBe('15 row choices vs 14 column choices')
    expect(guidance?.countsMismatch).toBe(true)
  })

  it('returns null when enumerated and declared both square and agree', () => {
    const guidance = summarizeExpansionCountGuidance({
      expansionStatus: [
        {
          q: 2,
          rowTotal: 16,
          colTotal: 16,
          passes: true,
          declaredRowTotal: 16,
          declaredColTotal: 16,
          declaredPasses: true,
          declaredMatchesEnumerated: true,
        },
      ],
      hasExpansionCountIssues: false,
    })
    expect(guidance).toBeNull()
  })
})
