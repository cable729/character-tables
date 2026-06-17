import type { GroupSpec, HeaderSpec } from '../types/characterTable'
import {
  applyGroupSpecToTable,
  snapshotGroupFields,
} from '../groups/groupSpec'
import {
  defaultBlankColumn,
  defaultBlankRow,
} from '../tableOps/applyOp'
import {
  applyTransformToTable,
  buildCombineHeadersStep,
  buildSplitHeaderStep,
} from '../transforms/applyTransform'
import type { TableEditOp } from '../types/tableEditOp'
import { mergeLineage } from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState & {
  dispatchOp: (op: TableEditOp) => void
}

export function createTableEditActions(set: SetState, get: GetState) {
  return {
    applySplitBelowLabel: (args: {
      axis: 'rows' | 'columns'
      sourceId: string
      belowLabel: string
    }) => {
      const { project, table } = get()
      try {
        const step = buildSplitHeaderStep(table, {
          axis: args.axis,
          sourceId: args.sourceId,
          belowLabel: args.belowLabel,
          at: 'working',
        })
        const before = structuredClone(table)
        const lineageBefore = structuredClone(project.lineage)
        const { table: after, lineageUpdates } = applyTransformToTable(
          table,
          step,
        )
        const lineageAfter = mergeLineage(lineageBefore, lineageUpdates)
        get().dispatchOp({
          op: 'splitHeader',
          transformStep: step,
          before,
          after,
          lineageBefore,
          lineageAfter,
        })
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
      }
    },

    applyCombineHeaders: (args: {
      axis: 'rows' | 'columns'
      sourceIds: string[]
      method: 'sum' | 'identical'
    }) => {
      const { project, table } = get()
      try {
        const resultId =
          args.axis === 'rows'
            ? `row-combined-${args.sourceIds.join('-')}`
            : `col-combined-${args.sourceIds.join('-')}`
        const step = buildCombineHeadersStep({
          axis: args.axis,
          sourceIds: args.sourceIds,
          resultId,
          method: args.method,
          at: 'working',
        })
        const before = structuredClone(table)
        const lineageBefore = structuredClone(project.lineage)
        const { table: after, lineageUpdates, needsManualDiagram } =
          applyTransformToTable(table, step)
        const lineageAfter = mergeLineage(lineageBefore, lineageUpdates)
        get().dispatchOp({
          op: 'combineHeaders',
          transformStep: step,
          before,
          after,
          lineageBefore,
          lineageAfter,
        })
        return needsManualDiagram
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
        return undefined
      }
    },

    insertRow: (index: number, position: 'above' | 'below') => {
      const { table } = get()
      const insertAt = position === 'above' ? index : index + 1
      const blank = defaultBlankRow(table)
      get().dispatchOp({
        op: 'insertRow',
        index: insertAt,
        header: blank.header,
        cells: blank.cells,
      })
    },

    removeRows: (indices: number[]) => {
      const sorted = [...new Set(indices)].sort((a, b) => b - a)
      for (const index of sorted) {
        const { table } = get()
        if (table.rows.length <= 1) {
          set({ editorError: 'cannot remove all rows' })
          return
        }
        const header = table.rows[index]
        const cells = table.matrix[index]
        if (!header || !cells) {
          continue
        }
        get().dispatchOp({
          op: 'removeRow',
          index,
          header: structuredClone(header),
          cells: [...cells],
        })
      }
    },

    insertColumn: (index: number, position: 'before' | 'after') => {
      const { table } = get()
      const insertAt = position === 'before' ? index : index + 1
      const blank = defaultBlankColumn(table)
      get().dispatchOp({
        op: 'insertColumn',
        index: insertAt,
        header: blank.header,
        cells: blank.cells,
      })
    },

    removeColumns: (indices: number[]) => {
      const sorted = [...new Set(indices)].sort((a, b) => b - a)
      for (const index of sorted) {
        const { table } = get()
        if (table.columns.length <= 1) {
          set({ editorError: 'cannot remove all columns' })
          return
        }
        const header = table.columns[index]
        if (!header) {
          continue
        }
        const cells = table.matrix.map((row) => row[index] ?? '0')
        get().dispatchOp({
          op: 'removeColumn',
          index,
          header: structuredClone(header),
          cells,
        })
      }
    },

    setRowHeader: (index: number, after: HeaderSpec) => {
      const { table } = get()
      const before = table.rows[index]
      if (!before) {
        set({ editorError: `row ${index} not found` })
        return
      }
      get().dispatchOp({
        op: 'setHeader',
        axis: 'rows',
        index,
        before: structuredClone(before),
        after: structuredClone(after),
      })
    },

    setColumnHeader: (index: number, after: HeaderSpec) => {
      const { table } = get()
      const before = table.columns[index]
      if (!before) {
        set({ editorError: `column ${index} not found` })
        return
      }
      get().dispatchOp({
        op: 'setHeader',
        axis: 'columns',
        index,
        before: structuredClone(before),
        after: structuredClone(after),
      })
    },

    setProjectGroup: (spec: GroupSpec) => {
      const { table } = get()
      const before = snapshotGroupFields(table)
      const afterTable = applyGroupSpecToTable(table, spec)
      const after = snapshotGroupFields(afterTable)
      get().dispatchOp({ op: 'setGroupSpec', before, after })
    },
  }
}
