import type { CharacterTable } from '../types/characterTable'
import type { HeaderSplitChild } from '../types/tableProject'
import { ensureHeaderIds, headerById, type HeaderAxis } from '../diagram/headerIds'

export function splitHeaderInTable(
  table: CharacterTable,
  axis: HeaderAxis,
  sourceId: string,
  children: HeaderSplitChild[],
): CharacterTable {
  if (children.length !== 2) {
    throw new Error('splitHeader requires exactly two children')
  }

  const found = headerById(table, axis, sourceId)
  if (!found) {
    throw new Error(`header id "${sourceId}" not found in ${axis}`)
  }

  const index = found.index
  const headers = table[axis]
  const childHeaders = children.map((c) => ({
    ...c.header,
    id: c.id,
  }))

  const nextHeaders = [
    ...headers.slice(0, index),
    ...childHeaders,
    ...headers.slice(index + 1),
  ]

  let nextMatrix: string[][]
  if (axis === 'columns') {
    nextMatrix = table.matrix.map((row) => {
      const cell = row[index] ?? '0'
      return [
        ...row.slice(0, index),
        cell,
        cell,
        ...row.slice(index + 1),
      ]
    })
  } else {
    const sourceRow = table.matrix[index] ?? []
    const rowA = [...sourceRow]
    const rowB = [...sourceRow]
    nextMatrix = [
      ...table.matrix.slice(0, index),
      rowA,
      rowB,
      ...table.matrix.slice(index + 1),
    ]
  }

  return ensureHeaderIds({
    ...table,
    [axis]: nextHeaders,
    matrix: nextMatrix,
  })
}
