import type { Checkpoint } from '../types/checkpoint'
import type { LegacyTableProject, TableProject } from '../types/tableProject'
import { emptyHistory } from '../types/tableEditOp'

/** Migrate v1 stage-based project to v2 working-table + checkpoints. */
export function migrateLegacyProject(
  legacy: LegacyTableProject,
): TableProject {
  const workingTable = structuredClone(
    legacy.stages[legacy.currentStage] ??
      legacy.stages[legacy.stageOrder[0] ?? 'main'],
  )
  if (!workingTable) {
    throw new Error('legacy project has no stages')
  }

  const checkpoints: Record<string, Checkpoint> = {}
  const checkpointOrder: string[] = []

  for (const stageName of legacy.stageOrder) {
    if (stageName === legacy.currentStage) {
      continue
    }
    const stageTable = legacy.stages[stageName]
    if (!stageTable) {
      continue
    }
    const id = `cp-migrated-${stageName}`
    checkpoints[id] = {
      id,
      name: stageName,
      parentId: null,
      table: structuredClone(stageTable),
      createdAt: new Date().toISOString(),
    }
    checkpointOrder.push(id)
  }

  return {
    id: legacy.id,
    title: legacy.title,
    workingTable,
    activeCheckpointId: null,
    checkpoints,
    checkpointOrder,
    history: emptyHistory(),
    transformLog: legacy.transformLog,
    lineage: legacy.lineage,
  }
}

export function normalizeProject(project: unknown): TableProject {
  if (isLegacyTableProject(project)) {
    return migrateLegacyProject(project)
  }
  return project as TableProject
}

function isLegacyTableProject(
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

export function migrateCatalogProject(project: unknown): TableProject {
  if (
    typeof project === 'object' &&
    project !== null &&
    'workingTable' in project
  ) {
    return project as TableProject
  }
  if (isLegacyTableProject(project)) {
    return migrateLegacyProject(project)
  }
  if (
    typeof project === 'object' &&
    project !== null &&
    'stages' in project
  ) {
    return migrateLegacyProject(project as LegacyTableProject)
  }
  throw new Error('unrecognized project shape')
}
