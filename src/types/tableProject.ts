import type { CharacterTable } from './characterTable'

/** User-defined stage name; non-empty string */
export type StageName = string

export type HeaderLineage = {
  parentIds?: string[]
  childIds?: string[]
}

/** Typed now, implemented later */
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
      intoIds: string[]
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

export type TableProject = {
  id: string
  title: string
  currentStage: StageName
  stageOrder: StageName[]
  stages: Record<StageName, CharacterTable>
  transformLog: TransformStep[]
  lineage: Record<string, HeaderLineage>
}

export const DEFAULT_STAGE_NAME = 'main'

export function createProjectFromTable(
  table: CharacterTable,
  options?: { id?: string; title?: string; stageName?: StageName },
): TableProject {
  const stageName = options?.stageName ?? DEFAULT_STAGE_NAME
  const title =
    options?.title ?? table.group ?? table.title ?? 'Character table project'
  return {
    id: options?.id ?? 'project-default',
    title,
    currentStage: stageName,
    stageOrder: [stageName],
    stages: { [stageName]: table },
    transformLog: [],
    lineage: {},
  }
}

export function getCurrentTable(project: TableProject): CharacterTable {
  const table = project.stages[project.currentStage]
  if (!table) {
    throw new Error(
      `current stage "${project.currentStage}" not found in project stages`,
    )
  }
  return table
}
