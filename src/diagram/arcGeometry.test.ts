import { describe, expect, it } from 'vitest'
import type { Diagram } from '../types/characterTable'
import {
  computeDiagramLayout,
  computeSharedDiagramBand,
  createDotX,
  diagramSvgHeightForSharedBand,
  getDiagramMetrics,
  standardHeaderDiagramWidthPx,
  suggestArcLabel,
} from './arcGeometry'

describe('computeDiagramLayout', () => {
  it('uses minimal compact height when there are no arcs', () => {
    const metrics = getDiagramMetrics(true)
    const width = 50
    const dotX = createDotX(4, width, metrics)
    const { height } = computeDiagramLayout([], dotX, metrics, true)

    const oldSymmetricHeight =
      metrics.verticalPadding +
      metrics.labelHeight / 2 +
      metrics.dotRadius +
      metrics.dotRadius +
      metrics.verticalPadding +
      metrics.labelHeight / 2

    expect(height).toBeLessThan(oldSymmetricHeight)
  })

  it('reserves label overhang only on sides with arcs', () => {
    const metrics = getDiagramMetrics(false)
    const width = 120
    const dotX = createDotX(4, width, metrics)
    const onlyAbove = computeDiagramLayout(
      [{ from: 1, to: 2, label: 'a', position: 'above' }],
      dotX,
      metrics,
      true,
    )
    const onlyBelow = computeDiagramLayout(
      [{ from: 1, to: 2, label: 'a', position: 'below' }],
      dotX,
      metrics,
      true,
    )

    expect(onlyAbove.baselineY).toBeGreaterThan(metrics.verticalPadding)
    expect(onlyBelow.baselineY).toBe(
      metrics.verticalPadding + metrics.dotRadius,
    )
  })
})

describe('computeSharedDiagramBand', () => {
  it('uses table-wide max dot-line Y only (not shared below clearance)', () => {
    const metrics = getDiagramMetrics(false)
    const width = 120
    const smallSpan: Diagram = {
      n: 4,
      arcs: [{ from: 1, to: 2, label: 'a', position: 'above' }],
    }
    const largeBelow: Diagram = {
      n: 4,
      arcs: [{ from: 1, to: 4, label: 'b', position: 'below' }],
    }

    const shared = computeSharedDiagramBand(
      [smallSpan, largeBelow],
      width,
      metrics,
      true,
    )
    const smallOnly = computeDiagramLayout(
      smallSpan.arcs,
      createDotX(4, width, metrics),
      metrics,
      true,
    )

    expect(shared.dotBaselineY).toBe(smallOnly.baselineY)
    expect(shared).toEqual({ dotBaselineY: smallOnly.baselineY })
  })

  it('keeps per-diagram below clearance in SVG height', () => {
    const metrics = getDiagramMetrics(false)
    const width = 120
    const dotX = createDotX(4, width, metrics)
    const aboveOnly = computeDiagramLayout(
      [{ from: 1, to: 2, label: 'a', position: 'above' }],
      dotX,
      metrics,
      true,
    )
    const belowHeavy = computeDiagramLayout(
      [{ from: 1, to: 4, label: 'b', position: 'below' }],
      dotX,
      metrics,
      true,
    )
    const shared = { dotBaselineY: aboveOnly.baselineY }

    expect(
      diagramSvgHeightForSharedBand(shared, aboveOnly),
    ).toBeLessThan(diagramSvgHeightForSharedBand(shared, belowHeavy))
  })
})

describe('suggestArcLabel', () => {
  it('prefers Greek labels before Latin letters', () => {
    expect(suggestArcLabel([])).toBe('\\alpha')
    expect(
      suggestArcLabel([{ from: 1, to: 2, label: '\\alpha', position: 'above' }]),
    ).toBe('\\beta')
  })
})

describe('standardHeaderDiagramWidthPx', () => {
  it('gives identical dot spacing for every column at the same n', () => {
    const n = 4
    const metrics = getDiagramMetrics(false)
    const w = standardHeaderDiagramWidthPx(n, false)
    const dotX = createDotX(n, w, metrics)
    const spacing = dotX(1) - dotX(0)

    const wideCol = createDotX(n, w * 2, metrics)
    expect(wideCol(1) - wideCol(0)).toBeGreaterThan(spacing)
    expect(dotX(1) - dotX(0)).toBe(spacing)
    expect(standardHeaderDiagramWidthPx(n, true)).toBeLessThan(w)
  })

  it('uses a wider non-compact canvas than the compact default', () => {
    const n = 4
    expect(standardHeaderDiagramWidthPx(n, false)).toBeGreaterThanOrEqual(84)
    expect(standardHeaderDiagramWidthPx(n, false)).toBeGreaterThan(
      standardHeaderDiagramWidthPx(n, true),
    )
  })
})
