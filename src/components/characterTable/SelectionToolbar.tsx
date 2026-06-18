import type { CharacterTable } from '../../types/characterTable'
import type { TableSelection } from './useTableSelection'
import type { ColumnTableActions, RowTableActions } from './tableActions'

type SelectionToolbarProps = {
  table: CharacterTable
  selection: TableSelection
  rowActions: RowTableActions
  columnActions: ColumnTableActions
}

const toolbarButtonClass =
  'rounded bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'

const dangerButtonClass =
  'rounded bg-white px-2 py-1 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-40'

const combineButtonClass =
  'rounded bg-slate-800 px-2 py-1 font-medium text-white hover:bg-slate-700'

export function SelectionToolbar({
  table,
  selection,
  rowActions,
  columnActions,
}: SelectionToolbarProps) {
  const {
    selectedRows,
    selectedColumns,
    rowIndices,
    colIndices,
    canCombineRows,
    canCombineColumns,
    canSplitRows,
    canSplitColumns,
    rowCombineWarning,
    primaryRow,
    clearSelection,
  } = selection

  if (selectedRows.size === 0 && selectedColumns.size === 0) {
    return null
  }

  return (
    <div className="inline-flex w-max max-w-full flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
      {selectedRows.size > 0 && (
        <>
          <span className="font-medium text-slate-700">
            {selectedRows.size} row{selectedRows.size === 1 ? '' : 's'} selected
          </span>
          {primaryRow != null && (
            <>
              <button
                type="button"
                onClick={() => rowActions.insertAbove(primaryRow)}
                className={toolbarButtonClass}
              >
                Insert above
              </button>
              <button
                type="button"
                onClick={() => rowActions.insertBelow(primaryRow)}
                className={toolbarButtonClass}
              >
                Insert below
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => rowActions.deleteRows(rowIndices)}
            disabled={table.rows.length <= selectedRows.size}
            className={dangerButtonClass}
          >
            Delete row{selectedRows.size === 1 ? '' : 's'}
          </button>
          {canCombineRows && (
            <>
              <button
                type="button"
                onClick={rowActions.combineRows}
                className={combineButtonClass}
              >
                Combine rows
              </button>
              {rowCombineWarning && (
                <span className="text-amber-800">{rowCombineWarning}</span>
              )}
            </>
          )}
          {canSplitRows && (
            <button
              type="button"
              onClick={rowActions.splitRows}
              className={combineButtonClass}
            >
              Split row
            </button>
          )}
        </>
      )}
      {selectedColumns.size > 0 && (
        <>
          <span className="font-medium text-slate-700">
            {selectedColumns.size} col{selectedColumns.size === 1 ? '' : 's'}{' '}
            selected
          </span>
          {colIndices[0] != null && (
            <>
              <button
                type="button"
                onClick={() => columnActions.insertBefore(colIndices[0]!)}
                className={toolbarButtonClass}
              >
                Insert column before
              </button>
              <button
                type="button"
                onClick={() => columnActions.insertAfter(colIndices[0]!)}
                className={toolbarButtonClass}
              >
                Insert column after
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => columnActions.deleteColumns(colIndices)}
            disabled={table.columns.length <= selectedColumns.size}
            className={dangerButtonClass}
          >
            Delete col{selectedColumns.size === 1 ? '' : 's'}
          </button>
          {canCombineColumns && (
            <button
              type="button"
              onClick={columnActions.combineColumns}
              className={combineButtonClass}
            >
              Combine columns
            </button>
          )}
          {canSplitColumns && (
            <button
              type="button"
              onClick={columnActions.splitColumns}
              className={combineButtonClass}
            >
              Split column
            </button>
          )}
        </>
      )}
      <button
        type="button"
        onClick={clearSelection}
        className="ml-auto text-slate-500 hover:text-slate-700"
      >
        Clear selection
      </button>
    </div>
  )
}
