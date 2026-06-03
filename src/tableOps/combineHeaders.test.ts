import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import { combineHeadersInTable } from './combineHeaders'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('combineHeadersInTable', () => {
  it('combines adjacent identical rows', () => {
    const table = parseTableYaml(ut4Yaml)
    const row0 = table.rows[0]
    const row1 = table.rows[1]
    if (!row0?.id || !row1?.id) {
      throw new Error('fixture rows missing ids')
    }
    table.rows[1] = structuredClone(row0)
    table.rows[1]!.id = row1.id
    table.matrix[1] = [...(table.matrix[0] ?? [])]

    const { table: combined } = combineHeadersInTable(
      table,
      'rows',
      [row0.id, row1.id],
      'row-combined',
      'identical',
    )
    expect(combined.rows).toHaveLength(table.rows.length - 1)
    expect(combined.rows.some((r) => r.id === 'row-combined')).toBe(true)
  })

  it('rejects non-adjacent headers', () => {
    const table = parseTableYaml(ut4Yaml)
    const ids = table.rows.map((r) => r.id).filter(Boolean) as string[]
    if (ids.length < 3) {
      throw new Error('need 3 rows')
    }
    expect(() =>
      combineHeadersInTable(table, 'rows', [ids[0]!, ids[2]!], 'x', 'identical'),
    ).toThrow(/adjacent/)
  })
})
