import { describe, expect, it } from 'vitest'
import { countChoices } from '../expansion/countChoices'
import { expansionCountLatex, headerToDiagram, inferN } from '../diagram/utils'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from './ut4-fq.yaml?raw'

describe('UT4 condensed table', () => {
  const table = parseTableYaml(ut4Yaml)
  const n = inferN(table)

  it('has canonical shape', () => {
    expect(table.columns).toHaveLength(8)
    expect(table.rows).toHaveLength(6)
    expect(table.matrix).toHaveLength(6)
    expect(table.matrix.every((row) => row.length === 8)).toBe(true)
  })

  it('has correct conjugacy class sizes |C|', () => {
    const sizes = table.columns.map((c) => c.classSize)
    expect(sizes).toEqual([
      '1',
      'q^{2}',
      'q^{2}',
      'q^{2}',
      'q^{2}',
      '(q-1)',
      '(q-1)q',
      '(q-1)q',
    ])
  })

  it('has correct symbolic expansion counts', () => {
    const colCounts = table.columns.map((c) => expansionCountLatex(c))
    expect(colCounts).toEqual([
      '1',
      '(q-1)q^{2}\\;(\\text{restricted})',
      '(q-1)q',
      '(q-1)q',
      'q^{2}\\;(\\text{restricted})',
      '(q-1)',
      '(q-1)q',
      '(q-1)^{2}q',
    ])

    const rowCounts = table.rows.map((r) => expansionCountLatex(r))
    expect(rowCounts).toEqual([
      '1',
      'q^{3}\\;(\\text{restricted})',
      '(q-1)q',
      '(q-1)q',
      '(q-1)q',
      '(q-1)^{2}q\\;(\\text{restricted})',
    ])
  })

  it('matches per-family expansion counts at q=5', () => {
    const q = 5
    const colTotals = table.columns.map((c) =>
      countChoices(headerToDiagram(c, n), q).total,
    )
    expect(colTotals).toEqual([1, 96, 20, 20, 24, 4, 20, 80])

    const rowTotals = table.rows.map((r) =>
      countChoices(headerToDiagram(r, n), q).total,
    )
    expect(rowTotals).toEqual([1, 120, 20, 20, 20, 80])
  })

  it('has character degrees 1,1,q,q,q^2,q on the identity column', () => {
    expect(table.matrix.map((row) => row[0])).toEqual([
      '1',
      '1',
      'q',
      'q',
      'q^2',
      'q',
    ])
  })

  it('has anchor matrix entries', () => {
    expect(table.matrix[0][0]).toBe('1')
    expect(table.matrix[1][1]).toBe(
      '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)',
    )
    expect(table.matrix[4][5]).toBe('q^2\\theta(\\alpha a)\\theta(\\beta b)')
    expect(table.matrix[4][6]).toBe('q\\theta(\\alpha a)\\theta(\\beta b)')
    expect(table.matrix[5][7]).toBe(
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)',
    )
  })

  it('uses column labels in linear row cell (β on arc 1–2)', () => {
    expect(table.matrix[1][6]).toBe('\\theta(\\beta a)')
  })
})
