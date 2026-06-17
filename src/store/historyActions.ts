import type { CharacterTable } from '../types/characterTable'
import {
  withActiveHistory,
  WORKING_HISTORY_KEY,
  type TableProject,
} from '../types/tableProject'
import { emptyHistory, type TableEditOp } from '../types/tableEditOp'
import { applyOp, invertOp } from '../tableOps/applyOp'
import { tableToYaml } from '../schema/yamlProject'
import {
  stashWorkingCopyIfChanged,
  trimHistory,
  withActiveProject,
} from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createHistoryActions(set: SetState, get: GetState) {
  return {
    setTable: (table: CharacterTable) => {
      const { catalog, project } = get()
      const cleared = emptyHistory()
      const nextProject = withActiveHistory(
        {
          ...project,
          workingTable: table,
          activeCheckpointId: null,
          history: cleared,
          historyByContext: {
            ...project.historyByContext,
            [WORKING_HISTORY_KEY]: cleared,
          },
        },
        cleared,
      )
      set(
        withActiveProject(catalog, nextProject, {
          editorText: tableToYaml(table),
        }),
      )
    },

    dispatchOp: (op: TableEditOp) => {
      const { catalog, project, table } = get()
      let editingProject: TableProject = project
      if (project.activeCheckpointId) {
        editingProject = stashWorkingCopyIfChanged(project)
        const cleared = emptyHistory()
        editingProject = {
          ...editingProject,
          workingTable: structuredClone(table),
          activeCheckpointId: null,
          history: cleared,
          historyByContext: {
            ...editingProject.historyByContext,
            [WORKING_HISTORY_KEY]: cleared,
          },
        }
      }
      const editingTable = editingProject.workingTable
      let after
      try {
        after = applyOp(editingTable, op)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        set({ editorError: message })
        throw err
      }
      const lineageAfter =
        op.op === 'splitHeader' || op.op === 'combineHeaders'
          ? structuredClone(op.lineageAfter)
          : editingProject.lineage
      const transformLog =
        op.op === 'splitHeader' || op.op === 'combineHeaders'
          ? [...editingProject.transformLog, op.transformStep]
          : editingProject.transformLog
      const nextHistory = {
        past: trimHistory([...editingProject.history.past, op]),
        future: [],
      }
      const nextProject = withActiveHistory(
        {
          ...editingProject,
          workingTable: after,
          lineage: lineageAfter,
          transformLog,
        },
        nextHistory,
      )
      set(
        withActiveProject(catalog, nextProject, {
          editorText: tableToYaml(after),
        }),
      )
    },

    undo: () => {
      const { catalog, project, table } = get()
      const { past, future } = project.history
      if (past.length === 0) {
        return
      }
      const op = past[past.length - 1]!
      const inverted = invertOp(op)
      const after = applyOp(table, inverted)
      const lineage =
        op.op === 'splitHeader' || op.op === 'combineHeaders'
          ? structuredClone(op.lineageBefore)
          : project.lineage
      const nextProject = withActiveHistory(
        {
          ...project,
          workingTable: after,
          lineage,
          transformLog:
            op.op === 'splitHeader' || op.op === 'combineHeaders'
              ? project.transformLog.slice(0, -1)
              : project.transformLog,
        },
        {
          past: past.slice(0, -1),
          future: [op, ...future],
        },
      )
      set(
        withActiveProject(catalog, nextProject, {
          editorText: tableToYaml(after),
        }),
      )
    },

    redo: () => {
      const { catalog, project, table } = get()
      const { past, future } = project.history
      if (future.length === 0) {
        return
      }
      const op = future[0]!
      const after = applyOp(table, op)
      const lineage =
        op.op === 'splitHeader' || op.op === 'combineHeaders'
          ? structuredClone(op.lineageAfter)
          : project.lineage
      const nextProject = withActiveHistory(
        {
          ...project,
          workingTable: after,
          lineage,
          transformLog:
            op.op === 'splitHeader' || op.op === 'combineHeaders'
              ? [...project.transformLog, op.transformStep]
              : project.transformLog,
        },
        {
          past: trimHistory([...past, op]),
          future: future.slice(1),
        },
      )
      set(
        withActiveProject(catalog, nextProject, {
          editorText: tableToYaml(after),
        }),
      )
    },
  }
}
