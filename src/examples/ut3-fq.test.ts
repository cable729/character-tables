import { describe, expect, it } from 'vitest'
import { conjugacyCheckAtQ } from '../checks/conjugacyClassOrderCheck'
import { expansionCountAtQ } from '../expansion/expansionCount'
import { expansionCountLatex, inferN } from '../diagram/utils'
import { parseTableYaml } from '../schema/yamlTable'
import ut3Yaml from './ut3-fq.yaml?raw'

describe('UT3 condensed table', () => {
  const table = parseTableYaml(ut3Yaml)
  const n = inferN(table)

  it('has canonical shape', () => {
    expect(table.columns).toHaveLength(5)
    expect(table.rows).toHaveLength(5)
    expect(table.matrix).toHaveLength(5)
    expect(table.matrix.every((row) => row.length === 5)).toBe(true)
    expect(table.group).toBe('UT_3(\\mathbb{F}_q)')
    expect(table.groupOrder).toBe('q^{3}')
    expect(table.n).toBe(3)
  })

  it('has correct conjugacy class sizes |C|', () => {
    const sizes = table.columns.map((c) => c.classSize)
    expect(sizes).toEqual(['1', 'q', 'q', 'q', '1'])
  })

  it('satisfies sum_j n_j |C_j| = q^3', () => {
    for (const q of [2, 3, 5] as const) {
      const result = conjugacyCheckAtQ(table, q)
      expect(result.passes).toBe(true)
      expect(result.sumAtQ).toBe(q ** 3)
    }
  })

  it('has correct symbolic expansion counts', () => {
    const colCounts = table.columns.map((c) => expansionCountLatex(c))
    expect(colCounts).toEqual(['1', '(q-1)', '(q-1)', '(q-1)^{2}', '(q-1)'])

    const rowCounts = table.rows.map((r) => expansionCountLatex(r))
    expect(rowCounts).toEqual(['1', 'q', 'q', 'q^{2}', 'q^{2}(q-1)'])
  })

  it('matches per-family expansion counts at q=5', () => {
    const q = 5
    const colTotals = table.columns.map((c) => expansionCountAtQ(c, n, q))
    expect(colTotals).toEqual([1, 4, 4, 16, 4])

    const rowTotals = table.rows.map((r) => expansionCountAtQ(r, n, q))
    expect(rowTotals).toEqual([1, 5, 5, 25, 100])
  })

  it('has character degrees 1,1,1,1,q on the identity column', () => {
    expect(table.matrix.map((row) => row[0])).toEqual(['1', '1', '1', '1', 'q'])
  })

  it('has anchor matrix entries', () => {
    expect(table.matrix[0][0]).toBe('1')
    expect(table.matrix[1][1]).toBe('\\theta(\\alpha a)')
    expect(table.matrix[2][2]).toBe('\\theta(\\beta b)')
    expect(table.matrix[3][3]).toBe('\\theta(\\alpha a)\\theta(\\beta b)')
    expect(table.matrix[4][4]).toBe('q\\theta(\\gamma c)')
    expect(table.matrix[4][1]).toBe('0')
  })
})
