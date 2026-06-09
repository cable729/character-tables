import type { CharacterTable } from '../types/characterTable'
import { sumQPolynomialLatex } from '../expansion/qPolynomial'

export type IdenticalColumnGroup = {
  start: number
  length: number
}

export type SupercharacterRowCombinePreview = {
  canCombine: boolean
  sumFailed: boolean
  summedRow: string[] | null
  previewMatrix: string[][] | null
  identicalColumnGroups: IdenticalColumnGroup[]
  warning: string | null
}

function columnSignature(matrix: string[][], colIndex: number): string {
  return JSON.stringify(matrix.map((row) => row[colIndex] ?? '0'))
}

export function findMaximalContiguousIdenticalColumnGroups(
  matrix: string[][],
): IdenticalColumnGroup[] {
  const nCols = matrix[0]?.length ?? 0
  if (nCols === 0) {
    return []
  }

  const groups: IdenticalColumnGroup[] = []
  let start = 0
  let currentSig = columnSignature(matrix, 0)

  for (let j = 1; j <= nCols; j++) {
    const sig =
      j < nCols ? columnSignature(matrix, j) : null
    if (sig !== currentSig) {
      const length = j - start
      if (length > 1) {
        groups.push({ start, length })
      }
      start = j
      currentSig = sig ?? ''
    }
  }

  return groups
}

export function previewSupercharacterRowCombine(
  table: CharacterTable,
  rowIndices: number[],
): SupercharacterRowCombinePreview {
  const k = rowIndices.length
  const empty: SupercharacterRowCombinePreview = {
    canCombine: false,
    sumFailed: false,
    summedRow: null,
    previewMatrix: null,
    identicalColumnGroups: [],
    warning: null,
  }

  if (k < 2) {
    return empty
  }

  const sorted = [...rowIndices].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! !== 1) {
      return empty
    }
  }

  const minIndex = sorted[0]!
  const nCols = table.columns.length

  let summedRow: string[]
  try {
    summedRow = []
    for (let j = 0; j < nCols; j++) {
      const cells = sorted.map((i) => table.matrix[i]?.[j] ?? '0')
      summedRow.push(sumQPolynomialLatex(cells))
    }
  } catch {
    return { ...empty, sumFailed: true }
  }

  const previewMatrix = table.matrix.map((row, rowIndex) => {
    if (rowIndex === minIndex) {
      return summedRow
    }
    if (rowIndex > minIndex && rowIndex < minIndex + k) {
      return null as unknown as string[]
    }
    return [...row]
  }).filter((row): row is string[] => row != null)

  const identicalColumnGroups =
    findMaximalContiguousIdenticalColumnGroups(previewMatrix)

  const maxGroupLength = identicalColumnGroups.reduce(
    (max, g) => Math.max(max, g.length),
    0,
  )
  const hasEligibleGroup = identicalColumnGroups.some((g) => g.length >= k)

  let warning: string | null = null
  if (hasEligibleGroup && maxGroupLength > k) {
    warning = `${maxGroupLength} identical adjacent columns found; expected ${k} for ${k} merged rows.`
  }

  return {
    canCombine: hasEligibleGroup,
    sumFailed: false,
    summedRow,
    previewMatrix,
    identicalColumnGroups,
    warning,
  }
}

export function canSupercharacterCombineColumns(
  table: CharacterTable,
  colIndices: number[],
): boolean {
  if (colIndices.length < 2) {
    return false
  }
  const sorted = [...colIndices].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! !== 1) {
      return false
    }
  }
  const slices = sorted.map((colIndex) =>
    table.matrix.map((row) => row[colIndex] ?? '0'),
  )
  const first = slices[0]!
  return slices.every(
    (slice) =>
      slice.length === first.length &&
      slice.every((cell, i) => cell === first[i]),
  )
}
