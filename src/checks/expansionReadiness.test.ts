import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import {
  flatExpandedColCount,
  flatExpandedRowCount,
} from '../expansion/iterateExpandedPairs'
import {
  fullExpansionBlockInfo,
  runExpandedCountBalanceAtQ,
} from './expansionReadiness'
import { getChecksPartition } from './registry'

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

  it('partitions all checks as active at default q', () => {
    const { enabled, disabled } = getChecksPartition(ut4, [2, 3, 5])
    expect(disabled.length).toBe(0)
    expect(enabled.length).toBe(11)
  })
})
