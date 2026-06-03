import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { buildBelowLabelSplitChildren, REFERENCE_Q } from './splitBelowLabel'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from './validateSplit'
import { expansionCountLatex, inferN } from '../diagram/utils'
import { expansionCountAtQ } from '../expansion/expansionCount'

describe('buildBelowLabelSplitChildren', () => {
  it('splits UT4 column with below a,b on label b', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find((c) => c.arcs?.below?.a && c.arcs?.below?.b)
    expect(col).toBeDefined()
    const parent = { ...col!, id: 'col-test' }
    const n = inferN(table)

    const split = buildBelowLabelSplitChildren(parent, 'b', table)
    expect(split.children).toHaveLength(2)

    const [nonzero, zero] = split.children
    expect(nonzero.header.arcs?.above?.b).toBeDefined()
    expect(nonzero.header.arcs?.below?.b).toBeUndefined()
    expect(nonzero.header.arcs?.below?.a).toBeDefined()
    expect(zero.header.arcs?.below?.b).toBeUndefined()
    expect(zero.header.arcs?.below?.a).toBeDefined()

    expect(nonzero.header.restriction).not.toContain('b!=0')
    expect(zero.header.restriction).toBe('a!=0')

    const parentCount = countAssignmentsForHeader(parent, n, REFERENCE_Q)
    const nz = countParentBranchAssignments(
      parent,
      n,
      REFERENCE_Q,
      'b',
      'nonzero',
    )
    const z = countParentBranchAssignments(parent, n, REFERENCE_Q, 'b', 'zero')
    expect(nz + z).toBe(parentCount)
    expect(nonzero.header.expansionCount).toBe(String(nz))
    expect(zero.header.expansionCount).toBe(String(z))
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
    expect(nonzero.header.restriction).toBeUndefined()
    expect(zero.header.arcs?.above?.a).toBeDefined()
    expect(zero.header.arcs?.below?.b).toBeUndefined()
    expect(zero.header.restriction).toBeUndefined()
    expect(nonzero.header.expansionCount).toBeUndefined()
    expect(zero.header.expansionCount).toBeUndefined()
    expect(expansionCountLatex(nonzero.header)).toBe('(q-1)^{2}')
    expect(expansionCountLatex(zero.header)).toBe('(q-1)')
    expect(expansionCountAtQ(nonzero.header, 4, REFERENCE_Q)).toBe(nz)
    expect(expansionCountAtQ(zero.header, 4, REFERENCE_Q)).toBe(z)
  })
})
