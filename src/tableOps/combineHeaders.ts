import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import type { HeaderLineage } from '../types/tableProject'
import { ensureHeaderIds, headerById, type HeaderAxis } from '../diagram/headerIds'
import { validateExpansionCounts } from '../schema/expansionCountValidation'
import { validateMatrixDimensions } from '../diagram/utils'

function headersMatch(a: HeaderSpec, b: HeaderSpec): boolean {
  const stripId = (h: HeaderSpec) => {
    const { id: _id, ...rest } = h
    return rest
  }
  return JSON.stringify(stripId(a)) === JSON.stringify(stripId(b))
}

function slicesIdentical(slices: string[][]): boolean {
  if (slices.length <= 1) {
    return true
  }
  const first = slices[0]!
  return slices.every(
    (slice) =>
      slice.length === first.length &&
      slice.every((cell, i) => cell === first[i]),
  )
}

export type CombineHeadersResult = {
  table: CharacterTable
  lineageUpdates: Record<string, HeaderLineage>
}

export function combineHeadersInTable(
  table: CharacterTable,
  axis: HeaderAxis,
  sourceIds: string[],
  resultId: string,
  method: 'sum' | 'identical',
): CombineHeadersResult {
  if (sourceIds.length < 2) {
    throw new Error('combineHeaders requires at least two source headers')
  }

  if (method === 'sum') {
    throw new Error(
      'sum combine is not supported yet; use identical when headers and cells match',
    )
  }

  const indices: number[] = []
  const headers: HeaderSpec[] = []
  for (const id of sourceIds) {
    const found = headerById(table, axis, id)
    if (!found) {
      throw new Error(`header id "${id}" not found in ${axis}`)
    }
    indices.push(found.index)
    headers.push(found.header)
  }

  const sorted = [...indices].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! !== 1) {
      throw new Error('combineHeaders requires adjacent headers')
    }
  }

  const firstHeader = headers[0]!
  for (const h of headers.slice(1)) {
    if (!headersMatch(firstHeader, h)) {
      throw new Error(
        'combineHeaders requires identical header specs for all sources',
      )
    }
  }

  const minIndex = sorted[0]!
  const count = indices.length

  if (axis === 'rows') {
    const slices = indices.map((i) => table.matrix[i] ?? [])
    if (!slicesIdentical(slices)) {
      throw new Error('identical combine requires matching matrix rows')
    }
    const mergedCells = [...(slices[0] ?? [])]
    const nextHeaders = [...table.rows]
    nextHeaders.splice(minIndex, count, {
      ...structuredClone(firstHeader),
      id: resultId,
    })
    const nextMatrix = [...table.matrix]
    nextMatrix.splice(minIndex, count, mergedCells)
    const newTable = ensureHeaderIds({
      ...table,
      rows: nextHeaders,
      matrix: nextMatrix,
    })
    validateMatrixDimensions(newTable)
    validateExpansionCounts(newTable)
    return {
      table: newTable,
      lineageUpdates: buildLineage(sourceIds, resultId),
    }
  }

  const colSlices = indices.map((colIndex) =>
    table.matrix.map((row) => row[colIndex] ?? '0'),
  )
  if (!slicesIdentical(colSlices)) {
    throw new Error('identical combine requires matching matrix columns')
  }

  const nextColumns = [...table.columns]
  nextColumns.splice(minIndex, count, {
    ...structuredClone(firstHeader),
    id: resultId,
  })
  const nextMatrix = table.matrix.map((row) => [
    ...row.slice(0, minIndex),
    row[minIndex] ?? '0',
    ...row.slice(minIndex + count),
  ])

  const newTable = ensureHeaderIds({
    ...table,
    columns: nextColumns,
    matrix: nextMatrix,
  })
  validateMatrixDimensions(newTable)
  validateExpansionCounts(newTable)
  return {
    table: newTable,
    lineageUpdates: buildLineage(sourceIds, resultId),
  }
}

function buildLineage(
  sourceIds: string[],
  resultId: string,
): Record<string, HeaderLineage> {
  const updates: Record<string, HeaderLineage> = {
    [resultId]: { parentIds: [...sourceIds] },
  }
  for (const id of sourceIds) {
    updates[id] = { childIds: [resultId] }
  }
  return updates
}
