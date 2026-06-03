import { describe, expect, it } from 'vitest'
import { ut4Example } from '../data/ut4Example'
import {
  dataColumnMinWidthPx,
  diagramColumnWidthPx,
  estimateRenderUnits,
  expansionColumnWidthPx,
  DATA_COL_AUTO_THRESHOLD,
} from './tableColumnWidths'
import { inferN } from '../diagram/utils'

describe('estimateRenderUnits', () => {
  it('counts short literals as few units', () => {
    expect(estimateRenderUnits('1')).toBe(1)
    expect(estimateRenderUnits('q')).toBe(1)
  })

  it('counts LaTeX commands as one unit each', () => {
    expect(estimateRenderUnits('(q-1)^3')).toBeLessThan(10)
  })

  it('reduces units when compact merges theta factors', () => {
    const long = '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    expect(estimateRenderUnits(long, true)).toBeLessThan(
      estimateRenderUnits(long, false),
    )
  })
})

describe('dataColumnMinWidthPx', () => {
  it('returns undefined for narrow columns so table-auto can shrink', () => {
    const table = {
      ...ut4Example,
      columns: [{ classSize: '1' }],
      rows: [{}],
      matrix: [['1']],
    }
    expect(estimateRenderUnits('1')).toBeLessThanOrEqual(DATA_COL_AUTO_THRESHOLD)
    expect(dataColumnMinWidthPx(table, 0)).toBeUndefined()
  })

  it('sets min width only for long theta products', () => {
    const narrow = dataColumnMinWidthPx(ut4Example, 0)
    const wide = dataColumnMinWidthPx(ut4Example, 1)
    expect(narrow).toBeUndefined()
    expect(wide).toBeGreaterThan(100)
  })
})

describe('sticky column widths', () => {
  it('sizes expansion column for long counts like (q-1)^2 q', () => {
    const w = expansionColumnWidthPx(ut4Example)
    expect(w).toBeGreaterThanOrEqual(72)
  })

  it('sizes diagram column for restriction text', () => {
    const n = inferN(ut4Example)
    const w = diagramColumnWidthPx(ut4Example, n)
    expect(w).toBeGreaterThanOrEqual(84)
  })
})
