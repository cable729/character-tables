import { describe, expect, it } from 'vitest'
import { sageCheckRunsInDepth } from './checkMode'

describe('checkMode re-exports', () => {
  it('maps sageCheckRunsInDepth to scope helper', () => {
    expect(sageCheckRunsInDepth('theta-sum', 'quick')).toBe(true)
    expect(sageCheckRunsInDepth('row-orthogonality', 'quick')).toBe(false)
  })
})
