import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import {
  canSupercharacterCombineColumns,
  previewSupercharacterRowCombine,
} from './supercharacterCombine'
import ut3FullYaml from '../examples/ut3-supercharacter-full.yaml?raw'

describe('previewSupercharacterRowCombine', () => {
  it('allows combining rows 1–3 on UT3 5×5 with column warning none', () => {
    const table = parseTableYaml(ut3FullYaml)
    const preview = previewSupercharacterRowCombine(table, [1, 2, 3])
    expect(preview.sumFailed).toBe(false)
    expect(preview.canCombine).toBe(true)
    expect(preview.summedRow?.[0]).toBe('q^{2} - 1')
    expect(preview.summedRow?.[1]).toBe('-1')
    expect(preview.identicalColumnGroups).toContainEqual({
      start: 1,
      length: 3,
    })
  })

  it('rejects non-adjacent rows', () => {
    const table = parseTableYaml(ut3FullYaml)
    const preview = previewSupercharacterRowCombine(table, [1, 3])
    expect(preview.canCombine).toBe(false)
  })
})

describe('canSupercharacterCombineColumns', () => {
  it('detects identical columns after row merge preview', () => {
    const table = parseTableYaml(ut3FullYaml)
    const preview = previewSupercharacterRowCombine(table, [1, 2, 3])
    expect(preview.previewMatrix).not.toBeNull()
    const after = {
      ...table,
      rows: [
        table.rows[0]!,
        { id: 'merged' },
        table.rows[4]!,
      ],
      matrix: preview.previewMatrix!,
    }
    expect(canSupercharacterCombineColumns(after, [1, 2, 3])).toBe(true)
  })
})
