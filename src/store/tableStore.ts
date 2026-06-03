import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable } from '../types/characterTable'
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
import { ut4Example, ut4Yaml } from '../data/ut4Example'

const STORAGE_KEY = 'character-table-v6'
const LEGACY_STORAGE_KEY = 'character-table-v5'

export const defaultProject: TableProject = createProjectFromTable(ut4Example, {
  id: 'ut4-default',
  title: 'UT₄ example',
})

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

type TableStore = {
  project: TableProject
  /** Active stage table — synced with project.stages[currentStage] */
  table: CharacterTable
  showEditor: boolean
  editorText: string
  editorError: string | null

  setProject: (project: TableProject) => void
  setTable: (table: CharacterTable) => void
  setStage: (name: string) => void
  addStage: (name: string, duplicateCurrent?: boolean) => void
  renameStage: (oldName: string, newName: string) => void
  setShowEditor: (show: boolean) => void
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
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      project: defaultProject,
      table: getCurrentTable(defaultProject),
      showEditor: false,
      editorText: ut4Yaml.trim(),
      editorError: null,

      setProject: (project) =>
        set({
          project,
          table: getCurrentTable(project),
          editorText: syncEditorFromProject(project),
          editorError: null,
        }),

      setTable: (table) => {
        const { project } = get()
        const stage = project.currentStage
        set({
          project: {
            ...project,
            stages: { ...project.stages, [stage]: table },
          },
          table,
          editorText: tableToYaml(table),
          editorError: null,
        })
      },

      setStage: (name) => {
        const { project } = get()
        if (!project.stages[name]) {
          set({ editorError: `stage "${name}" not found` })
          return
        }
        const next = { ...project, currentStage: name }
        set({
          project: next,
          table: getCurrentTable(next),
          editorText: syncEditorFromProject(next),
          editorError: null,
        })
      },

      addStage: (name, duplicateCurrent = true) => {
        const trimmed = name.trim()
        if (!trimmed) {
          set({ editorError: 'stage name cannot be empty' })
          return
        }
        const { project, table } = get()
        if (project.stages[trimmed]) {
          set({ editorError: `stage "${trimmed}" already exists` })
          return
        }
        const snapshot = duplicateCurrent
          ? structuredClone(table)
          : structuredClone(table)
        const next: TableProject = {
          ...project,
          currentStage: trimmed,
          stageOrder: [...project.stageOrder, trimmed],
          stages: { ...project.stages, [trimmed]: snapshot },
        }
        set({
          project: next,
          table: getCurrentTable(next),
          editorText: syncEditorFromProject(next),
          editorError: null,
        })
      },

      renameStage: (oldName, newName) => {
        const trimmed = newName.trim()
        if (!trimmed) {
          set({ editorError: 'stage name cannot be empty' })
          return
        }
        const { project } = get()
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
        const next: TableProject = {
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
        set({
          project: next,
          table: getCurrentTable(next),
          editorText: syncEditorFromProject(next),
          editorError: null,
        })
      },

      setShowEditor: (showEditor) => set({ showEditor }),

      setEditorText: (editorText) => set({ editorText, editorError: null }),

      applyEditor: () => {
        try {
          const parsed = parseYamlFile(get().editorText)
          if (parsed.kind === 'project') {
            set({
              project: parsed.project,
              table: getCurrentTable(parsed.project),
              editorText: syncEditorFromProject(parsed.project),
              editorError: null,
            })
          } else {
            const { project } = get()
            const stage = project.currentStage
            const next: TableProject = {
              ...project,
              stages: { ...project.stages, [stage]: parsed.table },
            }
            set({
              project: next,
              table: parsed.table,
              editorText: tableToYaml(parsed.table),
              editorError: null,
            })
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
          const parsed = parseYamlFile(text)
          if (parsed.kind === 'project') {
            set({
              project: parsed.project,
              table: getCurrentTable(parsed.project),
              editorText: syncEditorFromProject(parsed.project),
              editorError: null,
            })
          } else {
            const { project } = get()
            const stage = project.currentStage
            const next: TableProject = {
              ...project,
              stages: { ...project.stages, [stage]: parsed.table },
            }
            set({
              project: next,
              table: parsed.table,
              editorText: tableToYaml(parsed.table),
              editorError: null,
            })
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
        set({
          project,
          table,
          editorText: yaml?.trim() ?? tableToYaml(table),
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
        const { project, table } = get()
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
          const next: TableProject = {
            ...project,
            currentStage: trimmed,
            stageOrder: [...project.stageOrder, trimmed],
            stages: { ...project.stages, [trimmed]: newTable },
            transformLog: [...project.transformLog, stepWithAt],
            lineage: nextLineage,
          }
          set({
            project: next,
            table: newTable,
            editorText: tableToYaml(newTable),
            editorError: null,
          })
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
    }),
    {
      name: STORAGE_KEY,
      version: 6,
      migrate: (persisted, version) => {
        if (version >= 6) {
          return persisted as TableStore
        }
        const old = persisted as {
          table?: CharacterTable
          editorText?: string
          showEditor?: boolean
        }
        if (old.table) {
          const project = createProjectFromTable(old.table)
          return {
            project,
            table: old.table,
            showEditor: old.showEditor ?? false,
            editorText: old.editorText ?? tableToYaml(old.table),
            editorError: null,
          }
        }
        return persisted
      },
      partialize: (state) => ({
        project: state.project,
        editorText: state.editorText,
        showEditor: state.showEditor,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.table = getCurrentTable(state.project)
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
    const payload = {
      state: {
        project,
        editorText: parsed.state?.editorText ?? tableToYaml(table),
        showEditor: parsed.state?.showEditor ?? false,
      },
      version: 6,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore corrupt legacy storage
  }
}
