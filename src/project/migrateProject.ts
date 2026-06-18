import {
  BASELINE_CHECKPOINT_ID,
  createCheckpoint,
  type Checkpoint,
} from '../types/checkpoint'
import {
  convertFromWorkingTableProject,
  defaultActiveCheckpointId,
  isLegacyTableProject,
  isLegacyWorkingTableProject,
  type LegacyTableProject,
  type TableProject,
} from '../types/tableProject'
import { emptyHistory } from '../types/tableEditOp'

/** Migrate v1 stage-based project to v3 checkpoint model. */
export function migrateLegacyProject(
  legacy: LegacyTableProject,
): TableProject {
  const currentTable = structuredClone(
    legacy.stages[legacy.currentStage] ??
      legacy.stages[legacy.stageOrder[0] ?? 'main'],
  )
  if (!currentTable) {
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

  const baseline = createCheckpoint('Original', currentTable, {
    id: BASELINE_CHECKPOINT_ID,
    isBaseline: true,
  })

  const project: TableProject = {
    id: legacy.id,
    title: legacy.title,
    activeCheckpointId: baseline.id,
    dirtyTable: null,
    checkpoints: { [baseline.id]: baseline, ...checkpoints },
    checkpointOrder: [baseline.id, ...checkpointOrder],
    history: emptyHistory(),
    historyByContext: {},
    transformLog: legacy.transformLog,
    lineage: legacy.lineage,
  }

  return project
}

function normalizeV3Project(project: TableProject): TableProject {
  let normalized: TableProject = {
    ...project,
    history: project.history ?? emptyHistory(),
    historyByContext: project.historyByContext ?? {},
    dirtyTable: project.dirtyTable ?? null,
  }

  if (!normalized.checkpoints[BASELINE_CHECKPOINT_ID]) {
    const baselineTable =
      normalized.dirtyTable ?? Object.values(normalized.checkpoints)[0]?.table
    if (baselineTable) {
      const baseline = createCheckpoint('Original', baselineTable, {
        id: BASELINE_CHECKPOINT_ID,
        isBaseline: true,
      })
      normalized = {
        ...normalized,
        checkpoints: { [baseline.id]: baseline, ...normalized.checkpoints },
        checkpointOrder: [baseline.id, ...normalized.checkpointOrder],
      }
    }
  }

  if (!normalized.checkpoints[normalized.activeCheckpointId]) {
    normalized = {
      ...normalized,
      activeCheckpointId: defaultActiveCheckpointId(normalized),
    }
  }

  return normalized
}

export function migrateCatalogProject(project: unknown): TableProject {
  if (isLegacyTableProject(project)) {
    return migrateLegacyProject(project)
  }
  if (isLegacyWorkingTableProject(project)) {
    return normalizeV3Project(convertFromWorkingTableProject(project))
  }
  if (
    typeof project === 'object' &&
    project !== null &&
    'dirtyTable' in project
  ) {
    return normalizeV3Project(project as TableProject)
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
