import { useState } from 'react'
import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import { formatExpansionCountIssue } from '../schema/expansionCountValidation'
import { getCellLatex } from '../diagram/utils'
import { mergeExpansionCountAfterEdit } from '../expansion/expansionCountDisplay'
import { useTableStore } from '../store/tableStore'
import { CombineHeadersDialog } from './CombineHeadersDialog'
import {
  DiagramEditorDialog,
  type DiagramEditorTarget,
} from './DiagramEditorDialog'
import { resolveTableEditFocus } from './tableCellStyles'
import { CharacterTableBody } from './characterTable/CharacterTableBody'
import { CharacterTableHead } from './characterTable/CharacterTableHead'
import { SelectionToolbar } from './characterTable/SelectionToolbar'
import { stickyTableStyle } from './characterTable/layoutConstants'
import { useCharacterTableLayout } from './characterTable/useCharacterTableLayout'
import { useTableSelection } from './characterTable/useTableSelection'

type EditableCharacterTableViewProps = {
  table: CharacterTable
  compactMath?: boolean
}

type EditingCell = { row: number; col: number } | null
type EditingExpansionCount = { axis: 'row' | 'column'; index: number } | null

export function EditableCharacterTableView({
  table,
  compactMath = false,
}: EditableCharacterTableViewProps) {
  const dispatchOp = useTableStore((s) => s.dispatchOp)
  const insertRow = useTableStore((s) => s.insertRow)
  const removeRows = useTableStore((s) => s.removeRows)
  const insertColumn = useTableStore((s) => s.insertColumn)
  const removeColumns = useTableStore((s) => s.removeColumns)
  const applyCombineHeaders = useTableStore((s) => s.applyCombineHeaders)
  const setRowHeader = useTableStore((s) => s.setRowHeader)
  const setColumnHeader = useTableStore((s) => s.setColumnHeader)

  const layout = useCharacterTableLayout(table, compactMath)
  const selection = useTableSelection(table)

  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editingExpansionCount, setEditingExpansionCount] =
    useState<EditingExpansionCount>(null)
  const [editingClassSize, setEditingClassSize] = useState<number | null>(null)
  const [diagramEditor, setDiagramEditor] = useState<DiagramEditorTarget | null>(
    null,
  )
  const [showCombineDialog, setShowCombineDialog] = useState(false)
  const [combineAxis, setCombineAxis] = useState<'rows' | 'columns'>('rows')

  const clearInlineEdits = () => {
    setEditingCell(null)
    setEditingExpansionCount(null)
    setEditingClassSize(null)
  }

  const openDiagramEditor = (target: DiagramEditorTarget) => {
    selection.setSelectedRows(new Set())
    selection.setSelectedColumns(new Set())
    clearInlineEdits()
    setDiagramEditor(target)
  }

  const editFocus = resolveTableEditFocus({
    diagramEditor,
    editingCell,
    editingClassSize,
    editingExpansionCount,
  })

  const showColumnSelection = !diagramEditor

  const headersEqual = (a: HeaderSpec, b: HeaderSpec) =>
    JSON.stringify(a) === JSON.stringify(b)

  const commitCell = (row: number, col: number, after: string) => {
    const before = getCellLatex(table, row, col)
    if (before !== after) {
      dispatchOp({ op: 'setCell', row, col, before, after })
    }
    setEditingCell(null)
  }

  const commitExpansionCount = (
    axis: 'row' | 'column',
    index: number,
    committed: string,
  ) => {
    const before =
      axis === 'row' ? table.rows[index]! : table.columns[index]!
    const after = mergeExpansionCountAfterEdit(before, committed)
    if (!headersEqual(before, after)) {
      if (axis === 'row') {
        setRowHeader(index, after)
      } else {
        setColumnHeader(index, after)
      }
    }
    setEditingExpansionCount(null)
  }

  const commitClassSize = (colIndex: number, committed: string) => {
    const before = table.columns[colIndex]!
    const trimmed = committed.trim()
    const after: HeaderSpec = trimmed
      ? { ...before, classSize: trimmed }
      : (({ classSize: _, ...rest }) => rest)(before)
    if (!headersEqual(before, after)) {
      setColumnHeader(colIndex, after)
    }
    setEditingClassSize(null)
  }

  const startMatrixEdit = (row: number, col: number) => {
    setDiagramEditor(null)
    clearInlineEdits()
    setEditingCell({ row, col })
  }

  const startClassSizeEdit = (colIndex: number) => {
    setDiagramEditor(null)
    clearInlineEdits()
    setEditingClassSize(colIndex)
  }

  const startExpansionEdit = (
    axis: 'row' | 'column',
    index: number,
  ) => {
    setDiagramEditor(null)
    clearInlineEdits()
    setEditingExpansionCount({ axis, index })
  }

  const openCombineDialog = (axis: 'rows' | 'columns') => {
    setCombineAxis(axis)
    setShowCombineDialog(true)
  }

  const rowActions = {
    insertAbove: (index: number) => insertRow(index, 'above'),
    insertBelow: (index: number) => insertRow(index, 'below'),
    deleteRows: (indices: number[]) => removeRows(indices),
    combineRows: () => openCombineDialog('rows'),
  }

  const columnActions = {
    insertBefore: (index: number) => insertColumn(index, 'before'),
    insertAfter: (index: number) => insertColumn(index, 'after'),
    deleteColumns: (indices: number[]) => removeColumns(indices),
    combineColumns: () => openCombineDialog('columns'),
  }

  return (
    <div className="relative w-max max-w-full">
      <SelectionToolbar
        table={table}
        selection={selection}
        rowActions={rowActions}
        columnActions={columnActions}
      />

      <div className="overflow-auto">
        <div className="inline-block w-max max-w-full">
          {layout.expansionCountIssues.length > 0 && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              <p className="font-medium">
                expansionCount required for restricted headers
              </p>
              <ul className="mt-1 list-inside list-disc">
                {layout.expansionCountIssues.map((issue) => (
                  <li key={`${issue.target}-${issue.index}`}>
                    {formatExpansionCountIssue(issue)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <table
            className="character-table w-max border-collapse text-sm"
            style={stickyTableStyle(layout.sticky)}
          >
            <colgroup>
              <col style={{ width: 'var(--sheet-gutter-w)' }} />
              {layout.layout.showChoicesColumn && (
                <col
                  style={{
                    width: layout.sticky.expansion,
                    minWidth: layout.sticky.expansion,
                    maxWidth: layout.sticky.expansion,
                  }}
                />
              )}
              <col
                style={{
                  width: layout.sticky.diagram,
                  minWidth: layout.sticky.diagram,
                  maxWidth: layout.sticky.diagram,
                }}
              />
              {layout.columnMinWidths.map((minWidth, i) => (
                <col
                  key={i}
                  style={minWidth != null ? { minWidth } : undefined}
                />
              ))}
            </colgroup>
            <CharacterTableHead
              table={table}
              compactMath={compactMath}
              layout={layout}
              selection={selection}
              columnActions={columnActions}
              editFocus={editFocus}
              diagramEditor={diagramEditor}
              showColumnSelection={showColumnSelection}
              onOpenDiagramEditor={openDiagramEditor}
              onStartClassSizeEdit={startClassSizeEdit}
              onCommitClassSize={commitClassSize}
              onCancelClassSize={() => setEditingClassSize(null)}
              onStartExpansionEdit={(axis, index) =>
                startExpansionEdit(axis, index)
              }
              onCommitExpansionCount={(axis, index, value) =>
                commitExpansionCount(axis, index, value)
              }
              onCancelExpansionEdit={() => setEditingExpansionCount(null)}
            />
            <CharacterTableBody
              table={table}
              compactMath={compactMath}
              layout={layout}
              selection={selection}
              rowActions={rowActions}
              editFocus={editFocus}
              diagramEditor={diagramEditor}
              showColumnSelection={showColumnSelection}
              onOpenDiagramEditor={openDiagramEditor}
              onStartMatrixEdit={startMatrixEdit}
              onCommitCell={commitCell}
              onCancelMatrixEdit={() => setEditingCell(null)}
              onStartExpansionEdit={(axis, index) =>
                startExpansionEdit(axis, index)
              }
              onCommitExpansionCount={(axis, index, value) =>
                commitExpansionCount(axis, index, value)
              }
              onCancelExpansionEdit={() => setEditingExpansionCount(null)}
            />
          </table>
        </div>
      </div>

      {diagramEditor && (
        <DiagramEditorDialog
          table={table}
          target={diagramEditor}
          onSave={(updates) => {
            try {
              for (const u of updates) {
                if (u.axis === 'rows') {
                  setRowHeader(u.index, u.header)
                } else {
                  setColumnHeader(u.index, u.header)
                }
              }
              setDiagramEditor(null)
              return null
            } catch (err) {
              return err instanceof Error ? err.message : String(err)
            }
          }}
          onCancel={() => setDiagramEditor(null)}
        />
      )}

      {showCombineDialog && (
        <CombineHeadersDialog
          table={table}
          axis={combineAxis}
          indices={
            combineAxis === 'rows'
              ? selection.rowIndices
              : selection.colIndices
          }
          method={
            selection.superTable && combineAxis === 'rows' ? 'sum' : 'identical'
          }
          rowCombinePreview={
            combineAxis === 'rows' ? selection.rowCombinePreview : null
          }
          onConfirm={() => {
            const ids =
              combineAxis === 'rows'
                ? selection.rowIndices
                    .map((i) => table.rows[i]?.id)
                    .filter(Boolean)
                : selection.colIndices
                    .map((i) => table.columns[i]?.id)
                    .filter(Boolean)
            if (ids.length >= 2) {
              const method =
                selection.superTable && combineAxis === 'rows'
                  ? 'sum'
                  : 'identical'
              const needsManual = applyCombineHeaders({
                axis: combineAxis,
                sourceIds: ids as string[],
                method,
              })
              selection.clearSelection()
              if (needsManual) {
                setDiagramEditor(
                  needsManual.axis === 'rows'
                    ? { kind: 'row', index: needsManual.index }
                    : { kind: 'column', index: needsManual.index },
                )
              }
            }
            setShowCombineDialog(false)
          }}
          onCancel={() => setShowCombineDialog(false)}
        />
      )}
    </div>
  )
}
