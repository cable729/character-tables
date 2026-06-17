import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { proposeBelowLabelSplit } from './proposeSplit'
import { expansionCountLatex } from '../expansion/expansionCountDisplay'

describe('proposeBelowLabelSplit', () => {
  it('proposes step-1 split on b for UT4 below a,b with neg(a=b=0)', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find(
      (c) => c.arcs?.below?.a && c.arcs?.below?.b && c.restriction,
    )
    expect(col).toBeDefined()
    const proposal = proposeBelowLabelSplit({ ...col!, id: 'col-4' }, table)
    expect(proposal).not.toBeNull()
    expect(proposal!.belowLabel).toBe('b')
    const [nz, z] = proposal!.preview.children
    expect(nz.header.arcs?.below?.a).toBeDefined()
    expect(nz.header.arcs?.above?.b).toBeDefined()
    expect(expansionCountLatex(nz.header)).toBe('(q-1)q')
    expect(expansionCountLatex(z.header)).toBe('(q-1)')
  })
})
