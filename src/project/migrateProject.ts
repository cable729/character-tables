import {
  BASELINE_CHECKPOINT_ID,
  createCheckpoint,
  type Checkpoint,
} from '../types/checkpoint'
import {
  isLegacyTableProject,
  type LegacyTableProject,
  type TableProject,
} from '../types/tableProject'
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

  const baseline = createCheckpoint('Original', workingTable, {
    id: BASELINE_CHECKPOINT_ID,
    isBaseline: true,
  })

  return {
    id: legacy.id,
    title: legacy.title,
    workingTable,
    activeCheckpointId: null,
    checkpoints: { [baseline.id]: baseline, ...checkpoints },
    checkpointOrder: [baseline.id, ...checkpointOrder],
    history: emptyHistory(),
    historyByContext: {},
    transformLog: legacy.transformLog,
    lineage: legacy.lineage,
  }
}

function normalizeV2Project(project: TableProject): TableProject {
  let normalized: TableProject = {
    ...project,
    history: project.history ?? emptyHistory(),
    historyByContext: project.historyByContext ?? {},
  }
  if (!normalized.checkpoints[BASELINE_CHECKPOINT_ID]) {
    const baseline = createCheckpoint('Original', normalized.workingTable, {
      id: BASELINE_CHECKPOINT_ID,
      isBaseline: true,
    })
    normalized = {
      ...normalized,
      checkpoints: { [baseline.id]: baseline, ...normalized.checkpoints },
      checkpointOrder: [baseline.id, ...normalized.checkpointOrder],
    }
  }
  return normalized
}

export function migrateCatalogProject(project: unknown): TableProject {
  if (
    typeof project === 'object' &&
    project !== null &&
    'workingTable' in project
  ) {
    return normalizeV2Project(project as TableProject)
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
