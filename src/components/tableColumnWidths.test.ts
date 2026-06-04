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
import { diagramSvgWidthPx } from './ArcDiagram'

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

  it('sizes diagram column with full floor when not compact', () => {
    const n = inferN(ut4Example)
    const w = diagramColumnWidthPx(ut4Example, n, false)
    expect(w).toBeGreaterThanOrEqual(84)
  })

  it('sizes compact diagram column from svg footprint', () => {
    const n = inferN(ut4Example)
    const w = diagramColumnWidthPx(ut4Example, n, true)
    expect(w).toBeGreaterThanOrEqual(diagramSvgWidthPx(n, true))
    expect(w).toBeLessThan(diagramColumnWidthPx(ut4Example, n, false))
  })

  it('does not throw when restriction lacks expansionCount', () => {
    const table = {
      ...ut4Example,
      columns: [
        {
          classSize: 'q',
          restriction: String.raw`\neg(a=b=0)`,
        },
      ],
      rows: [{}],
      matrix: [['1']],
    }
    expect(() => expansionColumnWidthPx(table)).not.toThrow()
  })

  it('shrinks sticky columns in compact mode', () => {
    const n = inferN(ut4Example)
    const full = diagramColumnWidthPx(ut4Example, n, false)
    const compact = diagramColumnWidthPx(ut4Example, n, true)
    expect(compact).toBeLessThan(full)
    expect(expansionColumnWidthPx(ut4Example, true)).toBeLessThan(
      expansionColumnWidthPx(ut4Example, false),
    )
  })
})
