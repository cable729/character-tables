import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import type { CharacterTable } from '../types/characterTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { fullExpansionBlockInfo } from './expansionReadiness'
import { trivialOrthogonalityCheck } from './trivialOrthogonalityCheck'
import { runTrivialOrthogonalityAtQ } from './trivialOrthogonalityCheck'
import { runTrivialRowColumnCheck } from './structuralChecks'
import { runExpandedCountBalanceAtQ } from './structuralChecks'
import { thetaSumCheck } from './thetaSumCheck'

const miniTable: CharacterTable = {
  group: 'Mini',
  groupOrder: 'q',
  n: 2,
  columns: [
    { classSize: '1' },
    {
      classSize: '1',
      arcs: { above: { a: [1, 2] } },
    },
  ],
  rows: [
    {},
    {
      arcs: { above: { alpha: [1, 2] } },
    },
  ],
  matrix: [
    ['1', '1'],
    ['1', '\\theta(\\alpha a)'],
  ],
}

describe('structural checks', () => {
  it('passes trivial row/column on mini table', () => {
    expect(runTrivialRowColumnCheck(miniTable).passes).toBe(true)
  })

  it('expanded counts match for mini table at q=3', () => {
    const r = runExpandedCountBalanceAtQ(miniTable, 3)
    expect(r.passes).toBe(true)
    expect(r.rowTotal).toBe(r.colTotal)
  })
})

describe('trivial orthogonality', () => {
  it('trivial row sum equals |G| at q=3 on mini table', () => {
    const r = runTrivialOrthogonalityAtQ(miniTable, 3)
    expect(r.rows[0].ok).toBe(true)
    expect(r.rows[0].sumRe).toBe(3)
  })
})

describe('theta sum check', () => {
  it('passes at default q values', () => {
    const r = thetaSumCheck.runLocal(miniTable, [2, 3, 5])
    expect(r.passes).toBe(true)
  })
})

describe('expansion readiness', () => {
  it('allows full expansion checks for UT4 at q=5', () => {
    const table = parseTableYaml(ut4Yaml)
    const block = fullExpansionBlockInfo(table, [5])
    expect(block.blocked).toBe(false)
  })

  it('does not block trivial orthogonality when fully expanded', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(trivialOrthogonalityCheck.isBlocked(table, [5]).blocked).toBe(false)
  })
})
