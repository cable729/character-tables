import { describe, expect, it } from 'vitest'
import { conjugacyCheckAtQ } from '../checks/conjugacyClassOrderCheck'
import {
  fullExpansionBlockInfo,
  runDeclaredCountBalanceAtQ,
  runExpandedCountBalanceAtQ,
} from '../checks/expansionReadiness'
import { expansionCountLatex } from '../expansion/expansionCountDisplay'
import { parseTableYaml } from '../schema/yamlTable'
import ut2Yaml from './ut2-ut1-fq.yaml?raw'

describe('UT_2^{(1)} condensed table', () => {
  const table = parseTableYaml(ut2Yaml)

  it('has canonical shape', () => {
    expect(table.columns).toHaveLength(5)
    expect(table.rows).toHaveLength(5)
    expect(table.group).toBe('UT_2^{(1)}(\\mathbb{F}_q)')
    expect(table.groupOrder).toBe('q^{5}')
    expect(table.groupSpec).toEqual({ kind: 'ut_n_k', n: 2, k: 1 })
    expect(table.n).toBe(4)
  })

  it('has correct conjugacy class sizes |C|', () => {
    expect(table.columns.map((c) => c.classSize)).toEqual([
      '1',
      '1',
      'q^2',
      '1',
      'q^2',
    ])
  })

  it('satisfies sum_j n_j |C_j| = q^5', () => {
    for (const q of [2, 3, 5] as const) {
      const result = conjugacyCheckAtQ(table, q)
      expect(result.passes).toBe(true)
      expect(result.sumAtQ).toBe(q ** 5)
    }
  })

  it('has declared expansion counts matching enumeration at q=2', () => {
    const q = 2
    const enumerated = runExpandedCountBalanceAtQ(table, q)
    const declared = runDeclaredCountBalanceAtQ(table, q)
    expect(enumerated).toEqual({ rowTotal: 14, colTotal: 14, passes: true })
    expect(declared).toEqual({ rowTotal: 14, colTotal: 14, passes: true })
  })

  it('allows full expansion checks at default q', () => {
    expect(fullExpansionBlockInfo(table, [2, 3, 5]).blocked).toBe(false)
  })

  it('has symbolic column expansion counts', () => {
    expect(table.columns.map((c) => expansionCountLatex(c))).toEqual([
      '1',
      'q^2-1',
      'q(q-1)',
      'q^2(q-1)',
      'q^2(q-1)',
    ])
  })

  it('uses q(q-1) on row 3 (not q^2-1)', () => {
    expect(expansionCountLatex(table.rows[3]!)).toBe('q(q-1)')
  })
})
