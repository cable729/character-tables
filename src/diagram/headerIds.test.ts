import { describe, expect, it } from 'vitest'
import {
  ensureHeaderIds,
  headerById,
  validateUniqueIds,
} from './headerIds'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('ensureHeaderIds', () => {
  it('assigns col-{n} and row-{n} when ids are missing', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(table.columns.every((c) => c.id?.startsWith('col-'))).toBe(true)
    expect(table.rows.every((r) => r.id?.startsWith('row-'))).toBe(true)
  })

  it('preserves existing ids', () => {
    const table = parseTableYaml(ut4Yaml)
    const withCustom = {
      ...table,
      columns: table.columns.map((c, i) =>
        i === 0 ? { ...c, id: 'my-col' } : c,
      ),
    }
    const result = ensureHeaderIds(withCustom)
    expect(result.columns[0]?.id).toBe('my-col')
    expect(result.columns[1]?.id).toBe('col-1')
  })
})

describe('validateUniqueIds', () => {
  it('throws on duplicate ids within an axis', () => {
    const table = parseTableYaml(ut4Yaml)
    const dup = {
      ...table,
      columns: table.columns.map((c) => ({ ...c, id: 'same' })),
    }
    expect(() => validateUniqueIds(dup)).toThrow(/duplicate header id/)
  })
})

describe('headerById', () => {
  it('finds header by id', () => {
    const table = parseTableYaml(ut4Yaml)
    const found = headerById(table, 'columns', table.columns[0]!.id!)
    expect(found?.index).toBe(0)
  })

  it('returns null for unknown id', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(headerById(table, 'rows', 'missing')).toBeNull()
  })
})
