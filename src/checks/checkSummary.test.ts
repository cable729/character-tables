import { describe, expect, it } from 'vitest'
import { formatCheckSummary, summaryDisplayText } from './checkSummary'

describe('formatCheckSummary', () => {
  it('reports pass ratio and disabled count', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'pass'],
      disabledCount: 7,
    })
    const { accent } = result
    expect(summaryDisplayText(result)).toBe('4 of 4 passed · 7 disabled')
    expect(accent).toBe('pass')
  })

  it('includes failures in the primary clause', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'fail'],
      disabledCount: 2,
    })
    const { accent } = result
    expect(summaryDisplayText(result)).toBe('3 of 4 passed, 1 failed · 2 disabled')
    expect(accent).toBe('fail')
  })

  it('shows running alongside resolved counts', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'running', 'pending'],
      disabledCount: 0,
    })
    expect(summaryDisplayText(result)).toBe('2 of 2 passed · running…')
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

  it('notes skipped checks in quick mode as muted manual-run', () => {
    const result = formatCheckSummary({
      enabledStatuses: ['pass', 'skipped', 'skipped'],
      disabledCount: 0,
    })
    expect(summaryDisplayText(result)).toBe('1 of 1 passed · 2 manual-run only')
    const manualRun = result.segments.find((s) => s.muted)
    expect(manualRun?.text).toBe('2 manual-run only')
    expect(manualRun?.muted).toBe(true)
  })
})
