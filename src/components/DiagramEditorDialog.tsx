import { useEffect, useMemo, useState } from 'react'
import type { CharacterTable, Diagram, HeaderSpec } from '../types/characterTable'
import { headerFromDiagram, headerToDiagram, inferN } from '../diagram/utils'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { isSupercharacterTable } from '../schema/tableSchema'
import { EditableArcDiagram } from './EditableArcDiagram'

export type DiagramEditorTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'column'; index: number }
  | { kind: 'row'; index: number }

type DiagramEditorDialogProps = {
  table: CharacterTable
  target: DiagramEditorTarget
  onSave: (
    updates: Array<{ axis: 'rows' | 'columns'; index: number; header: HeaderSpec }>,
  ) => string | null
  onCancel: () => void
}

type TabId = 'column' | 'row'

function cloneHeader(h: HeaderSpec): HeaderSpec {
  return structuredClone(h)
}

function headersEqual(a: HeaderSpec, b: HeaderSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function mergeHeaderFromDiagram(spec: HeaderSpec, diagram: Diagram): HeaderSpec {
  return headerFromDiagram(
    {
      ...spec,
      expansionCount: spec.expansionCount,
      classSize: spec.classSize,
      id: spec.id,
    },
    diagram,
  )
}

export function DiagramEditorDialog({
  table,
  target,
  onSave,
  onCancel,
}: DiagramEditorDialogProps) {
  const n = inferN(table)
  const superTable = isSupercharacterTable(table)

  const initial = useMemo(() => {
    if (target.kind === 'cell') {
      const col = cloneHeader(table.columns[target.col] ?? {})
      const row = cloneHeader(table.rows[target.row] ?? {})
      return {
        colHeader: col,
        rowHeader: row,
        colDiagram: headerToDiagram(col, n),
        rowDiagram: headerToDiagram(row, n),
      }
    }
    if (target.kind === 'column') {
      const col = cloneHeader(table.columns[target.index] ?? {})
      return {
        colHeader: col,
        rowHeader: {} as HeaderSpec,
        colDiagram: headerToDiagram(col, n),
        rowDiagram: { n, arcs: [] } as Diagram,
      }
    }
    const row = cloneHeader(table.rows[target.index] ?? {})
    return {
      colHeader: {} as HeaderSpec,
      rowHeader: row,
      colDiagram: { n, arcs: [] } as Diagram,
      rowDiagram: headerToDiagram(row, n),
    }
  }, [table, target, n])

  const [activeTab, setActiveTab] = useState<TabId>(
    target.kind === 'row' ? 'row' : 'column',
  )
  const [colHeader, setColHeader] = useState(initial.colHeader)
  const [rowHeader, setRowHeader] = useState(initial.rowHeader)
  const [colDiagram, setColDiagram] = useState(initial.colDiagram)
  const [rowDiagram, setRowDiagram] = useState(initial.rowDiagram)
  const [saveError, setSaveError] = useState<string | null>(null)

  const showColumnTab =
    target.kind === 'cell' || target.kind === 'column'
  const showRowTab = target.kind === 'cell' || target.kind === 'row'

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const colIndex =
    target.kind === 'cell'
      ? target.col
      : target.kind === 'column'
        ? target.index
        : -1
  const rowIndex =
    target.kind === 'cell'
      ? target.row
      : target.kind === 'row'
        ? target.index
        : -1

  const title =
    target.kind === 'cell'
      ? `Arc patterns — row ${target.row + 1}, column ${target.col + 1}`
      : target.kind === 'column'
        ? `Edit column ${target.index + 1} diagram`
        : `Edit row ${target.index + 1} diagram`

  const handleColDiagramChange = (diagram: Diagram) => {
    setColDiagram(diagram)
    setColHeader((h) => ({
      ...h,
      restriction: diagram.restriction,
    }))
    setSaveError(null)
  }

  const handleRowDiagramChange = (diagram: Diagram) => {
    setRowDiagram(diagram)
    setRowHeader((h) => ({
      ...h,
      restriction: diagram.restriction,
    }))
    setSaveError(null)
  }

  const handleSave = () => {
    setSaveError(null)
    const updates: Array<{
      axis: 'rows' | 'columns'
      index: number
      header: HeaderSpec
    }> = []

    if (showColumnTab && colIndex >= 0) {
      const after = mergeHeaderFromDiagram(colHeader, colDiagram)
      const before = table.columns[colIndex]!
      if (!superTable && isExpansionCountMissing(after)) {
        setSaveError(
          'Set expansionCount (LaTeX) when a restriction is present, then save again.',
        )
        return
      }
      if (!headersEqual(before, after)) {
        updates.push({ axis: 'columns', index: colIndex, header: after })
      }
    }
    if (showRowTab && rowIndex >= 0) {
      const after = mergeHeaderFromDiagram(rowHeader, rowDiagram)
      const before = table.rows[rowIndex]!
      if (!superTable && isExpansionCountMissing(after)) {
        setSaveError(
          'Set expansionCount (LaTeX) when a restriction is present, then save again.',
        )
        return
      }
      if (!headersEqual(before, after)) {
        updates.push({ axis: 'rows', index: rowIndex, header: after })
      }
    }

    if (updates.length === 0) {
      onCancel()
      return
    }

    const err = onSave(updates)
    if (err) {
      setSaveError(err)
      return
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagram-editor-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h2
            id="diagram-editor-title"
            className="text-base font-semibold text-slate-900"
          >
            {title}
          </h2>
          {target.kind === 'cell' && (
            <p className="mt-1 text-xs text-slate-500">
              Double-click a cell to edit patterns. Column and row headers are
              edited separately.
            </p>
          )}
        </div>

        {showColumnTab && showRowTab && (
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'column'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('column')}
            >
              Column {colIndex + 1}
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'row'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('row')}
            >
              Row {rowIndex + 1}
            </button>
          </div>
        )}

        <div className="overflow-y-auto px-4 py-4">
          {showColumnTab && (!showRowTab || activeTab === 'column') && (
            <EditableArcDiagram
              diagram={colDiagram}
              onDiagramChange={handleColDiagramChange}
              showArcLabels
              showExpansionCountField={!superTable}
              expansionCount={colHeader.expansionCount}
              onExpansionCountChange={(value) => {
                setColHeader({ ...colHeader, expansionCount: value || undefined })
                setSaveError(null)
              }}
            />
          )}
          {showRowTab && (!showColumnTab || activeTab === 'row') && (
            <EditableArcDiagram
              diagram={rowDiagram}
              onDiagramChange={handleRowDiagramChange}
              showArcLabels
              showExpansionCountField={!superTable}
              expansionCount={rowHeader.expansionCount}
              onExpansionCountChange={(value) => {
                setRowHeader({ ...rowHeader, expansionCount: value || undefined })
                setSaveError(null)
              }}
            />
          )}
          {!superTable &&
            activeTab === 'column' &&
            isExpansionCountMissing({
              ...colHeader,
              restriction: colDiagram.restriction,
            }) && (
              <p className="mt-2 text-xs text-amber-700">
                Set expansionCount when a restriction is present.
              </p>
            )}
          {saveError && (
            <p className="mt-2 text-xs text-red-700">{saveError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
