import { createCheckpoint } from '../types/checkpoint'
import {
  getActiveCheckpoint,
  isProjectDirty,
  swapHistoryContext,
  withActiveHistory,
  type TableProject,
} from '../types/tableProject'
import { emptyHistory } from '../types/tableEditOp'
import { withActiveProject } from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createCheckpointActions(set: SetState, get: GetState) {
  const saveCheckpointAs = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      set({ editorError: 'checkpoint name cannot be empty' })
      return
    }
    const { catalog, project, table } = get()
    if (project.readonly) {
      set({ editorError: 'This project is read-only. Make a copy to edit.' })
      return
    }
    const cp = createCheckpoint(trimmed, table, {
      parentId: project.activeCheckpointId,
    })
    const cleared = emptyHistory()
    const nextProject = withActiveHistory(
      {
        ...project,
        activeCheckpointId: cp.id,
        dirtyTable: null,
        checkpoints: { ...project.checkpoints, [cp.id]: cp },
        checkpointOrder: [...project.checkpointOrder, cp.id],
        history: cleared,
        historyByContext: {
          ...project.historyByContext,
          [cp.id]: cleared,
        },
      },
      cleared,
    )
    set(withActiveProject(catalog, nextProject))
  }

  return {
    saveActiveCheckpoint: () => {
      const { catalog, project, table } = get()
      if (project.readonly) {
        set({ editorError: 'This project is read-only. Make a copy to edit.' })
        return
      }
      if (!isProjectDirty(project)) {
        return
      }
      const activeCp = getActiveCheckpoint(project)
      const updatedCp = {
        ...activeCp,
        table: structuredClone(table),
      }
      const cleared = emptyHistory()
      const nextProject = withActiveHistory(
        {
          ...project,
          dirtyTable: null,
          checkpoints: {
            ...project.checkpoints,
            [activeCp.id]: updatedCp,
          },
          history: cleared,
          historyByContext: {
            ...project.historyByContext,
            [activeCp.id]: cleared,
          },
        },
        cleared,
      )
      set(withActiveProject(catalog, nextProject))
    },

    saveCheckpointAs,

    /** @deprecated Use saveCheckpointAs */
    saveCheckpoint: saveCheckpointAs,

    loadCheckpoint: (id: string, options?: { discardDirty?: boolean }) => {
      const { catalog, project } = get()
      if (id === project.activeCheckpointId) {
        if (isProjectDirty(project) && options?.discardDirty) {
          const cleared = emptyHistory()
          const nextProject = withActiveHistory(
            {
              ...project,
              dirtyTable: null,
              history: cleared,
              historyByContext: {
                ...project.historyByContext,
                [id]: cleared,
              },
            },
            cleared,
          )
          set(withActiveProject(catalog, nextProject))
        }
        return true
      }
      if (isProjectDirty(project) && !options?.discardDirty) {
        return false
      }
      const cp = project.checkpoints[id]
      if (!cp) {
        set({ editorError: `checkpoint "${id}" not found` })
        return false
      }
      const nextProject = swapHistoryContext(project, id)
      set(withActiveProject(catalog, nextProject))
      return true
    },

    deleteCheckpoint: (id: string) => {
      const { catalog, project } = get()
      if (project.readonly) {
        set({ editorError: 'This project is read-only.' })
        return
      }
      if (project.checkpointOrder.length <= 1) {
        set({ editorError: 'cannot delete the only checkpoint' })
        return
      }
      if (!project.checkpoints[id]) {
        set({ editorError: `checkpoint "${id}" not found` })
        return
      }
      const { [id]: _removed, ...checkpoints } = project.checkpoints
      const checkpointOrder = project.checkpointOrder.filter((cpId) => cpId !== id)
      let nextProject: TableProject = {
        ...project,
        checkpoints,
        checkpointOrder,
      }
      if (project.activeCheckpointId === id) {
        const fallbackId = checkpointOrder[checkpointOrder.length - 1]!
        nextProject = swapHistoryContext(nextProject, fallbackId)
      }
      set(withActiveProject(catalog, nextProject))
    },

    renameCheckpoint: (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) {
        set({ editorError: 'checkpoint name cannot be empty' })
        return
      }
      const { catalog, project } = get()
      if (project.readonly) {
        set({ editorError: 'This project is read-only.' })
        return
      }
      const cp = project.checkpoints[id]
      if (!cp) {
        set({ editorError: `checkpoint "${id}" not found` })
        return
      }
      const nextProject: TableProject = {
        ...project,
        checkpoints: {
          ...project.checkpoints,
          [id]: { ...cp, name: trimmed },
        },
      }
      set(withActiveProject(catalog, nextProject))
    },
  }
}
