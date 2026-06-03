import type { CharacterTable } from '../types/characterTable'
import { ensureHeaderIds } from '../diagram/headerIds'
import { validateExpansionCounts } from '../schema/expansionCountValidation'
import { validateMatrixDimensions } from '../diagram/utils'
import type { TableEditOp } from '../types/tableEditOp'

function validateTable(table: CharacterTable): CharacterTable {
  validateMatrixDimensions(table)
  validateExpansionCounts(table)
  return table
}

export function applyOp(
  table: CharacterTable,
  op: TableEditOp,
): CharacterTable {
  switch (op.op) {
    case 'setCell': {
      const next = structuredClone(table)
      const row = next.matrix[op.row]
      if (!row) {
        throw new Error(`row ${op.row} not found`)
      }
      row[op.col] = op.after
      return validateTable(next)
    }
    case 'insertRow': {
      const next = structuredClone(table)
      next.rows.splice(op.index, 0, structuredClone(op.header))
      next.matrix.splice(op.index, 0, [...op.cells])
      return validateTable(ensureHeaderIds(next))
    }
    case 'removeRow': {
      const next = structuredClone(table)
      next.rows.splice(op.index, 1)
      next.matrix.splice(op.index, 1)
      return validateTable(ensureHeaderIds(next))
    }
    case 'insertColumn': {
      const next = structuredClone(table)
      next.columns.splice(op.index, 0, structuredClone(op.header))
      next.matrix = next.matrix.map((row, i) => {
        const cell = op.cells[i] ?? '0'
        return [...row.slice(0, op.index), cell, ...row.slice(op.index)]
      })
      return validateTable(ensureHeaderIds(next))
    }
    case 'removeColumn': {
      const next = structuredClone(table)
      next.columns.splice(op.index, 1)
      next.matrix = next.matrix.map((row) => [
        ...row.slice(0, op.index),
        ...row.slice(op.index + 1),
      ])
      return validateTable(ensureHeaderIds(next))
    }
    case 'splitHeader':
    case 'combineHeaders':
      return validateTable(structuredClone(op.after))
    default: {
      const _exhaustive: never = op
      throw new Error(`unknown op ${(_exhaustive as TableEditOp).op}`)
    }
  }
}

export function invertOp(op: TableEditOp): TableEditOp {
  switch (op.op) {
    case 'setCell':
      return { ...op, before: op.after, after: op.before }
    case 'insertRow':
      return {
        op: 'removeRow',
        index: op.index,
        header: op.header,
        cells: op.cells,
      }
    case 'removeRow':
      return {
        op: 'insertRow',
        index: op.index,
        header: op.header,
        cells: op.cells,
      }
    case 'insertColumn':
      return {
        op: 'removeColumn',
        index: op.index,
        header: op.header,
        cells: op.cells,
      }
    case 'removeColumn':
      return {
        op: 'insertColumn',
        index: op.index,
        header: op.header,
        cells: op.cells,
      }
    case 'splitHeader':
      return {
        ...op,
        before: op.after,
        after: op.before,
        lineageBefore: op.lineageAfter,
        lineageAfter: op.lineageBefore,
      }
    case 'combineHeaders':
      return {
        ...op,
        before: op.after,
        after: op.before,
        lineageBefore: op.lineageAfter,
        lineageAfter: op.lineageBefore,
      }
    default: {
      const _exhaustive: never = op
      throw new Error(`unknown op ${(_exhaustive as TableEditOp).op}`)
    }
  }
}

export function defaultBlankRow(table: CharacterTable): {
  header: CharacterTable['rows'][number]
  cells: string[]
} {
  return {
    header: {},
    cells: table.columns.map(() => '0'),
  }
}

export function defaultBlankColumn(table: CharacterTable): {
  header: CharacterTable['columns'][number]
  cells: string[]
} {
  return {
    header: { classSize: '1' },
    cells: table.rows.map(() => '0'),
  }
}
