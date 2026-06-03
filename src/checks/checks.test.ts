import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import type { CharacterTable } from '../types/characterTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { buildCombinedSageCode } from './registry'
import { fullExpansionBlockInfo } from './expansionReadiness'
import { trivialOrthogonalityCheck } from './trivialOrthogonalityCheck'
import { runTrivialRowColumnCheck } from './structuralChecks'
import { runExpandedCountBalanceAtQ } from './structuralChecks'
import { parseSageCheckResults } from './parseSageOutput'

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

describe('combined Sage codegen', () => {
  it('includes preamble and check runners for mini table', () => {
    const code = buildCombinedSageCode(miniTable, {
      selectedQ: [3],
      scope: 'all',
    })
    expect(code).toContain('def sage_emit')
    expect(code).toContain('from sage.all import GF, CyclotomicField')
    expect(code).toContain('_CyclotomicAdditiveCharacter')
    expect(code).toContain('TABLE = json.loads')
    expect(code).toContain('run_theta_sum_check')
    expect(code).toContain('CHECK id=')
    expect(code).toContain('all_ok=')
  })

  it('parses CHECK lines from stdout', () => {
    const stdout = [
      'CHECK id=theta-sum q=3 ok=True',
      'CHECK id=conjugacy q=3 ok=False details_json={"sumAtQ":2}',
      'all_ok=False',
    ].join('\n')
    const parsed = parseSageCheckResults(stdout)
    expect(parsed.get('theta-sum')?.passes).toBe(true)
    expect(parsed.get('conjugacy')?.passes).toBe(false)
    expect(parsed.get('conjugacy')?.perQ?.[0].q).toBe(3)
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
