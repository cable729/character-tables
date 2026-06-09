import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import {
  applyGroupSpecToTable,
  dotCount,
  formatGroupLatex,
  formatGroupOrder,
  inferGroupSpec,
} from './groupSpec'

describe('groupSpec', () => {
  it('computes dot counts', () => {
    expect(dotCount({ kind: 'ut_n', n: 5 })).toBe(5)
    expect(dotCount({ kind: 'ut_n_k', n: 3, k: 2 })).toBe(9)
  })

  it('formats group LaTeX', () => {
    expect(formatGroupLatex({ kind: 'ut_n', n: 5 })).toBe('UT_5(\\mathbb{F}_q)')
    expect(formatGroupLatex({ kind: 'ut_n_k', n: 3, k: 2 })).toBe(
      'UT_3^{(2)}(\\mathbb{F}_q)',
    )
  })

  it('formats group order for UT_n only', () => {
    expect(formatGroupOrder({ kind: 'ut_n', n: 5 })).toBe('q^{10}')
    expect(formatGroupOrder({ kind: 'ut_n', n: 2 })).toBe('q')
    expect(formatGroupOrder({ kind: 'ut_n_k', n: 3, k: 2 })).toBeUndefined()
  })

  it('applyGroupSpecToTable sets n, group, and groupOrder', () => {
    const table = parseTableYaml(ut4Yaml)
    const next = applyGroupSpecToTable(table, { kind: 'ut_n', n: 5 })
    expect(next.n).toBe(5)
    expect(next.group).toBe('UT_5(\\mathbb{F}_q)')
    expect(next.groupOrder).toBe('q^{10}')
    expect(next.groupSpec).toEqual({ kind: 'ut_n', n: 5 })
  })

  it('applyGroupSpecToTable sets UT_n^(k) dot count', () => {
    const table = parseTableYaml(ut4Yaml)
    const next = applyGroupSpecToTable(table, { kind: 'ut_n_k', n: 3, k: 2 })
    expect(next.n).toBe(9)
    expect(next.group).toBe('UT_3^{(2)}(\\mathbb{F}_q)')
    expect(next.groupSpec).toEqual({ kind: 'ut_n_k', n: 3, k: 2 })
  })

  it('clamps arcs when dot count shrinks', () => {
    const table = parseTableYaml(ut4Yaml)
    const next = applyGroupSpecToTable(table, { kind: 'ut_n', n: 3 })
    const scanDots = (headers: typeof next.columns) => {
      const dots: number[] = []
      for (const header of headers) {
        for (const dict of [header.arcs?.above, header.arcs?.below]) {
          if (!dict) continue
          for (const pairs of Object.values(dict)) {
            const list = Array.isArray(pairs[0]) ? pairs : [pairs]
            for (const [from, to] of list as [number, number][]) {
              dots.push(from, to)
            }
          }
        }
      }
      return dots
    }
    const allDots = [...scanDots(next.columns), ...scanDots(next.rows)]
    expect(allDots.every((d) => d <= 3)).toBe(true)
    expect(allDots.some((d) => d === 4)).toBe(false)
  })

  it('infers groupSpec from table when present', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(inferGroupSpec(table)).toEqual({ kind: 'ut_n', n: 4 })
  })
})
