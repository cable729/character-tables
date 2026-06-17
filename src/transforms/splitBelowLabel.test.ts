import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { buildBelowLabelSplitChildren, REFERENCE_Q } from './splitBelowLabel'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from './validateSplit'
import { inferN } from '../diagram/utils'
import { expansionCountAtQ, expansionCountLatex } from '../expansion/expansionCountDisplay'

describe('buildBelowLabelSplitChildren', () => {
  it('step 1: split UT4 restricted column on b', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find(
      (c) => c.arcs?.below?.a && c.arcs?.below?.b && c.restriction,
    )
    expect(col).toBeDefined()
    const parent = { ...col!, id: 'col-test' }
    const n = inferN(table)

    const split = buildBelowLabelSplitChildren(parent, 'b', table)
    const [nonzero, zero] = split.children

    expect(nonzero.header.arcs?.below?.a).toBeDefined()
    expect(nonzero.header.arcs?.above?.b).toBeDefined()
    expect(nonzero.header.arcs?.below?.b).toBeUndefined()
    expect(nonzero.header.restriction).toBeUndefined()
    expect(expansionCountLatex(nonzero.header)).toBe('(q-1)q')

    expect(zero.header.arcs?.above?.a).toBeDefined()
    expect(zero.header.arcs?.below).toBeUndefined()
    expect(zero.header.restriction).toBeUndefined()
    expect(expansionCountLatex(zero.header)).toBe('(q-1)')

    const nz = countParentBranchAssignments(
      parent,
      n,
      REFERENCE_Q,
      'b',
      'nonzero',
    )
    const z = countParentBranchAssignments(parent, n, REFERENCE_Q, 'b', 'zero')
    expect(expansionCountAtQ(nonzero.header, n, REFERENCE_Q)).toBe(nz)
    expect(expansionCountAtQ(zero.header, n, REFERENCE_Q)).toBe(z)
    expect(nz + z).toBe(countAssignmentsForHeader(parent, n, REFERENCE_Q))
  })

  it('step 2: split mixed under a + over b column on a', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find(
      (c) => c.arcs?.below?.a && c.arcs?.below?.b && c.restriction,
    )
    expect(col).toBeDefined()
    const n = inferN(table)
    const step1 = buildBelowLabelSplitChildren({ ...col!, id: 'p' }, 'b', table)
    const mixed = step1.children[0]!.header

    const split = buildBelowLabelSplitChildren(mixed, 'a', table)
    const [nonzero, zero] = split.children

    expect(nonzero.header.arcs?.above?.a).toBeDefined()
    expect(nonzero.header.arcs?.above?.b).toBeDefined()
    expect(nonzero.header.arcs?.below).toBeUndefined()
    expect(expansionCountLatex(nonzero.header)).toBe('(q-1)^{2}')

    expect(zero.header.arcs?.above?.b).toBeDefined()
    expect(zero.header.arcs?.below).toBeUndefined()
    expect(expansionCountLatex(zero.header)).toBe('(q-1)')

    const nz = countParentBranchAssignments(mixed, n, REFERENCE_Q, 'a', 'nonzero')
    const z = countParentBranchAssignments(mixed, n, REFERENCE_Q, 'a', 'zero')
    expect(expansionCountAtQ(nonzero.header, n, REFERENCE_Q)).toBe(nz)
    expect(expansionCountAtQ(zero.header, n, REFERENCE_Q)).toBe(z)
  })

  it('promotes split label to above on mixed above/below header', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find(
      (c) => c.arcs?.above?.a && c.arcs?.below?.b && !c.arcs?.below?.a,
    )
    expect(col).toBeDefined()
    const parent = { ...col!, id: 'col-mixed' }
    const n = inferN(table)
    const split = buildBelowLabelSplitChildren(parent, 'b', table)
    const [nonzero, zero] = split.children
    const nz = countParentBranchAssignments(
      parent,
      n,
      REFERENCE_Q,
      'b',
      'nonzero',
    )
    const z = countParentBranchAssignments(parent, n, REFERENCE_Q, 'b', 'zero')
    expect(nonzero.header.arcs?.above?.a).toBeDefined()
    expect(nonzero.header.arcs?.above?.b).toBeDefined()
    expect(nonzero.header.arcs?.below).toBeUndefined()
    expect(zero.header.arcs?.above?.a).toBeDefined()
    expect(expansionCountLatex(nonzero.header)).toBe('(q-1)^{2}')
    expect(expansionCountLatex(zero.header)).toBe('(q-1)')
    expect(expansionCountAtQ(nonzero.header, n, REFERENCE_Q)).toBe(nz)
    expect(expansionCountAtQ(zero.header, n, REFERENCE_Q)).toBe(z)
  })
})
