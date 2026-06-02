import { describe, expect, it } from 'vitest'
import { formatCheckSummary } from './checkSummary'

describe('formatCheckSummary', () => {
  it('reports pass ratio and disabled count', () => {
    const { text, accent } = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'pass'],
      disabledCount: 7,
    })
    expect(text).toBe('4 of 4 passed · 7 disabled')
    expect(accent).toBe('pass')
  })

  it('includes failures in the primary clause', () => {
    const { text, accent } = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'pass', 'fail'],
      disabledCount: 2,
    })
    expect(text).toBe('3 of 4 passed, 1 failed · 2 disabled')
    expect(accent).toBe('fail')
  })

  it('shows running alongside resolved counts', () => {
    const { text } = formatCheckSummary({
      enabledStatuses: ['pass', 'pass', 'running', 'pending'],
      disabledCount: 0,
    })
    expect(text).toBe('2 of 2 passed · running…')
  })

  it('leads with Needs Sage when blocked and nothing resolved', () => {
    const { text, accent } = formatCheckSummary({
      enabledStatuses: ['blocked', 'blocked'],
      disabledCount: 5,
      sageBlocked: true,
    })
    expect(text).toBe('Needs Sage · 5 disabled')
    expect(accent).toBe('warn')
  })

  it('notes skipped checks in quick mode', () => {
    const { text } = formatCheckSummary({
      enabledStatuses: ['pass', 'skipped', 'skipped'],
      disabledCount: 0,
    })
    expect(text).toBe('1 of 1 passed · 2 full only')
  })
})
