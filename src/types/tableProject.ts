import type { CharacterTable } from './characterTable'
import type { Checkpoint } from './checkpoint'
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

/** Transform steps; splitHeader is implemented in v1 */
export type TransformStep =
  | {
      op: 'stripBelowArcs'
      axis: 'rows' | 'columns' | 'both'
      at: StageName
      resultStage?: StageName
    }
  | { op: 'sumOverLabels'; at: StageName; resultStage?: StageName }
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
  transformLog: TransformStep[]
  lineage: Record<string, HeaderLineage>
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

/** @deprecated Use getWorkingTable */
export function getCurrentTable(project: TableProject): CharacterTable {
  return getWorkingTable(project)
}

export function createProjectFromTable(
  table: CharacterTable,
  options?: { id?: string; title?: string },
): TableProject {
  const title =
    options?.title ?? table.group ?? table.title ?? 'Character table project'
  return {
    id: options?.id ?? 'project-default',
    title,
    workingTable: structuredClone(table),
    activeCheckpointId: null,
    checkpoints: {},
    checkpointOrder: [],
    history: emptyHistory(),
    transformLog: [],
    lineage: {},
  }
}
