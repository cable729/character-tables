import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { buildBelowLabelSplitChildren } from './splitBelowLabel'
import { splitHeaderInTable } from './splitHeader'
import { applyTransformToTable, buildSplitHeaderStep } from './applyTransform'

describe('splitHeaderInTable', () => {
  it('widens matrix and updates lineage on column split', () => {
    const table = parseTableYaml(ut4Yaml)
    const colIndex = table.columns.findIndex(
      (c) => c.arcs?.below?.a && c.arcs?.below?.b,
    )
    expect(colIndex).toBeGreaterThanOrEqual(0)
    const parent = table.columns[colIndex]!
    const parentId = parent.id ?? `col-${colIndex}`
    const parentWithId = { ...parent, id: parentId }
    const tableWithId = {
      ...table,
      columns: table.columns.map((c, i) =>
        i === colIndex ? parentWithId : c,
      ),
    }

    const split = buildBelowLabelSplitChildren(parentWithId, 'b', tableWithId)
    const step = buildSplitHeaderStep(tableWithId, {
      axis: 'columns',
      sourceId: parentId,
      belowLabel: 'b',
      at: 'main',
    })

    const { table: next, lineageUpdates } = applyTransformToTable(
      tableWithId,
      step,
    )

    expect(next.columns).toHaveLength(table.columns.length + 1)
    expect(next.matrix[0]).toHaveLength(table.columns.length + 1)
    expect(next.columns[colIndex]?.id).toBe(split.children[0]!.id)
    expect(next.columns[colIndex + 1]?.id).toBe(split.children[1]!.id)
    expect(lineageUpdates[parentId]?.childIds).toHaveLength(2)
  })
})

describe('splitHeaderInTable rows', () => {
  it('inserts an extra matrix row when splitting a row header', () => {
    const table = parseTableYaml(ut4Yaml)
    const rowIndex = table.rows.findIndex(
      (r) => r.arcs?.below && '\\beta' in r.arcs.below,
    )
    expect(rowIndex).toBeGreaterThanOrEqual(0)
    const parent = { ...table.rows[rowIndex]!, id: 'row-test' }
    const tableWithId = {
      ...table,
      rows: table.rows.map((r, i) => (i === rowIndex ? parent : r)),
    }
    const split = buildBelowLabelSplitChildren(parent, '\\beta', tableWithId)
    const next = splitHeaderInTable(
      tableWithId,
      'rows',
      'row-test',
      split.children,
    )
    expect(next.rows).toHaveLength(table.rows.length + 1)
    expect(next.matrix).toHaveLength(table.rows.length + 1)
  })
})
