import { createCheckpoint } from '../types/checkpoint'
import { swapHistoryContext, type TableProject } from '../types/tableProject'
import { tableToYaml } from '../schema/yamlProject'
import { withActiveProject } from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createCheckpointActions(set: SetState, get: GetState) {
  return {
    saveCheckpoint: (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) {
        set({ editorError: 'checkpoint name cannot be empty' })
        return
      }
      const { catalog, project, table } = get()
      const cp = createCheckpoint(trimmed, table, {
        parentId: project.activeCheckpointId,
      })
      const nextProject: TableProject = {
        ...project,
        activeCheckpointId: cp.id,
        checkpoints: { ...project.checkpoints, [cp.id]: cp },
        checkpointOrder: [...project.checkpointOrder, cp.id],
      }
      set(withActiveProject(catalog, nextProject))
    },

    loadCheckpoint: (id: string | null) => {
      const { catalog, project } = get()
      if (!id) {
        const nextProject = swapHistoryContext(project, null)
        set(
          withActiveProject(catalog, nextProject, {
            editorText: tableToYaml(nextProject.workingTable),
          }),
        )
        return
      }
      const cp = project.checkpoints[id]
      if (!cp) {
        set({ editorError: `checkpoint "${id}" not found` })
        return
      }
      const nextProject = swapHistoryContext(project, id)
      set(
        withActiveProject(catalog, nextProject, {
          editorText: tableToYaml(cp.table),
        }),
      )
    },
  }
}
