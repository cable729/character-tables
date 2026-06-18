import { withActiveHistory } from '../types/tableProject'
import { emptyHistory } from '../types/tableEditOp'
import {
  parseYamlFile,
  projectToYaml,
  tableToYaml,
} from '../schema/yamlProject'
import {
  clearDirtyIfMatchesCheckpoint,
  withActiveProject,
} from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createYamlActions(set: SetState, get: GetState) {
  return {
    importYaml: (text: string) => {
      try {
        const { catalog, project } = get()
        const parsed = parseYamlFile(text)
        if (parsed.kind === 'project') {
          set(withActiveProject(catalog, parsed.project))
        } else {
          if (project.readonly) {
            set({ editorError: 'This project is read-only. Make a copy to edit.' })
            return
          }
          const cleared = emptyHistory()
          const nextProject = withActiveHistory(
            {
              ...clearDirtyIfMatchesCheckpoint(project, parsed.table),
              history: cleared,
              historyByContext: {
                ...project.historyByContext,
                [project.activeCheckpointId]: cleared,
              },
            },
            cleared,
          )
          set(withActiveProject(catalog, nextProject))
        }
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
      }
    },

    exportSnapshotYaml: () => tableToYaml(get().table),

    exportProjectYaml: () => projectToYaml(get().project),
  }
}
