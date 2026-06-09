import { describe, expect, it } from 'vitest'
import { qPolyCoeffsEqual } from '../expansion/qPolynomial'
import { parseTableYaml } from '../schema/yamlTable'
import { combineHeadersInTable } from './combineHeaders'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import ut3FullYaml from '../examples/ut3-supercharacter-full.yaml?raw'
import ut3CondensedYaml from '../examples/ut3-supercharacter.yaml?raw'

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

  it('sums UT3 rows 1–3 then merges columns 1–3 to condensed 3×3', () => {
    let table = parseTableYaml(ut3FullYaml)
    const rowIds = [1, 2, 3].map((i) => table.rows[i]?.id).filter(Boolean) as string[]
    const afterRows = combineHeadersInTable(
      table,
      'rows',
      rowIds,
      'row-merged',
      'sum',
    )
    table = afterRows.table

    const colIds = [1, 2, 3].map((i) => table.columns[i]?.id).filter(Boolean) as string[]
    const afterCols = combineHeadersInTable(
      table,
      'columns',
      colIds,
      'col-merged',
      'identical',
    )
    table = afterCols.table

    const expected = parseTableYaml(ut3CondensedYaml)
    expect(table.rows).toHaveLength(3)
    expect(table.columns).toHaveLength(3)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(
          qPolyCoeffsEqual(
            table.matrix[i]![j]!,
            expected.matrix[i]![j]!,
          ),
        ).toBe(true)
      }
    }
  })
})
