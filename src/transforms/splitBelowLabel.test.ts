import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { buildBelowLabelSplitChildren, REFERENCE_Q } from './splitBelowLabel'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from './validateSplit'
import { inferN } from '../diagram/utils'

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
    expect(nonzero.header.arcs?.below?.b).toBeDefined()
    expect(zero.header.arcs?.below?.b).toBeUndefined()
    expect(zero.header.arcs?.below?.a).toBeDefined()

    expect(nonzero.header.restriction).toContain('b!=0')
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
    expect(Number(nonzero.header.expansionCount)).toBe(nz)
    expect(Number(zero.header.expansionCount)).toBe(z)
  })
})
