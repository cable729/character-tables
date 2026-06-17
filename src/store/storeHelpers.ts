import type { CharacterTable } from '../types/characterTable'
import { createCheckpoint } from '../types/checkpoint'
import {
  getActiveProject,
  getActiveUi,
  saveActiveUiInCatalog,
  updateActiveProjectInCatalog,
  type ProjectCatalog,
} from '../types/projectCatalog'
import {
  getWorkingTable,
  tablesEqual,
  type TableProject,
} from '../types/tableProject'
import { MAX_HISTORY_OPS, type TableEditOp } from '../types/tableEditOp'
import { migrateCatalogProject } from '../project/migrateProject'
import { tableToYaml } from '../schema/yamlProject'

export function syncEditorFromProject(project: TableProject): string {
  return tableToYaml(getWorkingTable(project))
}

export function migrateCatalog(catalog: ProjectCatalog): ProjectCatalog {
  return {
    ...catalog,
    projects: catalog.projects.map((p) => migrateCatalogProject(p)),
  }
}

export function activeDerivedState(catalog: ProjectCatalog) {
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

export function withActiveProject(
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

export function trimHistory(past: TableEditOp[]): TableEditOp[] {
  if (past.length <= MAX_HISTORY_OPS) {
    return past
  }
  return past.slice(past.length - MAX_HISTORY_OPS)
}

export function stashWorkingCopyIfChanged(project: TableProject): TableProject {
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
  showEditor: boolean
  compactMath: boolean
  editorText: string
  editorError: string | null
  canUndo: boolean
  canRedo: boolean
}
