import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import blankYaml from '../examples/blank-ut-template.yaml?raw'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('parseTableYaml', () => {
  it('parses blank template with numeric matrix cells', () => {
    const table = parseTableYaml(blankYaml)
    expect(table.matrix[0][0]).toBe('1')
    expect(table.matrix[1][0]).toBe('q')
    expect(table.matrix[1][1]).toBe('0')
  })

  it('parses full UT4 example', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(table.group).toContain('UT_4')
    expect(table.matrix).toHaveLength(6)
    expect(table.columns).toHaveLength(8)
    expect(table.columns[0]?.classSize).toBe('1')
    expect(table.columns[1]?.classSize).toBe('q^{3}')
    expect(table.matrix[1][1]).toContain('\\theta')
  })
})
