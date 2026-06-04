import { describe, expect, it } from 'vitest'
import { estimateRenderUnits } from './renderUnits'

describe('estimateRenderUnits', () => {
  it('does not count LaTeX command names as subscript letters', () => {
    const deltaLine = 'q\\delta_{\\alpha a = \\beta b} \\cdot'
    expect(estimateRenderUnits(deltaLine, true)).toBeLessThan(25)
  })
})
