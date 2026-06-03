import { z } from 'zod'
import type { TableProject } from '../types/tableProject'
import { migrateLegacyProject } from '../project/migrateProject'
import type { LegacyTableProject } from '../types/tableProject'
import { headerSpecSchema, parseCharacterTable } from './tableSchema'

const headerSplitChildSchema = z.object({
  id: z.string().min(1),
  header: headerSpecSchema,
})

const headerLineageSchema = z.object({
  parentIds: z.array(z.string().min(1)).optional(),
  childIds: z.array(z.string().min(1)).optional(),
})

const transformStepSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('stripBelowArcs'),
    axis: z.enum(['rows', 'columns', 'both']),
    at: z.string().min(1),
    resultStage: z.string().min(1).optional(),
  }),
  z.object({
    op: z.literal('sumOverLabels'),
    at: z.string().min(1),
    resultStage: z.string().min(1).optional(),
  }),
  z.object({
    op: z.literal('splitHeader'),
    axis: z.enum(['rows', 'columns']),
    sourceId: z.string().min(1),
    belowLabel: z.string().min(1),
    children: z.array(headerSplitChildSchema).length(2),
    at: z.string().min(1),
    resultStage: z.string().min(1).optional(),
  }),
  z.object({
    op: z.literal('combineHeaders'),
    axis: z.enum(['rows', 'columns']),
    sourceIds: z.array(z.string().min(1)).min(1),
    resultId: z.string().min(1),
    method: z.enum(['sum', 'identical']),
    at: z.string().min(1),
    resultStage: z.string().min(1).optional(),
  }),
])

const checkpointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  table: z.unknown(),
  createdAt: z.string().min(1),
})

const editHistorySchema = z.object({
  past: z.array(z.unknown()).default([]),
  future: z.array(z.unknown()).default([]),
})

const projectMetaV1Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  currentStage: z.string().min(1),
  stageOrder: z.array(z.string().min(1)).optional(),
  transformLog: z.array(transformStepSchema).default([]),
  lineage: z.record(z.string(), headerLineageSchema).default({}),
})

const projectMetaV2Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  activeCheckpointId: z.string().min(1).nullable().default(null),
  checkpointOrder: z.array(z.string().min(1)).default([]),
  transformLog: z.array(transformStepSchema).default([]),
  lineage: z.record(z.string(), headerLineageSchema).default({}),
  history: editHistorySchema.optional(),
})

export const tableProjectBundleV1Schema = z.object({
  version: z.literal(1),
  project: projectMetaV1Schema,
  stages: z.record(z.string().min(1), z.unknown()).refine(
    (stages) => Object.keys(stages).length > 0,
    { message: 'stages must contain at least one entry' },
  ),
})

export const tableProjectBundleV2Schema = z.object({
  version: z.literal(2),
  project: projectMetaV2Schema,
  workingTable: z.unknown(),
  checkpoints: z.record(z.string().min(1), checkpointSchema).default({}),
})

function normalizeStageOrder(
  stageOrder: string[] | undefined,
  stageNames: string[],
): string[] {
  const order: string[] = []
  const seen = new Set<string>()

  for (const name of stageOrder ?? stageNames) {
    if (!stageNames.includes(name) || seen.has(name)) {
      continue
    }
    order.push(name)
    seen.add(name)
  }

  for (const name of stageNames) {
    if (!seen.has(name)) {
      order.push(name)
      seen.add(name)
    }
  }

  return order
}

function parseV1Bundle(json: z.infer<typeof tableProjectBundleV1Schema>): TableProject {
  const stageNames = Object.keys(json.stages)

  if (!stageNames.includes(json.project.currentStage)) {
    throw new Error(
      `currentStage "${json.project.currentStage}" not found in stages`,
    )
  }

  const stages: LegacyTableProject['stages'] = {}
  for (const [name, raw] of Object.entries(json.stages)) {
    stages[name] = parseCharacterTable(raw)
  }

  const stageOrder = normalizeStageOrder(json.project.stageOrder, stageNames)

  return migrateLegacyProject({
    id: json.project.id,
    title: json.project.title,
    currentStage: json.project.currentStage,
    stageOrder,
    stages,
    transformLog: json.project.transformLog,
    lineage: json.project.lineage,
  })
}

function parseV2Bundle(json: z.infer<typeof tableProjectBundleV2Schema>): TableProject {
  const checkpoints: TableProject['checkpoints'] = {}
  for (const [id, raw] of Object.entries(json.checkpoints)) {
    checkpoints[id] = {
      id: raw.id,
      name: raw.name,
      parentId: raw.parentId,
      table: parseCharacterTable(raw.table),
      createdAt: raw.createdAt,
    }
  }

  return {
    id: json.project.id,
    title: json.project.title,
    workingTable: parseCharacterTable(json.workingTable),
    activeCheckpointId: json.project.activeCheckpointId,
    checkpoints,
    checkpointOrder: json.project.checkpointOrder,
    history: { past: [], future: [] },
    transformLog: json.project.transformLog,
    lineage: json.project.lineage,
  }
}

export function parseTableProject(json: unknown): TableProject {
  const v2 = tableProjectBundleV2Schema.safeParse(json)
  if (v2.success) {
    return parseV2Bundle(v2.data)
  }

  const v1 = tableProjectBundleV1Schema.parse(json)
  return parseV1Bundle(v1)
}

export function projectToBundle(project: TableProject): {
  version: 2
  project: {
    id: string
    title: string
    activeCheckpointId: string | null
    checkpointOrder: string[]
    transformLog: TableProject['transformLog']
    lineage: TableProject['lineage']
  }
  workingTable: unknown
  checkpoints: Record<string, unknown>
} {
  return {
    version: 2,
    project: {
      id: project.id,
      title: project.title,
      activeCheckpointId: project.activeCheckpointId,
      checkpointOrder: project.checkpointOrder,
      transformLog: project.transformLog,
      lineage: project.lineage,
    },
    workingTable: project.workingTable,
    checkpoints: project.checkpoints,
  }
}

export function isProjectBundle(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false
  }
  const obj = json as Record<string, unknown>
  if (!('version' in obj) || !('project' in obj)) {
    return false
  }
  return 'stages' in obj || 'workingTable' in obj
}
