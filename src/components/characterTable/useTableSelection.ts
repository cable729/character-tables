import { useMemo, useState } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import { isSupercharacterTable } from '../../schema/tableSchema'
import {
  canSupercharacterCombineColumns,
  previewSupercharacterRowCombine,
} from '../../tableOps/supercharacterCombine'
import {
  areAdjacent,
  sortedIndices,
  toggleInSet,
} from './selectionUtils'

export function useTableSelection(table: CharacterTable) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set())

  const rowIndices = useMemo(() => sortedIndices(selectedRows), [selectedRows])
  const colIndices = useMemo(
    () => sortedIndices(selectedColumns),
    [selectedColumns],
  )

  const superTable = isSupercharacterTable(table)

  const rowCombinePreview = useMemo(() => {
    if (!superTable || rowIndices.length < 2 || !areAdjacent(rowIndices)) {
      return null
    }
    return previewSupercharacterRowCombine(table, rowIndices)
  }, [superTable, table, rowIndices])

  const canCombineRows = superTable
    ? rowCombinePreview?.canCombine === true
    : rowIndices.length >= 2 && areAdjacent(rowIndices)

  const rowCombineWarning = rowCombinePreview?.warning ?? null

  const canCombineColumns =
    colIndices.length >= 2 &&
    areAdjacent(colIndices) &&
    (superTable
      ? canSupercharacterCombineColumns(table, colIndices)
      : true)

  const primaryRow = rowIndices[0]

  const clearSelection = () => {
    setSelectedRows(new Set())
    setSelectedColumns(new Set())
  }

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRows(toggleInSet(selectedRows, rowIndex))
  }

  const toggleColumnSelection = (colIndex: number) => {
    setSelectedColumns(toggleInSet(selectedColumns, colIndex))
  }

  return {
    selectedRows,
    setSelectedRows,
    selectedColumns,
    setSelectedColumns,
    rowIndices,
    colIndices,
    canCombineRows,
    canCombineColumns,
    rowCombineWarning,
    rowCombinePreview,
    primaryRow,
    superTable,
    clearSelection,
    toggleRowSelection,
    toggleColumnSelection,
  }
}

export type TableSelection = ReturnType<typeof useTableSelection>
