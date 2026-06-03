import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import { applyOp, invertOp } from './applyOp'
import { splitHeaderInTable } from '../transforms/splitHeader'
import { buildBelowLabelSplitChildren } from '../transforms/splitBelowLabel'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('applyOp', () => {
  it('setCell updates matrix entry', () => {
    const table = parseTableYaml(ut4Yaml)
    const before = table.matrix[0]?.[0] ?? '0'
    const op = {
      op: 'setCell' as const,
      row: 0,
      col: 0,
      before,
      after: '42',
    }
    const next = applyOp(table, op)
    expect(next.matrix[0]?.[0]).toBe('42')
    const undone = applyOp(next, invertOp(op))
    expect(undone.matrix[0]?.[0]).toBe(before)
  })

  it('insertRow and removeRow invert each other', () => {
    const table = parseTableYaml(ut4Yaml)
    const op = {
      op: 'insertRow' as const,
      index: 1,
      header: {},
      cells: table.columns.map(() => '0'),
    }
    const next = applyOp(table, op)
    expect(next.rows).toHaveLength(table.rows.length + 1)
    const undone = applyOp(next, invertOp(op))
    expect(undone.rows).toHaveLength(table.rows.length)
  })

  it('insertColumn and removeColumn invert each other', () => {
    const table = parseTableYaml(ut4Yaml)
    const op = {
      op: 'insertColumn' as const,
      index: 1,
      header: { classSize: '1' },
      cells: table.rows.map(() => '0'),
    }
    const next = applyOp(table, op)
    expect(next.columns).toHaveLength(table.columns.length + 1)
    const undone = applyOp(next, invertOp(op))
    expect(undone.columns).toHaveLength(table.columns.length)
  })

  it('splitHeader op round-trips via invert', () => {
    const table = parseTableYaml(ut4Yaml)
    const col = table.columns.find((c) => c.id === 'col-4')
    if (!col?.id) {
      throw new Error('col-4 not found in fixture')
    }
    const split = buildBelowLabelSplitChildren(col, 'b', table)
    const after = splitHeaderInTable(table, 'columns', col.id, split.children)
    const op = {
      op: 'splitHeader' as const,
      transformStep: {
        op: 'splitHeader' as const,
        axis: 'columns' as const,
        sourceId: col.id,
        belowLabel: 'b',
        children: split.children,
        at: 'working',
      },
      before: structuredClone(table),
      after,
      lineageBefore: {},
      lineageAfter: { [col.id]: { childIds: split.children.map((c) => c.id) } },
    }
    const forward = applyOp(table, op)
    expect(forward.columns.length).toBe(table.columns.length + 1)
    const inverted = invertOp(op)
    const back = applyOp(forward, inverted)
    expect(back.columns.length).toBe(table.columns.length)
  })
})
