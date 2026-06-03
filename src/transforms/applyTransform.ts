import type { CharacterTable } from '../types/characterTable'
import type { HeaderLineage, TransformStep } from '../types/tableProject'
import { validateExpansionCounts } from '../schema/expansionCountValidation'
import { validateMatrixDimensions } from '../diagram/utils'
import { buildBelowLabelSplitChildren } from './splitBelowLabel'
import { splitHeaderInTable } from './splitHeader'

export type ApplyTransformResult = {
  table: CharacterTable
  lineageUpdates: Record<string, HeaderLineage>
}

export function applyTransformToTable(
  table: CharacterTable,
  step: TransformStep,
): ApplyTransformResult {
  switch (step.op) {
    case 'splitHeader':
      return applySplitHeader(table, step)
    default:
      throw new Error(`transform "${step.op}" is not implemented yet`)
  }
}

function applySplitHeader(
  table: CharacterTable,
  step: Extract<TransformStep, { op: 'splitHeader' }>,
): ApplyTransformResult {
  const found = table[step.axis].find((h) => h.id === step.sourceId)
  if (!found) {
    throw new Error(
      `source header "${step.sourceId}" not found in ${step.axis}`,
    )
  }

  const split =
    step.children.length === 2
      ? {
          belowLabel: step.belowLabel,
          children: step.children.map((c) => ({
            id: c.id,
            header: c.header,
          })),
        }
      : buildBelowLabelSplitChildren(found, step.belowLabel, table)

  if (split.children.length !== 2) {
    throw new Error('splitHeader requires exactly two children')
  }

  const children = split.children.map((c) => ({
    id: c.id,
    header: { ...c.header, id: c.id },
  }))

  const newTable = splitHeaderInTable(
    table,
    step.axis,
    step.sourceId,
    children,
  )

  validateMatrixDimensions(newTable)
  validateExpansionCounts(newTable)

  const childIds = children.map((c) => c.id)
  const lineageUpdates: Record<string, HeaderLineage> = {
    [step.sourceId]: { childIds },
  }
  for (const id of childIds) {
    lineageUpdates[id] = { parentIds: [step.sourceId] }
  }

  return { table: newTable, lineageUpdates }
}

export function buildSplitHeaderStep(
  table: CharacterTable,
  args: {
    axis: 'rows' | 'columns'
    sourceId: string
    belowLabel: string
    at: string
    resultStage?: string
  },
): Extract<TransformStep, { op: 'splitHeader' }> {
  const found = table[args.axis].find((h) => h.id === args.sourceId)
  if (!found) {
    throw new Error(`header "${args.sourceId}" not found`)
  }
  const split = buildBelowLabelSplitChildren(
    found,
    args.belowLabel,
    table,
  )
  return {
    op: 'splitHeader',
    axis: args.axis,
    sourceId: args.sourceId,
    belowLabel: args.belowLabel,
    children: split.children,
    at: args.at,
    resultStage: args.resultStage,
  }
}
