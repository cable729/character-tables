import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import {
  flatExpandedColCount,
  flatExpandedRowCount,
} from '../expansion/iterateExpandedPairs'
import {
  fullExpansionBlockInfo,
  runCountBalanceCheckAtQ,
  runExpandedCountBalanceAtQ,
} from './expansionReadiness'
import { getChecksPartition } from './registry'
import { expandedCountBalanceCheck } from './structuralChecks'
import ut2Yaml from '../examples/ut2-ut1-fq.yaml?raw'

const ut4 = parseTableYaml(ut4Yaml)

describe('UT4 expansion counts', () => {
  it('reports row/col totals per q', () => {
    for (const q of [2, 3, 5]) {
      const rows = flatExpandedRowCount(ut4, q)
      const cols = flatExpandedColCount(ut4, q)
      console.log(`q=${q}: rows=${rows} cols=${cols}`)
      expect({ q, rows, cols }).toBeDefined()
    }
  })

  it('passes enumerated balance at q=5', () => {
    expect(runExpandedCountBalanceAtQ(ut4, 5).passes).toBe(true)
    expect(runExpandedCountBalanceAtQ(ut4, 5).rowTotal).toBe(265)
  })

  it('allows full expansion checks for UT4 at default q', () => {
    const block = fullExpansionBlockInfo(ut4, [2, 3, 5])
    expect(block.blocked).toBe(false)
  })

  it('partitions verifier checks as active at default q', () => {
    const { enabled, disabled } = getChecksPartition(ut4, [2, 3, 5], 'verifier')
    expect(disabled.length).toBe(0)
    expect(enabled.length).toBe(5)
  })

  it('includes diagnostics when scope is diagnostics', () => {
    const { enabled } = getChecksPartition(ut4, [2, 3, 5], 'diagnostics')
    expect(enabled.length).toBe(11)
  })
})

describe('declared vs enumerated expansion counts', () => {
  it('fails count balance when declared row totals disagree at q=2', () => {
    const table = parseTableYaml(ut2Yaml)
    table.rows[3] = {
      ...table.rows[3]!,
      expansionCount: 'q^2-1',
    }
    const result = runCountBalanceCheckAtQ(table, 2)
    expect(result.passes).toBe(false)
    expect(result.reason).toContain('15 row choices vs 14 column choices')
    expect(result.enumerated.passes).toBe(true)
    expect(fullExpansionBlockInfo(table, [2]).blocked).toBe(true)
    const local = expandedCountBalanceCheck.runLocal!(table, [2])
    expect(local.passes).toBe(false)
  })
})
