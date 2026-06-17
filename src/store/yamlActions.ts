import { saveActiveUiInCatalog } from '../types/projectCatalog'
import {
  withActiveHistory,
  WORKING_HISTORY_KEY,
} from '../types/tableProject'
import { emptyHistory } from '../types/tableEditOp'
import {
  parseYamlFile,
  projectToYaml,
  tableToYaml,
} from '../schema/yamlProject'
import { syncEditorFromProject, withActiveProject } from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createYamlActions(set: SetState, get: GetState) {
  return {
    setEditorText: (editorText: string) =>
      set({
        editorText,
        editorError: null,
        catalog: saveActiveUiInCatalog(get().catalog, { editorText }),
      }),

    applyEditor: () => {
      try {
        const { catalog, project } = get()
        const parsed = parseYamlFile(get().editorText)
        if (parsed.kind === 'project') {
          const next = withActiveProject(catalog, parsed.project, {
            editorText: syncEditorFromProject(parsed.project),
          })
          set(next)
        } else {
          const cleared = emptyHistory()
          const nextProject = withActiveHistory(
            {
              ...project,
              workingTable: parsed.table,
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
              editorText: tableToYaml(parsed.table),
            }),
          )
        }
        return true
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
        return false
      }
    },

    importYaml: (text: string) => {
      try {
        const { catalog, project } = get()
        const parsed = parseYamlFile(text)
        if (parsed.kind === 'project') {
          set(
            withActiveProject(catalog, parsed.project, {
              editorText: syncEditorFromProject(parsed.project),
            }),
          )
        } else {
          const cleared = emptyHistory()
          const nextProject = withActiveHistory(
            {
              ...project,
              workingTable: parsed.table,
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
              editorText: tableToYaml(parsed.table),
            }),
          )
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
