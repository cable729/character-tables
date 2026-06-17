import type { GroupSpec } from '../types/characterTable'
import {
  addProjectToCatalog,
  createProjectFromPreset,
  duplicateProject,
  getActiveProject,
  getActiveUi,
  removeProjectFromCatalog,
  renameProjectInCatalog,
  saveActiveUiInCatalog,
  setActiveProjectInCatalog,
  createProjectFromGroup as buildProjectFromGroup,
} from '../types/projectCatalog'
import { projectPresets } from '../data/projectPresets'
import { activeDerivedState } from './storeHelpers'
import type { TableStoreState } from './storeHelpers'

type SetState = (
  partial:
    | Partial<TableStoreState>
    | ((state: TableStoreState) => Partial<TableStoreState>),
) => void
type GetState = () => TableStoreState

export function createCatalogActions(set: SetState, get: GetState) {
  return {
    setShowEditor: (showEditor: boolean) =>
      set({
        showEditor,
        catalog: saveActiveUiInCatalog(get().catalog, { showEditor }),
      }),

    setCompactMath: (compactMath: boolean) =>
      set({
        compactMath,
        catalog: saveActiveUiInCatalog(get().catalog, { compactMath }),
      }),

    setActiveProject: (projectId: string) => {
      const { catalog } = get()
      try {
        const nextCatalog = setActiveProjectInCatalog(catalog, projectId)
        set({
          catalog: nextCatalog,
          ...activeDerivedState(nextCatalog),
          editorError: null,
        })
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
      }
    },

    createProjectFromPreset: (presetId: string) => {
      const preset = projectPresets.find((p) => p.id === presetId)
      if (!preset) {
        set({ editorError: `preset "${presetId}" not found` })
        return
      }
      const { project, ui } = createProjectFromPreset(preset)
      const nextCatalog = addProjectToCatalog(get().catalog, project, ui)
      set({
        catalog: nextCatalog,
        ...activeDerivedState(nextCatalog),
        editorError: null,
      })
    },

    createProjectFromGroup: (spec: GroupSpec) => {
      const { project, ui } = buildProjectFromGroup(spec)
      const nextCatalog = addProjectToCatalog(get().catalog, project, ui)
      set({
        catalog: nextCatalog,
        ...activeDerivedState(nextCatalog),
        editorError: null,
      })
    },

    duplicateActiveProject: () => {
      const { catalog, project } = get()
      const currentUi = getActiveUi(catalog)
      const { project: clone, ui } = duplicateProject(project)
      ui.editorText = currentUi.editorText
      ui.showEditor = currentUi.showEditor
      ui.compactMath = currentUi.compactMath
      const nextCatalog = addProjectToCatalog(catalog, clone, ui)
      set({
        catalog: nextCatalog,
        ...activeDerivedState(nextCatalog),
        editorError: null,
      })
    },

    deleteActiveProject: () => {
      const { catalog, project } = get()
      try {
        const nextCatalog = removeProjectFromCatalog(catalog, project.id)
        set({
          catalog: nextCatalog,
          ...activeDerivedState(nextCatalog),
          editorError: null,
        })
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
      }
    },

    renameActiveProject: (title: string) => {
      const { catalog, project } = get()
      try {
        const nextCatalog = renameProjectInCatalog(catalog, project.id, title)
        set({
          catalog: nextCatalog,
          project: getActiveProject(nextCatalog),
          editorError: null,
        })
      } catch (err) {
        set({
          editorError: err instanceof Error ? err.message : String(err),
        })
      }
    },
  }
}
