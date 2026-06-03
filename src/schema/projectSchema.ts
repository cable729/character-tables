import { z } from 'zod'
import type { TableProject } from '../types/tableProject'
import { parseCharacterTable } from './tableSchema'

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
    intoIds: z.array(z.string().min(1)).min(1),
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

const projectMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  currentStage: z.string().min(1),
  stageOrder: z.array(z.string().min(1)).optional(),
  transformLog: z.array(transformStepSchema).default([]),
  lineage: z.record(z.string(), headerLineageSchema).default({}),
})

export const tableProjectBundleSchema = z.object({
  version: z.literal(1),
  project: projectMetaSchema,
  stages: z.record(z.string().min(1), z.unknown()).refine(
    (stages) => Object.keys(stages).length > 0,
    { message: 'stages must contain at least one entry' },
  ),
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

export function parseTableProject(json: unknown): TableProject {
  const bundle = tableProjectBundleSchema.parse(json)
  const stageNames = Object.keys(bundle.stages)

  if (!stageNames.includes(bundle.project.currentStage)) {
    throw new Error(
      `currentStage "${bundle.project.currentStage}" not found in stages`,
    )
  }

  const stages: TableProject['stages'] = {}
  for (const [name, raw] of Object.entries(bundle.stages)) {
    stages[name] = parseCharacterTable(raw)
  }

  const stageOrder = normalizeStageOrder(bundle.project.stageOrder, stageNames)

  return {
    id: bundle.project.id,
    title: bundle.project.title,
    currentStage: bundle.project.currentStage,
    stageOrder,
    stages,
    transformLog: bundle.project.transformLog,
    lineage: bundle.project.lineage,
  }
}

export function projectToBundle(project: TableProject): {
  version: 1
  project: Omit<TableProject, 'stages'> & { stageOrder: string[] }
  stages: Record<string, unknown>
} {
  return {
    version: 1,
    project: {
      id: project.id,
      title: project.title,
      currentStage: project.currentStage,
      stageOrder: project.stageOrder,
      transformLog: project.transformLog,
      lineage: project.lineage,
    },
    stages: project.stages,
  }
}

export function isProjectBundle(json: unknown): boolean {
  return (
    typeof json === 'object' &&
    json !== null &&
    'stages' in json &&
    'project' in json &&
    'version' in json
  )
}
