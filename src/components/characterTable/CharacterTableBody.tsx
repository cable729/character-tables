import { useEffect, useState } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import { getCellLatex, headerToDiagram } from '../../diagram/utils'
import {
  displayExpansionCountLatex,
  hasExplicitExpansionCount,
} from '../../expansion/expansionCountDisplay'
import { RowColHeader } from '../ArcDiagram'
import { EditableCell } from '../EditableCell'
import { SheetRowHeader } from '../grid/SheetHeaders'
import {
  diagramHeaderCellClasses,
  editableLatexCellHost,
  isDiagramRowActive,
  isExpansionCellActive,
  isMatrixCellActive,
  type TableEditFocus,
} from '../tableCellStyles'
import type { DiagramEditorTarget } from '../DiagramEditorDialog'
import type { CharacterTableLayout } from './useCharacterTableLayout'
import type { TableSelection } from './useTableSelection'
import { rowMenuItems, type RowTableActions } from './tableActions'
import {
  appendControlButtonClass,
  diagramStickyStyle,
  stickyDiagram,
  stickyExpansion,
  thBase,
} from './layoutConstants'

type CharacterTableBodyProps = {
  table: CharacterTable
  compactMath: boolean
  layout: CharacterTableLayout
  selection: TableSelection
  rowActions: RowTableActions
  editFocus: TableEditFocus | null
  diagramEditor: DiagramEditorTarget | null
  showColumnSelection: boolean
  onOpenDiagramEditor: (target: DiagramEditorTarget) => void
  onStartMatrixEdit: (row: number, col: number) => void
  onCommitCell: (row: number, col: number, value: string) => void
  onCancelMatrixEdit: () => void
  onStartExpansionEdit: (axis: 'row', index: number) => void
  onCommitExpansionCount: (axis: 'row', index: number, value: string) => void
  onCancelExpansionEdit: () => void
  readOnly?: boolean
}

export function CharacterTableBody({
  table,
  compactMath,
  layout: { n, layout, sticky, columnMinWidths, stickyLeft, headerDiagramWidth },
  selection,
  rowActions,
  editFocus,
  diagramEditor,
  showColumnSelection,
  onOpenDiagramEditor,
  onStartMatrixEdit,
  onCommitCell,
  onCancelMatrixEdit,
  onStartExpansionEdit,
  onCommitExpansionCount,
  onCancelExpansionEdit,
  readOnly = false,
}: CharacterTableBodyProps) {
  const [openRowMenu, setOpenRowMenu] = useState<number | null>(null)

  useEffect(() => {
    if (diagramEditor) {
      setOpenRowMenu(null)
    }
  }, [diagramEditor])

  const columnIndexSelected = (colIndex: number) =>
    showColumnSelection && selection.selectedColumns.has(colIndex)

  return (
    <tbody>
      {table.rows.map((row, rowIndex) => (
        <tr
          key={rowIndex}
          className={`group hover:bg-slate-50/50 ${
            selection.selectedRows.has(rowIndex) ? 'bg-sky-50/60' : ''
          }`}
        >
          <SheetRowHeader
            rowIndex={rowIndex}
            selected={selection.selectedRows.has(rowIndex)}
            menuOpen={openRowMenu === rowIndex}
            onSelect={() => {
              setOpenRowMenu(null)
              selection.toggleRowSelection(rowIndex)
            }}
            onToggleMenu={() =>
              setOpenRowMenu((cur) => (cur === rowIndex ? null : rowIndex))
            }
            onCloseMenu={() => setOpenRowMenu(null)}
            menuItems={rowMenuItems(
              rowIndex,
              table,
              rowActions,
              selection.canCombineRows,
            )}
          />
          {layout.showChoicesColumn && (
            <th
              className={`${thBase} ${stickyExpansion} z-[var(--z-sticky)] text-[10px] group-hover:bg-slate-50 ${editableLatexCellHost(
                compactMath,
                isExpansionCellActive('row', rowIndex, editFocus),
              )}`}
              title="Number of characters this row expands to"
            >
              <EditableCell
                latex={displayExpansionCountLatex(row)}
                compact={compactMath}
                isEditing={isExpansionCellActive('row', rowIndex, editFocus)}
                columnWidthPx={sticky.expansion}
                title={
                  !hasExplicitExpansionCount(row)
                    ? `${displayExpansionCountLatex(row)} — calculated from arcs; click to override`
                    : `${displayExpansionCountLatex(row)} — click to edit`
                }
                onStartEdit={() => onStartExpansionEdit('row', rowIndex)}
                onCommit={(value) =>
                  onCommitExpansionCount('row', rowIndex, value)
                }
                onCancel={onCancelExpansionEdit}
              />
            </th>
          )}
          <th
            className={`${thBase} ${stickyDiagram} z-[var(--z-sticky)] p-0 align-middle group-hover:bg-slate-50 ${diagramHeaderCellClasses(
              isDiagramRowActive(rowIndex, editFocus),
            )}`}
            style={diagramStickyStyle(stickyLeft)}
          >
            <RowColHeader
              diagram={headerToDiagram(row, n)}
              diagramWidth={headerDiagramWidth}
              restrictionColumnWidthPx={sticky.diagram}
              compact={compactMath}
              showArcLabels={layout.showArcLabels}
              showRestriction={layout.showRestriction}
              onClick={() =>
                onOpenDiagramEditor({ kind: 'row', index: rowIndex })
              }
            />
          </th>
          {table.columns.map((_col, colIndex) => {
            const latex = getCellLatex(table, rowIndex, colIndex)
            const isEditing = isMatrixCellActive(rowIndex, colIndex, editFocus)
            return (
              <td
                key={colIndex}
                className={`border border-slate-200 bg-white ${editableLatexCellHost(
                  compactMath,
                  isEditing,
                )} ${
                  !isEditing &&
                  showColumnSelection &&
                  columnIndexSelected(colIndex)
                    ? 'bg-sky-50/50'
                    : ''
                }`}
              >
                <EditableCell
                  latex={latex}
                  compact={compactMath}
                  isEditing={isEditing}
                  columnWidthPx={columnMinWidths[colIndex]}
                  onStartEdit={() => onStartMatrixEdit(rowIndex, colIndex)}
                  onCommit={(value) => onCommitCell(rowIndex, colIndex, value)}
                  onCancel={onCancelMatrixEdit}
                />
              </td>
            )
          })}
        </tr>
      ))}
      {!readOnly && (
        <tr aria-label="Add row">
          <th
            className={`sheet-row-header sticky left-0 z-[var(--z-sticky-corner)] border border-slate-300 bg-slate-100 p-0`}
          >
            <button
              type="button"
              title="Add row"
              className={`${appendControlButtonClass} h-6 w-full min-h-6`}
              onClick={() => rowActions.insertBelow(table.rows.length - 1)}
            >
              +
            </button>
          </th>
          {layout.showChoicesColumn && (
            <th
              className="w-0 min-w-0 max-w-0 border-0 p-0"
              aria-hidden
            />
          )}
          <th
            className="w-0 min-w-0 max-w-0 border-0 p-0"
            aria-hidden
          />
          <td
            colSpan={table.columns.length}
            className="h-0 border-0 p-0 leading-[0]"
            aria-hidden
          />
        </tr>
      )}
    </tbody>
  )
}
