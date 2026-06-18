import { describe, expect, it } from 'vitest'
import { applyChecksGuidance, formatCheckSummary, summaryDisplayText } from './checkSummary'

describe('formatCheckSummary', () => {
  it('reports pass ratio and disabled count', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'pass'],
      disabledCount: 7,
    })
    const { accent, headline } = result
    expect(summaryDisplayText(result)).toBe('4 of 4 passed · 7 disabled')
    expect(accent).toBe('pass')
    expect(headline).toBe('Valid character table')
  })

  it('includes failures in the primary clause', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'fail'],
      disabledCount: 2,
    })
    const { accent, headline } = result
    expect(summaryDisplayText(result)).toBe('3 of 4 passed, 1 failed · 2 disabled')
    expect(accent).toBe('fail')
    expect(headline).toBe('Invalid character table')
  })

  it('shows running alongside resolved counts', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'running', 'pending'],
      disabledCount: 0,
    })
    expect(summaryDisplayText(result)).toBe('2 of 2 passed · running…')
    expect(result.headline).toBe('Checks incomplete')
  })

  it('leads with Needs Sage when blocked and nothing resolved', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['blocked', 'blocked'],
      disabledCount: 5,
      sageBlocked: true,
    })
    const { accent } = result
    expect(summaryDisplayText(result)).toBe('Needs Sage · 5 disabled')
    expect(accent).toBe('warn')
  })

  it('notes skipped checks as muted diagnostics', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'skipped', 'skipped'],
      disabledCount: 0,
    })
    expect(summaryDisplayText(result)).toBe('1 of 1 passed · 2 diagnostics skipped')
    const manualRun = result.segments.find((s) => s.muted)
    expect(manualRun?.text).toBe('2 diagnostics skipped')
    expect(manualRun?.muted).toBe(true)
  })

  it('replaces invalid headline when expansion counts mismatch', () => {
    const base = formatCheckSummary({
      enabledStatuses: ['pass', 'fail'],
      disabledCount: 3,
    })
    const result = applyChecksGuidance(base, {
      expansionHeadline: '52 characters vs 46 classes',
      expansionDetail: 'Expanded counts must match at q = 2.',
      expansionAccent: 'warn',
    })
    expect(result.headline).toBe('52 characters vs 46 classes')
    expect(result.accent).toBe('warn')
    expect(result.segments[0]?.text).toContain('q = 2')
  })
})
