import { describe, expect, it } from 'vitest'
import { summarizeExpansionCountGuidance } from './expansionCountSummary'

describe('summarizeExpansionCountGuidance', () => {
  it('reports expanded slice count mismatch with numbers', () => {
    const guidance = summarizeExpansionCountGuidance({
      expansionStatus: [
        { q: 2, rowTotal: 52, colTotal: 46, passes: false },
      ],
      hasExpansionCountIssues: false,
    })
    expect(guidance?.headline).toBe('52 characters vs 46 classes')
    expect(guidance?.countsMismatch).toBe(true)
    expect(guidance?.detail).toContain('q = 2')
  })

  it('ignores condensed header dimensions', () => {
    const guidance = summarizeExpansionCountGuidance({
      expansionStatus: [{ q: 2, rowTotal: 16, colTotal: 16, passes: true }],
      hasExpansionCountIssues: false,
    })
    expect(guidance).toBeNull()
  })
})
