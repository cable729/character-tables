import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable, GroupSpec, HeaderSpec } from '../types/characterTable'
import {
  applyGroupSpecToTable,
  snapshotGroupFields,
} from '../groups/groupSpec'
import { createCheckpoint } from '../types/checkpoint'
import {
  addProjectToCatalog,
  createCatalogFromProject,
  createProjectFromGroup as buildProjectFromGroup,
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
  getWorkingTable,
  swapHistoryContext,
  tablesEqual,
  withActiveHistory,
  WORKING_HISTORY_KEY,
  type TableProject,
} from '../types/tableProject'
import type { TableEditOp } from '../types/tableEditOp'
import { MAX_HISTORY_OPS } from '../types/tableEditOp'
import { emptyHistory } from '../types/tableEditOp'
import {
  applyOp,
  defaultBlankColumn,
  defaultBlankRow,
  invertOp,
} from '../tableOps/applyOp'
import { combineHeadersInTable } from '../tableOps/combineHeaders'
import {
  applyTransformToTable,
  buildSplitHeaderStep,
} from '../transforms/applyTransform'
import {
  parseYamlFile,
  projectToYaml,
  tableToYaml,
} from '../schema/yamlProject'
import { migrateCatalogProject } from '../project/migrateProject'
import { projectPresets } from '../data/projectPresets'
import { ut4Example, ut4Yaml } from '../data/ut4Example'

const STORAGE_KEY = 'character-table-v7'
const LEGACY_STORAGE_KEY = 'character-table-v6'

export const defaultProject: TableProject = createProjectFromTable(ut4Example, {
  id: 'ut4-default',
  title: 'UT₄(F_q)',
})

export const defaultCatalog: ProjectCatalog = createCatalogFromProject(
  defaultProject,
  { editorText: ut4Yaml.trim() },
)

function syncEditorFromProject(project: TableProject): string {
  return tableToYaml(getWorkingTable(project))
}

function migrateCatalog(catalog: ProjectCatalog): ProjectCatalog {
  return {
    ...catalog,
    projects: catalog.projects.map((p) => migrateCatalogProject(p)),
  }
}

function activeDerivedState(catalog: ProjectCatalog) {
  const project = getActiveProject(catalog)
  const ui = getActiveUi(catalog)
  return {
    project,
    table: getWorkingTable(project),
    editorText: ui.editorText,
    showEditor: ui.showEditor,
    compactMath: ui.compactMath,
    canUndo:
      project.activeCheckpointId === null && project.history.past.length > 0,
    canRedo:
      project.activeCheckpointId === null && project.history.future.length > 0,
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

function trimHistory(past: TableEditOp[]): TableEditOp[] {
  if (past.length <= MAX_HISTORY_OPS) {
    return past
  }
  return past.slice(past.length - MAX_HISTORY_OPS)
}

function stashWorkingCopyIfChanged(project: TableProject): TableProject {
  const activeCp = project.activeCheckpointId
    ? project.checkpoints[project.activeCheckpointId]
    : null
  if (!activeCp || tablesEqual(project.workingTable, activeCp.table)) {
    return project
  }
  const cp = createCheckpoint('Previous working copy', project.workingTable)
  return {
    ...project,
    checkpoints: { ...project.checkpoints, [cp.id]: cp },
    checkpointOrder: [...project.checkpointOrder, cp.id],
  }
}

function mergeLineage(
  lineage: TableProject['lineage'],
  updates: Record<string, import('../types/tableProject').HeaderLineage>,
): TableProject['lineage'] {
  const next = { ...lineage }
  for (const [id, entry] of Object.entries(updates)) {
    next[id] = {
      ...next[id],
      ...entry,
      parentIds: entry.parentIds ?? next[id]?.parentIds,
      childIds: entry.childIds ?? next[id]?.childIds,
    }
  }
  return next
}

type TableStore = {
  catalog: ProjectCatalog
  project: TableProject
  table: CharacterTable
  showEditor: boolean
  compactMath: boolean
  editorText: string
  editorError: string | null
  canUndo: boolean
  canRedo: boolean

  setProject: (project: TableProject) => void
  setTable: (table: CharacterTable) => void
  dispatchOp: (op: TableEditOp) => void
  undo: () => void
  redo: () => void
  saveCheckpoint: (name: string) => void
  loadCheckpoint: (id: string | null) => void
  renameCheckpoint: (id: string, name: string) => void
  setShowEditor: (show: boolean) => void
  setCompactMath: (compact: boolean) => void
  setEditorText: (text: string) => void
  applyEditor: () => boolean
  importYaml: (text: string) => void
  loadExample: (table: CharacterTable, yaml?: string) => void
  exportSnapshotYaml: () => string
  exportProjectYaml: () => string
  applySplitBelowLabel: (args: {
    axis: 'rows' | 'columns'
    sourceId: string
    belowLabel: string
  }) => void
  applyCombineHeaders: (args: {
    axis: 'rows' | 'columns'
    sourceIds: string[]
    method: 'sum' | 'identical'
  }) => { needsManualDiagram?: { axis: 'rows' | 'columns'; index: number } } | undefined
  insertRow: (index: number, position: 'above' | 'below') => void
  removeRows: (indices: number[]) => void
  insertColumn: (index: number, position: 'before' | 'after') => void
  removeColumns: (indices: number[]) => void
  setRowHeader: (index: number, after: HeaderSpec) => void
  setColumnHeader: (index: number, after: HeaderSpec) => void
  setActiveProject: (projectId: string) => void
  createProjectFromPreset: (presetId: string) => void
  createProjectFromGroup: (spec: GroupSpec) => void
  setProjectGroup: (spec: GroupSpec) => void
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

      dispatchOp: (op) => {
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
          op.op === 'splitHeader'
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
              op.op === 'splitHeader'
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
              op.op === 'splitHeader'
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

      saveCheckpoint: (name) => {
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

      loadCheckpoint: (id) => {
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

      renameCheckpoint: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) {
          set({ editorError: 'checkpoint name cannot be empty' })
          return
        }
        const { catalog, project } = get()
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

      applySplitBelowLabel: (args) => {
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

      applyCombineHeaders: (args) => {
        const { project, table } = get()
        try {
          const resultId =
            args.axis === 'rows'
              ? `row-combined-${args.sourceIds.join('-')}`
              : `col-combined-${args.sourceIds.join('-')}`
          const before = structuredClone(table)
          const lineageBefore = structuredClone(project.lineage)
          const { table: after, lineageUpdates, needsManualDiagram } =
            combineHeadersInTable(
              table,
              args.axis,
              args.sourceIds,
              resultId,
              args.method,
            )
          const lineageAfter = mergeLineage(lineageBefore, lineageUpdates)
          get().dispatchOp({
            op: 'combineHeaders',
            axis: args.axis,
            sourceIds: args.sourceIds,
            resultId,
            method: args.method,
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

      insertRow: (index, position) => {
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

      removeRows: (indices) => {
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

      insertColumn: (index, position) => {
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

      removeColumns: (indices) => {
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

      setRowHeader: (index, after) => {
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

      setColumnHeader: (index, after) => {
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

      createProjectFromGroup: (spec) => {
        const { project, ui } = buildProjectFromGroup(spec)
        const nextCatalog = addProjectToCatalog(get().catalog, project, ui)
        set({
          catalog: nextCatalog,
          ...activeDerivedState(nextCatalog),
          editorError: null,
        })
      },

      setProjectGroup: (spec) => {
        const { table } = get()
        const before = snapshotGroupFields(table)
        const afterTable = applyGroupSpecToTable(table, spec)
        const after = snapshotGroupFields(afterTable)
        get().dispatchOp({ op: 'setGroupSpec', before, after })
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
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>
        if (state.catalog) {
          const catalog = migrateCatalog(state.catalog as ProjectCatalog)
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
          state.catalog = migrateCatalog(state.catalog)
          Object.assign(state, activeDerivedState(state.catalog))
        }
      },
    },
  ),
)

/** Migrate legacy v6 localStorage if v7 is empty on first load. */
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
      state?: { catalog?: ProjectCatalog }
      version?: number
    }
    const catalog = parsed.state?.catalog
    if (!catalog) {
      return
    }
    const migrated = migrateCatalog(catalog)
    const payload = {
      state: { catalog: migrated },
      version: 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore corrupt legacy storage
  }
}

export { projectPresets }
export type { ProjectPreset }
