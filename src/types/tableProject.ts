import type { CharacterTable } from './characterTable'
import {
  BASELINE_CHECKPOINT_ID,
  createCheckpoint,
  type Checkpoint,
} from './checkpoint'
import type { EditHistory } from './tableEditOp'
import { emptyHistory } from './tableEditOp'

export const WORKING_HISTORY_KEY = 'working'

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

export type TableProject = {
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

export function tablesEqual(a: CharacterTable, b: CharacterTable): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function getHistoryContextKey(project: TableProject): string {
  return project.activeCheckpointId ?? WORKING_HISTORY_KEY
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
  targetCheckpointId: string | null,
): TableProject {
  const currentKey = getHistoryContextKey(project)
  const targetKey = targetCheckpointId ?? WORKING_HISTORY_KEY
  const historyByContext = {
    ...project.historyByContext,
    [currentKey]: project.history,
  }
  const history = historyByContext[targetKey] ?? emptyHistory()
  return {
    ...project,
    activeCheckpointId: targetCheckpointId,
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
  return {
    ...project,
    checkpoints,
    checkpointOrder: project.checkpointOrder.filter(
      (id) => id !== BASELINE_CHECKPOINT_ID,
    ),
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
    !('workingTable' in project)
  )
}

/** Table shown in the UI: checkpoint snapshot when one is selected, else the working copy. */
export function getWorkingTable(project: TableProject): CharacterTable {
  if (project.activeCheckpointId) {
    const cp = project.checkpoints[project.activeCheckpointId]
    if (cp) {
      return cp.table
    }
  }
  return project.workingTable
}

export function createProjectFromTable(
  table: CharacterTable,
  options?: { id?: string; title?: string },
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
    workingTable: cloned,
    activeCheckpointId: null,
    checkpoints: { [baseline.id]: baseline },
    checkpointOrder: [baseline.id],
    history: emptyHistory(),
    historyByContext: {},
    transformLog: [],
    lineage: {},
  }
}
