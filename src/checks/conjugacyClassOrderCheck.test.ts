import { describe, expect, it } from 'vitest'
import {
  conjugacyCheckAtQ,
  conjugacyCheckSymbolic,
} from './conjugacyClassOrderCheck'
import { parseSageCheckAllOk, parseSageCheckResults } from './parseSageOutput'
import { buildCombinedSageCode } from './registry'
import { buildSageCheckCode } from '../sage/checkBuilders'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('conjugacyClassOrderCheck', () => {
  const table = parseTableYaml(ut4Yaml)

  it('satisfies sum_j n_j |C_j| = |G| at q in {2,3,5}', () => {
    for (const q of [2, 3, 5] as const) {
      const result = conjugacyCheckAtQ(table, q)
      expect(result.passes).toBe(true)
      expect(result.sumAtQ).toBe(result.groupOrderAtQ)
      expect(result.groupOrderAtQ).toBe(q ** 6)
    }
  })

  it('matches per-column weighted contributions at q=5', () => {
    const result = conjugacyCheckAtQ(table, 5)
    expect(result.columns.map((c) => c.nAtQ)).toEqual([1, 96, 20, 20, 24, 4, 20, 80])
    expect(result.columns.map((c) => c.sizeAtQ)).toEqual([
      1, 125, 25, 25, 5, 1, 25, 25,
    ])
    expect(result.columns.map((c) => c.weightedAtQ)).toEqual([
      1, 12000, 500, 500, 120, 4, 500, 2000,
    ])
    expect(result.sumAtQ).toBe(15625)
  })

  it('builds symbolic LaTeX breakdown without fixing q', () => {
    const result = conjugacyCheckSymbolic(table)
    expect(result.groupOrder).toBe('q^{6}')
    expect(result.columns[0]).toEqual({
      index: 0,
      nSymbolic: '1',
      classSize: '1',
      weightedSymbolic: '1',
    })
    expect(result.columns[1].weightedSymbolic).toBe(
      '(q^2-1)(q-1) \\cdot q^{3}',
    )
    expect(result.columns[2].weightedSymbolic).toBe('(q-1)q \\cdot q^{2}')
  })

  it('generates Sage code that computes conjugacy in Sage from TABLE', () => {
    const code = buildSageCheckCode('conjugacy', table, [5])
    expect(code).toContain('run_conjugacy_check')
    expect(code).toContain('conjugacy')
    const full = buildCombinedSageCode(table, {
      selectedQ: [5],
      scope: 'verifier',
    })
    expect(full).toContain('run_conjugacy_check')
    expect(full).not.toContain('n_j = [[1,96')
  })

  it('throws when groupOrder is missing', () => {
    const { groupOrder: _, ...rest } = table
    expect(() => conjugacyCheckAtQ(rest, 5)).toThrow('groupOrder')
  })

  it('parses all_ok and CHECK lines from Sage stdout', () => {
    expect(parseSageCheckAllOk('q=5: ok=True\nall_ok=True')).toBe(true)
    expect(parseSageCheckAllOk('q=5: ok=False\nall_ok=False')).toBe(false)
    expect(parseSageCheckAllOk('no result')).toBe(null)
    const parsed = parseSageCheckResults('CHECK id=conjugacy q=5 ok=True\nall_ok=True')
    expect(parsed.get('conjugacy')?.passes).toBe(true)
  })
})
