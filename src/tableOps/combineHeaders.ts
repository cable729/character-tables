import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import type { HeaderLineage } from '../types/tableProject'
import { ensureHeaderIds, headerById, type HeaderAxis } from '../diagram/headerIds'
import { sumQPolynomialLatex } from '../expansion/qPolynomial'
import {
  mergeSupercharacterHeaders,
  headersStructurallyEqual,
} from '../headers/mergeHeaders'
import { isSupercharacterTable } from '../schema/tableSchema'
import { validateExpansionCounts } from '../schema/expansionCountValidation'
import { validateMatrixDimensions } from '../diagram/utils'

function headersMatch(a: HeaderSpec, b: HeaderSpec): boolean {
  return headersStructurallyEqual(a, b)
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
  /** When set, open diagram editor on this header after combine. */
  needsManualDiagram?: { axis: HeaderAxis; index: number }
}

function resolveMergedHeader(
  table: CharacterTable,
  axis: HeaderAxis,
  headers: HeaderSpec[],
  indices: number[],
  resultId: string,
  sumClassSizes: boolean,
): { header: HeaderSpec; needsManual: boolean } {
  const n = table.n ?? 3
  if (!isSupercharacterTable(table)) {
    const first = headers[0]!
    for (const h of headers.slice(1)) {
      if (!headersMatch(first, h)) {
        throw new Error(
          'combineHeaders requires identical header specs for all sources',
        )
      }
    }
    return { header: { ...structuredClone(first), id: resultId }, needsManual: false }
  }

  const classSizes = sumClassSizes
    ? headers.map((h) => h.classSize).filter((s): s is string => Boolean(s))
    : undefined

  const merged = mergeSupercharacterHeaders(headers, n, {
    sumClassSizes: classSizes,
  })

  if (merged.status === 'ok') {
    const header: HeaderSpec = { ...merged.header, id: resultId }
    if (classSizes && classSizes.length > 0) {
      header.classSize = sumQPolynomialLatex(classSizes)
    }
    return { header, needsManual: false }
  }

  return {
    header: { ...merged.placeholder, id: resultId },
    needsManual: true,
  }
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

  const minIndex = sorted[0]!
  const count = indices.length
  const superTable = isSupercharacterTable(table)

  if (method === 'sum') {
    if (axis !== 'rows') {
      throw new Error('sum combine is only supported for rows')
    }
    if (!superTable) {
      throw new Error('sum combine requires a supercharacter table')
    }

    const nCols = table.columns.length
    const mergedCells: string[] = []
    for (let j = 0; j < nCols; j++) {
      const cells = sorted.map((i) => table.matrix[i]?.[j] ?? '0')
      mergedCells.push(sumQPolynomialLatex(cells))
    }

    const { header: mergedHeader, needsManual } = resolveMergedHeader(
      table,
      axis,
      headers,
      indices,
      resultId,
      false,
    )

    const nextHeaders = [...table.rows]
    nextHeaders.splice(minIndex, count, mergedHeader)
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
      needsManualDiagram: needsManual
        ? { axis: 'rows', index: minIndex }
        : undefined,
    }
  }

  const firstHeader = headers[0]!

  if (axis === 'rows') {
    const slices = indices.map((i) => table.matrix[i] ?? [])
    if (!slicesIdentical(slices)) {
      throw new Error('identical combine requires matching matrix rows')
    }

    const { header: mergedHeader, needsManual } = resolveMergedHeader(
      table,
      axis,
      headers,
      indices,
      resultId,
      false,
    )

    const mergedCells = [...(slices[0] ?? [])]
    const nextHeaders = [...table.rows]
    nextHeaders.splice(minIndex, count, mergedHeader)
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
      needsManualDiagram: needsManual
        ? { axis: 'rows', index: minIndex }
        : undefined,
    }
  }

  const colSlices = indices.map((colIndex) =>
    table.matrix.map((row) => row[colIndex] ?? '0'),
  )
  if (!slicesIdentical(colSlices)) {
    throw new Error('identical combine requires matching matrix columns')
  }

  const { header: mergedHeader, needsManual } = resolveMergedHeader(
    table,
    axis,
    headers,
    indices,
    resultId,
    superTable,
  )

  const nextColumns = [...table.columns]
  nextColumns.splice(minIndex, count, mergedHeader)
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
    needsManualDiagram: needsManual
      ? { axis: 'columns', index: minIndex }
      : undefined,
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
