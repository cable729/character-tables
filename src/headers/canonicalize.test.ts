import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { canonicalizeHeader } from './canonicalize'
import { expansionCountLatex, inferN } from '../diagram/utils'
import { buildBelowLabelSplitChildren } from '../transforms/splitBelowLabel'
import { countAssignmentsForHeader } from '../transforms/validateSplit'

describe('canonicalizeHeader', () => {
  it('promotes below a with a!=0 to above a', () => {
    const spec = {
      arcs: { below: { a: [1, 3] as [number, number] } },
      restriction: 'a!=0',
    }
    const out = canonicalizeHeader(spec, 4)
    expect(out.arcs?.above?.a).toBeDefined()
    expect(out.arcs?.below?.a).toBeUndefined()
    expect(out.restriction).toBeUndefined()
    expect(expansionCountLatex(out)).toBe('(q-1)')
  })

  it('keeps below a and over b when splitting on b (no summand strip)', () => {
    const spec = {
      arcs: {
        below: { a: [1, 3] as [number, number] },
        above: { b: [2, 4] as [number, number] },
      },
    }
    const out = canonicalizeHeader(spec, 4)
    expect(out.arcs?.below?.a).toBeDefined()
    expect(out.arcs?.above?.b).toBeDefined()
    expect(expansionCountLatex(out)).toBe('(q-1)q')
    expect(countAssignmentsForHeader(out, 4, 5)).toBe(20)
  })
})

describe('sequential split on UT4 restricted column', () => {
  it('step 1 on b then step 2 on a', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find(
      (c) => c.arcs?.below?.a && c.arcs?.below?.b && c.restriction,
    )
    expect(col).toBeDefined()
    const n = inferN(table)
    const step1 = buildBelowLabelSplitChildren(
      { ...col!, id: 'col-test' },
      'b',
      table,
    )
    const [mixed, overA] = step1.children.map((c) => c.header)
    expect(expansionCountLatex(mixed)).toBe('(q-1)q')
    expect(expansionCountLatex(overA)).toBe('(q-1)')

    const step2 = buildBelowLabelSplitChildren(mixed, 'a', table)
    const [bothOver, overB] = step2.children.map((c) => c.header)
    expect(expansionCountLatex(bothOver)).toBe('(q-1)^{2}')
    expect(expansionCountLatex(overB)).toBe('(q-1)')

    const parentCount = countAssignmentsForHeader(
      { ...col! },
      n,
      5,
    )
    expect(
      countAssignmentsForHeader(bothOver, n, 5) +
        countAssignmentsForHeader(overB, n, 5) +
        countAssignmentsForHeader(overA, n, 5),
    ).toBe(parentCount)
  })
})
