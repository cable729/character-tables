import { describe, expect, it } from 'vitest'
import { classDiagrams } from './__fixtures__/diagramFixtures'
import { ut4Example } from '../data/ut4Example'
import {
  arcDictToRenderArcs,
  dragPositionFromY,
  headerFromDiagram,
  headerToDiagram,
  inferN,
  renderArcsToArcDict,
} from './utils'

describe('dragPositionFromY', () => {
  const baseline = 40

  it('returns above when SVG y is above baseline', () => {
    expect(dragPositionFromY(20, baseline)).toBe('above')
  })

  it('returns below when SVG y is on or below baseline', () => {
    expect(dragPositionFromY(60, baseline)).toBe('below')
    expect(dragPositionFromY(40, baseline)).toBe('below')
  })
})

describe('renderArcsToArcDict round-trip', () => {
  const n = inferN(ut4Example)

  it('round-trips UT₄ column headers', () => {
    for (const col of ut4Example.columns) {
      const diagram = headerToDiagram(col, n)
      const dict = renderArcsToArcDict(diagram.arcs)
      const again = arcDictToRenderArcs(dict)
      expect(again).toEqual(diagram.arcs)
    }
  })

  it('round-trips UT₄ row headers', () => {
    for (const row of ut4Example.rows) {
      const diagram = headerToDiagram(row, n)
      const dict = renderArcsToArcDict(diagram.arcs)
      const again = arcDictToRenderArcs(dict)
      expect(again).toEqual(diagram.arcs)
    }
  })

  it('merges multiple pairs under one label', () => {
    const arcs = arcDictToRenderArcs({
      above: { c: [[2, 3], [1, 3]] },
    })
    const dict = renderArcsToArcDict(arcs)
    expect(dict?.above?.c).toEqual([
      [2, 3],
      [1, 3],
    ])
  })

  it('headerFromDiagram preserves id and classSize', () => {
    const spec = ut4Example.columns[1]!
    const diagram = headerToDiagram(spec, n)
    const next = headerFromDiagram(spec, diagram)
    expect(next.id).toBe(spec.id)
    expect(next.classSize).toBe(spec.classSize)
    expect(next.arcs).toEqual(spec.arcs)
    expect(next.restriction).toBe(spec.restriction)
  })
})

describe('classDiagram fixtures', () => {
  it('fixture column 1 matches chain pattern', () => {
    const diagram = classDiagrams[1]!.diagram
    expect(diagram.arcs.length).toBeGreaterThan(0)
    expect(diagram.restriction).toBeTruthy()
  })
})
