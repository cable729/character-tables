import { useMemo, useState } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import { isSupercharacterTable } from '../../schema/tableSchema'
import {
  canSupercharacterCombineColumns,
  previewSupercharacterRowCombine,
} from '../../tableOps/supercharacterCombine'
import { headersWithBelow } from '../splitHeaderUtils'
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

  const canSplitRows =
    selectedRows.size === 1 &&
    selectedColumns.size === 0 &&
    rowIndices[0] != null &&
    headersWithBelow(table.rows).some((c) => c.index === rowIndices[0])

  const canSplitColumns =
    selectedColumns.size === 1 &&
    selectedRows.size === 0 &&
    colIndices[0] != null &&
    headersWithBelow(table.columns).some((c) => c.index === colIndices[0])

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
    canSplitRows,
    canSplitColumns,
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
