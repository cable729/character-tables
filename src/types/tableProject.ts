import type { CharacterTable } from './characterTable'
import {
  BASELINE_CHECKPOINT_ID,
  createCheckpoint,
  type Checkpoint,
} from './checkpoint'
import type { EditHistory } from './tableEditOp'
import { emptyHistory } from './tableEditOp'

/** @deprecated Legacy stage name from v1 bundles */
export type StageName = string

export type HeaderLineage = {
  parentIds?: string[]
  childIds?: string[]
}

export type HeaderSplitChild = {
  id: string
  header: import('./characterTable').HeaderSpec
}

/** Transform steps recorded in transformLog */
export type TransformStep =
  | {
      op: 'splitHeader'
      axis: 'rows' | 'columns'
      sourceId: string
      belowLabel: string
      children: HeaderSplitChild[]
      at: StageName
      resultStage?: StageName
    }
  | {
      op: 'combineHeaders'
      axis: 'rows' | 'columns'
      sourceIds: string[]
      resultId: string
      method: 'sum' | 'identical'
      at: StageName
      resultStage?: StageName
    }

/** v1 project shape (stages); migrated on load */
export type LegacyTableProject = {
  id: string
  title: string
  currentStage: StageName
  stageOrder: StageName[]
  stages: Record<StageName, CharacterTable>
  transformLog: TransformStep[]
  lineage: Record<string, HeaderLineage>
}

/** Pre-v3 storage shape with a separate working copy */
export type LegacyWorkingTableProject = {
  id: string
  title: string
  workingTable: CharacterTable
  activeCheckpointId: string | null
  checkpoints: Record<string, Checkpoint>
  checkpointOrder: string[]
  history: EditHistory
  historyByContext: Record<string, EditHistory>
  transformLog: TransformStep[]
  lineage: Record<string, HeaderLineage>
}

export type TableProject = {
  id: string
  title: string
  /** Prepackaged projects from git; not editable until copied. */
  readonly?: boolean
  activeCheckpointId: string
  /** Unsaved edits to the active checkpoint; null when clean. */
  dirtyTable: CharacterTable | null
  checkpoints: Record<string, Checkpoint>
  checkpointOrder: string[]
  history: EditHistory
  historyByContext: Record<string, EditHistory>
  transformLog: TransformStep[]
  lineage: Record<string, HeaderLineage>
}

export function tablesEqual(a: CharacterTable, b: CharacterTable): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function getActiveCheckpoint(project: TableProject): Checkpoint {
  const cp = project.checkpoints[project.activeCheckpointId]
  if (!cp) {
    throw new Error(
      `active checkpoint "${project.activeCheckpointId}" not found`,
    )
  }
  return cp
}

export function getDisplayTable(project: TableProject): CharacterTable {
  return project.dirtyTable ?? getActiveCheckpoint(project).table
}

/** @deprecated Use getDisplayTable */
export function getWorkingTable(project: TableProject): CharacterTable {
  return getDisplayTable(project)
}

export function isProjectDirty(project: TableProject): boolean {
  return project.dirtyTable !== null
}

export function getHistoryContextKey(project: TableProject): string {
  return project.activeCheckpointId
}

export function withActiveHistory(
  project: TableProject,
  history: EditHistory,
): TableProject {
  const key = getHistoryContextKey(project)
  return {
    ...project,
    history,
    historyByContext: {
      ...project.historyByContext,
      [key]: history,
    },
  }
}

export function swapHistoryContext(
  project: TableProject,
  targetCheckpointId: string,
): TableProject {
  const currentKey = getHistoryContextKey(project)
  const historyByContext = {
    ...project.historyByContext,
    [currentKey]: project.history,
  }
  const history = historyByContext[targetCheckpointId] ?? emptyHistory()
  return {
    ...project,
    activeCheckpointId: targetCheckpointId,
    dirtyTable: null,
    historyByContext,
    history,
  }
}

export function removeBaselineCheckpoint(project: TableProject): TableProject {
  if (!project.checkpoints[BASELINE_CHECKPOINT_ID]) {
    return project
  }
  const { [BASELINE_CHECKPOINT_ID]: _removed, ...checkpoints } =
    project.checkpoints
  const checkpointOrder = project.checkpointOrder.filter(
    (id) => id !== BASELINE_CHECKPOINT_ID,
  )
  let activeCheckpointId = project.activeCheckpointId
  if (activeCheckpointId === BASELINE_CHECKPOINT_ID) {
    activeCheckpointId =
      checkpointOrder[checkpointOrder.length - 1] ?? checkpointOrder[0]!
  }
  return {
    ...project,
    checkpoints,
    checkpointOrder,
    activeCheckpointId,
  }
}

export function isLegacyTableProject(
  project: unknown,
): project is LegacyTableProject {
  return (
    typeof project === 'object' &&
    project !== null &&
    'stages' in project &&
    'currentStage' in project &&
    !('dirtyTable' in project)
  )
}

export function isLegacyWorkingTableProject(
  project: unknown,
): project is LegacyWorkingTableProject {
  return (
    typeof project === 'object' &&
    project !== null &&
    'workingTable' in project &&
    !('dirtyTable' in project)
  )
}

export function defaultActiveCheckpointId(project: TableProject): string {
  return (
    project.checkpointOrder[project.checkpointOrder.length - 1] ??
    BASELINE_CHECKPOINT_ID
  )
}

export function resolveInitialActiveCheckpointId(
  project: TableProject,
  preferredTable?: CharacterTable,
): string {
  if (preferredTable) {
    const match = project.checkpointOrder.find((id) => {
      const cp = project.checkpoints[id]
      return cp && tablesEqual(cp.table, preferredTable)
    })
    if (match) {
      return match
    }
  }
  return defaultActiveCheckpointId(project)
}

export function createProjectFromTable(
  table: CharacterTable,
  options?: { id?: string; title?: string; readonly?: boolean },
): TableProject {
  const title =
    options?.title ?? table.group ?? table.title ?? 'Character table project'
  const cloned = structuredClone(table)
  const baseline = createCheckpoint('Original', cloned, {
    id: BASELINE_CHECKPOINT_ID,
    isBaseline: true,
  })
  return {
    id: options?.id ?? 'project-default',
    title,
    readonly: options?.readonly,
    activeCheckpointId: baseline.id,
    dirtyTable: null,
    checkpoints: { [baseline.id]: baseline },
    checkpointOrder: [baseline.id],
    history: emptyHistory(),
    historyByContext: {},
    transformLog: [],
    lineage: {},
  }
}

export function setDirtyTable(
  project: TableProject,
  table: CharacterTable,
): TableProject {
  const saved = getActiveCheckpoint(project).table
  return {
    ...project,
    dirtyTable: tablesEqual(table, saved) ? null : table,
  }
}

export function convertFromWorkingTableProject(
  legacy: LegacyWorkingTableProject,
): TableProject {
  let activeCheckpointId =
    legacy.activeCheckpointId ?? defaultActiveCheckpointId({
      ...legacy,
      activeCheckpointId: BASELINE_CHECKPOINT_ID,
      dirtyTable: null,
      readonly: false,
    })

  if (!legacy.checkpoints[activeCheckpointId]) {
    activeCheckpointId = defaultActiveCheckpointId({
      ...legacy,
      activeCheckpointId,
      dirtyTable: null,
      readonly: false,
    })
  }

  const checkpointTable = legacy.checkpoints[activeCheckpointId]?.table
  let dirtyTable: CharacterTable | null = null

  if (legacy.activeCheckpointId === null) {
    if (checkpointTable && !tablesEqual(legacy.workingTable, checkpointTable)) {
      dirtyTable = structuredClone(legacy.workingTable)
    } else if (!checkpointTable) {
      dirtyTable = structuredClone(legacy.workingTable)
    }
  }

  return {
    id: legacy.id,
    title: legacy.title,
    readonly: false,
    activeCheckpointId,
    dirtyTable,
    checkpoints: legacy.checkpoints,
    checkpointOrder: legacy.checkpointOrder,
    history: legacy.history ?? emptyHistory(),
    historyByContext: legacy.historyByContext ?? {},
    transformLog: legacy.transformLog,
    lineage: legacy.lineage,
  }
}
