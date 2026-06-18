import { describe, expect, it } from 'vitest'
import { conjugacyCheckAtQ } from '../checks/conjugacyClassOrderCheck'
import { expansionCountAtQ, expansionCountLatex } from '../expansion/expansionCountDisplay'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { inferN } from '../diagram/utils'
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
      'q^{3}',
      'q^{2}',
      'q^{2}',
      'q',
      '1',
      'q^{2}',
      'q^{2}',
    ])
  })

  it('satisfies sum_j n_j |C_j| = q^6', () => {
    for (const q of [2, 3, 5] as const) {
      const result = conjugacyCheckAtQ(table, q)
      expect(result.passes).toBe(true)
      expect(result.sumAtQ).toBe(q ** 6)
    }
  })

  it('has correct symbolic expansion counts', () => {
    const colCounts = table.columns.map((c) => expansionCountLatex(c))
    expect(colCounts).toEqual([
      '1',
      '(q^2-1)(q-1)',
      '(q-1)q',
      '(q-1)q',
      'q^{2} - 1',
      '(q-1)',
      '(q-1)q',
      '(q-1)^{2}q',
    ])

    const rowCounts = table.rows.map((r) => expansionCountLatex(r))
    expect(rowCounts).toEqual([
      '1',
      'q^{3} - 1',
      '(q-1)q',
      '(q-1)q',
      '(q-1)q',
      '(q-1)^{2}q',
    ])
  })

  it('requires expansionCount on restricted headers', () => {
    expect(() =>
      parseTableYaml(`
group: Test
columns:
  - classSize: q
    restriction: \\\\neg(a=b=0)
rows:
  - {}
matrix:
  - [1]
`),
    ).toThrow(/expansionCount is required/)
  })

  it('matches per-family expansion counts at q=5', () => {
    const q = 5
    const colTotals = table.columns.map((c) => expansionCountAtQ(c, n, q))
    expect(colTotals).toEqual([1, 96, 20, 20, 24, 4, 20, 80])

    const rowTotals = table.rows.map((r) => expansionCountAtQ(r, n, q))
    expect(rowTotals).toEqual([1, 124, 20, 20, 20, 80])
  })

  it('has expansionCount on every restricted header', () => {
    table.columns.forEach((col, i) => {
      if (col.restriction) {
        expect(col.expansionCount, `column ${i + 1}`).toBeTruthy()
      }
    })
    table.rows.forEach((row, i) => {
      if (row.restriction) {
        expect(row.expansionCount, `row ${i + 1}`).toBeTruthy()
      }
    })
    expect(table.rows[5]?.restriction).toBeUndefined()
    expect(table.rows[5]?.expansionCount).toBeUndefined()
  })

  it('uses expansionCount for restricted families at q=5', () => {
    const q = 5
    const restrictedCol = table.columns[1]
    expect(restrictedCol.expansionCount).toBe('(q^2-1)(q-1)')
    expect(expansionCountAtQ(restrictedCol, n, q)).toBe(96)
    expect(evalQPolynomial(restrictedCol.expansionCount!, q)).toBe(96)
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
    expect(table.matrix[4][5]).toBe('q^2\\theta(\\alpha a)')
    expect(table.matrix[4][6]).toBe('q\\theta(\\alpha a)\\theta(\\beta b)')
    expect(table.matrix[5][7]).toBe('\\andre')
    expect(table.matrix[1][7]).toBe('\\theta(\\alpha a)\\theta(\\gamma b)')
  })

  it('uses column labels in linear row cell (β on arc 2–3)', () => {
    expect(table.matrix[1][6]).toBe('\\theta(\\beta b)')
  })
})
