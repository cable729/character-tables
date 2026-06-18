import type { CharacterTable } from '../types/characterTable'
import {
  getActiveProject,
  getActiveUi,
  mergePresetProjects,
  saveActiveUiInCatalog,
  updateActiveProjectInCatalog,
  type ProjectCatalog,
} from '../types/projectCatalog'
import {
  getActiveCheckpoint,
  getDisplayTable,
  isProjectDirty,
  setDirtyTable,
  tablesEqual,
  type TableProject,
} from '../types/tableProject'
import { MAX_HISTORY_OPS, type TableEditOp } from '../types/tableEditOp'
import { migrateCatalogProject } from '../project/migrateProject'

export function migrateCatalog(catalog: ProjectCatalog): ProjectCatalog {
  const migrated: ProjectCatalog = {
    ...catalog,
    projects: catalog.projects.map((p) => migrateCatalogProject(p)),
  }
  return mergePresetProjects(migrated)
}

export function activeDerivedState(catalog: ProjectCatalog) {
  const project = getActiveProject(catalog)
  const ui = getActiveUi(catalog)
  const dirty = isProjectDirty(project)
  return {
    project,
    table: getDisplayTable(project),
    isDirty: dirty,
    compactMath: ui.compactMath,
    canUndo: !project.readonly && project.history.past.length > 0,
    canRedo: !project.readonly && project.history.future.length > 0,
  }
}

export function withActiveProject(
  catalog: ProjectCatalog,
  project: TableProject,
  uiPatch?: Partial<{
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

export function trimHistory(past: TableEditOp[]): TableEditOp[] {
  if (past.length <= MAX_HISTORY_OPS) {
    return past
  }
  return past.slice(past.length - MAX_HISTORY_OPS)
}

export function applyDirtyTable(
  project: TableProject,
  table: CharacterTable,
): TableProject {
  return setDirtyTable(project, table)
}

export function clearDirtyIfMatchesCheckpoint(
  project: TableProject,
  table: CharacterTable,
): TableProject {
  const saved = getActiveCheckpoint(project).table
  return {
    ...project,
    dirtyTable: tablesEqual(table, saved) ? null : structuredClone(table),
  }
}

export function mergeLineage(
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

export type TableStoreState = {
  catalog: ProjectCatalog
  project: TableProject
  table: CharacterTable
  isDirty: boolean
  compactMath: boolean
  editorError: string | null
  canUndo: boolean
  canRedo: boolean
}
