import { describe, expect, it } from 'vitest'
import { countChoices } from './countChoices'
import { enumerateAssignments, satisfiesRestriction } from './restrictions'
import { expandDiagram } from './expandDiagram'
import { headerToDiagram } from '../diagram/utils'
import type { HeaderSpec } from '../types/characterTable'

describe('restrictions', () => {
  it('counts three above labels as (q-1)^3 before restriction', () => {
    const assignments = enumerateAssignments(['a', 'b', 'c'], [], 5)
    expect(assignments.length).toBe(4 ** 3)
  })

  it('applies not(a=c=0) restriction', () => {
    const assignments = enumerateAssignments(
      ['a', 'b', 'c'],
      [],
      5,
      '\\neg(a=c=0)',
    )
    expect(assignments.length).toBe(4 ** 3)
  })

  it('evaluates a!=b restriction', () => {
    expect(satisfiesRestriction('a \\neq b', { a: 1, b: 2 })).toBe(true)
    expect(satisfiesRestriction('a \\neq b', { a: 2, b: 2 })).toBe(false)
  })

  it('evaluates not(a=b=0) restriction with below labels', () => {
    const assignments = enumerateAssignments(
      [],
      ['a', 'b'],
      3,
      '\\neg(a=b=0)',
    )
    expect(assignments.every((a) => !(a.a === 0 && a.b === 0))).toBe(true)
    expect(assignments.length).toBe(3 ** 2 - 1)
  })
})

describe('countChoices', () => {
  const col = (spec: HeaderSpec) => headerToDiagram(spec, 4)

  it('returns 1 for empty diagram', () => {
    expect(countChoices(col({}), 5).total).toBe(1)
  })

  it('returns q-1 for single above label', () => {
    expect(
      countChoices(col({ arcs: { above: { a: [1, 4] } } }), 5).total,
    ).toBe(4)
  })

  it('returns (q-1)^2 for two above labels', () => {
    expect(
      countChoices(
        col({ arcs: { above: { a: [1, 2], b: [2, 3] } } }),
        5,
      ).total,
    ).toBe(16)
  })

  it('returns q for single below label', () => {
    expect(
      countChoices(col({ arcs: { below: { a: [1, 3] } } }), 5).total,
    ).toBe(5)
  })
})

describe('expandDiagram', () => {
  it('produces correct number of slices', () => {
    const diagram = headerToDiagram({ arcs: { above: { a: [1, 4] } } }, 4)
    const slices = expandDiagram(diagram, 'c1', 3)
    expect(slices.length).toBe(2)
  })
})
