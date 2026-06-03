import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable } from '../types/characterTable'
import {
  addProjectToCatalog,
  createCatalogFromProject,
  createProjectFromPreset,
  duplicateProject,
  getActiveProject,
  getActiveUi,
  removeProjectFromCatalog,
  renameProjectInCatalog,
  saveActiveUiInCatalog,
  setActiveProjectInCatalog,
  updateActiveProjectInCatalog,
  type ProjectCatalog,
  type ProjectPreset,
} from '../types/projectCatalog'
import {
  createProjectFromTable,
  getCurrentTable,
  type TableProject,
  type TransformStep,
} from '../types/tableProject'
import {
  applyTransformToTable,
  buildSplitHeaderStep,
} from '../transforms/applyTransform'
import {
  parseYamlFile,
  projectToYaml,
  tableToYaml,
} from '../schema/yamlProject'
import { projectPresets } from '../data/projectPresets'
import { ut4Example, ut4Yaml } from '../data/ut4Example'

const STORAGE_KEY = 'character-table-v6'
const LEGACY_STORAGE_KEY = 'character-table-v5'

export const defaultProject: TableProject = createProjectFromTable(ut4Example, {
  id: 'ut4-default',
  title: 'UT₄(F_q)',
})

export const defaultCatalog: ProjectCatalog = createCatalogFromProject(
  defaultProject,
  { editorText: ut4Yaml.trim() },
)

function syncEditorFromProject(project: TableProject): string {
  return tableToYaml(getCurrentTable(project))
}

function updateTransformLogStageNames(
  log: TableProject['transformLog'],
  oldName: string,
  newName: string,
): TableProject['transformLog'] {
  return log.map((step) => ({
    ...step,
    at: step.at === oldName ? newName : step.at,
    ...(step.resultStage === oldName ? { resultStage: newName } : {}),
  }))
}

function activeDerivedState(catalog: ProjectCatalog) {
  const project = getActiveProject(catalog)
  const ui = getActiveUi(catalog)
  return {
    project,
    table: getCurrentTable(project),
    editorText: ui.editorText,
    showEditor: ui.showEditor,
    compactMath: ui.compactMath,
  }
}

function withActiveProject(
  catalog: ProjectCatalog,
  project: TableProject,
  uiPatch?: Partial<{
    editorText: string
    showEditor: boolean
    compactMath: boolean
  }>,
) {
  const nextCatalog = updateActiveProjectInCatalog(catalog, project)
  const uiCatalog = uiPatch
    ? saveActiveUiInCatalog(nextCatalog, uiPatch)
    : nextCatalog
  return {
    catalog: uiCatalog,
    ...activeDerivedState(uiCatalog),
    editorError: null as string | null,
  }
}

type TableStore = {
  catalog: ProjectCatalog
  project: TableProject
  /** Active stage table — synced with project.stages[currentStage] */
  table: CharacterTable
  showEditor: boolean
  /** Display-only: merge consecutive θ-factors in the table UI. */
  compactMath: boolean
  editorText: string
  editorError: string | null

  setProject: (project: TableProject) => void
  setTable: (table: CharacterTable) => void
  setStage: (name: string) => void
  addStage: (name: string, duplicateCurrent?: boolean) => void
  renameStage: (oldName: string, newName: string) => void
  setShowEditor: (show: boolean) => void
  setCompactMath: (compact: boolean) => void
  setEditorText: (text: string) => void
  applyEditor: () => boolean
  importYaml: (text: string) => void
  loadExample: (table: CharacterTable, yaml?: string) => void
  exportSnapshotYaml: () => string
  exportProjectYaml: () => string
  applyTransform: (args: {
    step: TransformStep
    resultStageName: string
  }) => void
  applySplitBelowLabel: (args: {
    axis: 'rows' | 'columns'
    sourceId: string
    belowLabel: string
    resultStageName: string
  }) => void
  setActiveProject: (projectId: string) => void
  createProjectFromPreset: (presetId: string) => void
  duplicateActiveProject: () => void
  deleteActiveProject: () => void
  renameActiveProject: (title: string) => void
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      catalog: defaultCatalog,
      ...activeDerivedState(defaultCatalog),
      editorError: null,

      setProject: (project) =>
        set(withActiveProject(get().catalog, project, {
          editorText: syncEditorFromProject(project),
        })),

      setTable: (table) => {
        const { catalog, project } = get()
        const stage = project.currentStage
        const nextProject: TableProject = {
          ...project,
          stages: { ...project.stages, [stage]: table },
        }
        set(
          withActiveProject(catalog, nextProject, {
            editorText: tableToYaml(table),
          }),
        )
      },

      setStage: (name) => {
        const { catalog, project } = get()
        if (!project.stages[name]) {
          set({ editorError: `stage "${name}" not found` })
          return
        }
        const nextProject = { ...project, currentStage: name }
        set(
          withActiveProject(catalog, nextProject, {
            editorText: syncEditorFromProject(nextProject),
          }),
        )
      },

      addStage: (name, duplicateCurrent = true) => {
        const trimmed = name.trim()
        if (!trimmed) {
          set({ editorError: 'stage name cannot be empty' })
          return
        }
        const { catalog, project, table } = get()
        if (project.stages[trimmed]) {
          set({ editorError: `stage "${trimmed}" already exists` })
          return
        }
        const snapshot = duplicateCurrent
          ? structuredClone(table)
          : structuredClone(table)
        const nextProject: TableProject = {
          ...project,
          currentStage: trimmed,
          stageOrder: [...project.stageOrder, trimmed],
          stages: { ...project.stages, [trimmed]: snapshot },
        }
        set(
          withActiveProject(catalog, nextProject, {
            editorText: syncEditorFromProject(nextProject),
          }),
        )
      },

      renameStage: (oldName, newName) => {
        const trimmed = newName.trim()
        if (!trimmed) {
          set({ editorError: 'stage name cannot be empty' })
          return
        }
        const { catalog, project } = get()
        if (!project.stages[oldName]) {
          set({ editorError: `stage "${oldName}" not found` })
          return
        }
        if (oldName !== trimmed && project.stages[trimmed]) {
          set({ editorError: `stage "${trimmed}" already exists` })
          return
        }
        const { [oldName]: stageTable, ...rest } = project.stages
        const stages = { ...rest, [trimmed]: stageTable! }
        const nextProject: TableProject = {
          ...project,
          currentStage:
            project.currentStage === oldName ? trimmed : project.currentStage,
          stageOrder: project.stageOrder.map((s) =>
            s === oldName ? trimmed : s,
          ),
          stages,
          transformLog: updateTransformLogStageNames(
            project.transformLog,
            oldName,
            trimmed,
          ),
        }
        set(
          withActiveProject(catalog, nextProject, {
            editorText: syncEditorFromProject(nextProject),
          }),
        )
      },

      setShowEditor: (showEditor) =>
        set({
          showEditor,
          catalog: saveActiveUiInCatalog(get().catalog, { showEditor }),
        }),

      setCompactMath: (compactMath) =>
        set({
          compactMath,
          catalog: saveActiveUiInCatalog(get().catalog, { compactMath }),
        }),

      setEditorText: (editorText) =>
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
            const stage = project.currentStage
            const nextProject: TableProject = {
              ...project,
              stages: { ...project.stages, [stage]: parsed.table },
            }
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

      importYaml: (text) => {
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
            const stage = project.currentStage
            const nextProject: TableProject = {
              ...project,
              stages: { ...project.stages, [stage]: parsed.table },
            }
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

      loadExample: (table, yaml) => {
        const project = createProjectFromTable(table, {
          id: 'ut4-default',
          title: table.group ?? table.title ?? 'Example',
        })
        const catalog = createCatalogFromProject(project, {
          editorText: yaml?.trim() ?? tableToYaml(table),
        })
        set({
          catalog,
          ...activeDerivedState(catalog),
          editorError: null,
        })
      },

      exportSnapshotYaml: () => tableToYaml(get().table),

      exportProjectYaml: () => projectToYaml(get().project),

      applyTransform: ({ step, resultStageName }) => {
        const trimmed = resultStageName.trim()
        if (!trimmed) {
          set({ editorError: 'result stage name cannot be empty' })
          return
        }
        const { catalog, project, table } = get()
        if (project.stages[trimmed]) {
          set({ editorError: `stage "${trimmed}" already exists` })
          return
        }
        try {
          const atStage = project.currentStage
          const stepWithAt: TransformStep = {
            ...step,
            at: atStage,
            resultStage: trimmed,
          }
          const { table: newTable, lineageUpdates } = applyTransformToTable(
            table,
            stepWithAt,
          )
          const nextLineage = { ...project.lineage }
          for (const [id, entry] of Object.entries(lineageUpdates)) {
            nextLineage[id] = {
              ...nextLineage[id],
              ...entry,
              parentIds: entry.parentIds ?? nextLineage[id]?.parentIds,
              childIds: entry.childIds ?? nextLineage[id]?.childIds,
            }
          }
          const nextProject: TableProject = {
            ...project,
            currentStage: trimmed,
            stageOrder: [...project.stageOrder, trimmed],
            stages: { ...project.stages, [trimmed]: newTable },
            transformLog: [...project.transformLog, stepWithAt],
            lineage: nextLineage,
          }
          set(
            withActiveProject(catalog, nextProject, {
              editorText: tableToYaml(newTable),
            }),
          )
        } catch (err) {
          set({
            editorError: err instanceof Error ? err.message : String(err),
          })
        }
      },

      applySplitBelowLabel: (args) => {
        const { project, table } = get()
        try {
          const step = buildSplitHeaderStep(table, {
            axis: args.axis,
            sourceId: args.sourceId,
            belowLabel: args.belowLabel,
            at: project.currentStage,
            resultStage: args.resultStageName.trim(),
          })
          get().applyTransform({
            step,
            resultStageName: args.resultStageName,
          })
        } catch (err) {
          set({
            editorError: err instanceof Error ? err.message : String(err),
          })
        }
      },

      setActiveProject: (projectId) => {
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

      createProjectFromPreset: (presetId) => {
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

      renameActiveProject: (title) => {
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
    }),
    {
      name: STORAGE_KEY,
      version: 8,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>

        if (version < 8) {
          const project = state.project as TableProject | undefined
          if (project) {
            const catalog = createCatalogFromProject(project, {
              editorText:
                (state.editorText as string | undefined) ??
                syncEditorFromProject(project),
              showEditor: (state.showEditor as boolean | undefined) ?? false,
              compactMath: (state.compactMath as boolean | undefined) ?? false,
            })
            return {
              catalog,
              ...activeDerivedState(catalog),
              editorError: null,
            }
          }
        }

        if (version < 7 && state.compactMath === undefined) {
          state.compactMath = false
        }

        if (version >= 6 && version < 8) {
          return state as Partial<TableStore>
        }

        const old = persisted as {
          table?: CharacterTable
          editorText?: string
          showEditor?: boolean
        }
        if (old.table) {
          const project = createProjectFromTable(old.table)
          const catalog = createCatalogFromProject(project, {
            editorText: old.editorText ?? tableToYaml(old.table),
            showEditor: old.showEditor ?? false,
          })
          return {
            catalog,
            ...activeDerivedState(catalog),
            editorError: null,
          }
        }
        return persisted
      },
      partialize: (state) => ({
        catalog: state.catalog,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.catalog) {
          Object.assign(state, activeDerivedState(state.catalog))
        } else if (state?.project) {
          state.catalog = createCatalogFromProject(state.project, {
            editorText: state.editorText,
            showEditor: state.showEditor,
            compactMath: state.compactMath,
          })
          Object.assign(state, activeDerivedState(state.catalog))
        }
      },
    },
  ),
)

/** Migrate legacy v5 localStorage if v6 is empty on first load. */
export function migrateLegacyStorageIfNeeded(): void {
  if (localStorage.getItem(STORAGE_KEY)) {
    return
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!legacy) {
    return
  }
  try {
    const parsed = JSON.parse(legacy) as {
      state?: { table?: CharacterTable; editorText?: string; showEditor?: boolean }
    }
    const table = parsed.state?.table
    if (!table) {
      return
    }
    const project = createProjectFromTable(table)
    const catalog = createCatalogFromProject(project, {
      editorText: parsed.state?.editorText ?? tableToYaml(table),
      showEditor: parsed.state?.showEditor ?? false,
    })
    const payload = {
      state: {
        catalog,
      },
      version: 8,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore corrupt legacy storage
  }
}

export { projectPresets }
export type { ProjectPreset }
