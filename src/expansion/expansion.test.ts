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

  it('UT4 row 1: excludes (α,β,γ)=(0,0,0) via neg(α=β=γ=0)', () => {
    const restr = String.raw`\neg(\alpha=\beta=\gamma=0)`
    for (const q of [2, 3]) {
      const assignments = enumerateAssignments(
        [],
        [String.raw`\alpha`, String.raw`\beta`, String.raw`\gamma`],
        q,
        restr,
      )
      expect(assignments).toHaveLength(q ** 3 - 1)
      expect(
        assignments.some(
          (a) =>
            a[String.raw`\alpha`] === 0 &&
            a[String.raw`\beta`] === 0 &&
            a[String.raw`\gamma`] === 0,
        ),
      ).toBe(false)
    }
  })

  it('UT4 column 1: neg(a=c=0) removes one below-below pair per q', () => {
    for (const q of [2, 3]) {
      const assignments = enumerateAssignments(
        ['b'],
        ['a', 'c'],
        q,
        '\\neg(a=c=0)',
      )
      expect(assignments).toHaveLength((q ** 2 - 1) * (q - 1))
      expect(
        assignments.some((a) => a.a === 0 && a.c === 0),
      ).toBe(false)
    }
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
