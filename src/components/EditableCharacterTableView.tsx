import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CharacterTable } from '../types/characterTable'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import { isSupercharacterTable } from '../schema/tableSchema'
import {
  getCellLatex,
  headerToDiagram,
  inferN,
} from '../diagram/utils'
import { useTableStore } from '../store/tableStore'
import { CombineHeadersDialog } from './CombineHeadersDialog'
import { EditableCell } from './EditableCell'
import { ExpansionCountCell } from './ExpansionCountCell'
import { MathCell } from './MathCell'
import { RowColHeader } from './ArcDiagram'
import {
  SheetColumnHeader,
  SheetCornerHeader,
  SheetRowCorner,
  SheetRowHeader,
  type HeaderMenuItem,
} from './grid/SheetHeaders'
import {
  dataColumnMinWidths,
  stickyColumnWidths,
  type StickyColumnWidths,
} from './tableColumnWidths'

type EditableCharacterTableViewProps = {
  table: CharacterTable
  compactMath?: boolean
}

type EditingCell = { row: number; col: number } | null

const OUTER_ROW_H = 28
const INNER_HEADER_TOP = OUTER_ROW_H * 2

const thBase =
  'border border-slate-200 bg-slate-50 text-center text-slate-600'

const stickyExpansion =
  'sticky-expansion-col sticky left-0 z-30 bg-slate-50'

const stickyDiagram = 'sticky-diagram-col sticky z-30 bg-slate-50'

function cellPad(compact: boolean): string {
  return compact ? 'px-1.5 py-1' : 'px-1.5 py-1'
}

function headerPad(compact: boolean): string {
  return compact ? 'px-1.5 py-1' : 'px-2 py-1'
}

function mathCellWrap(compact: boolean): string {
  return `overflow-hidden whitespace-nowrap text-center ${cellPad(compact)}`
}

function diagramStickyStyle(top?: number): CSSProperties {
  return top != null ? { top } : {}
}

function stickyTableStyle(sticky: StickyColumnWidths): CSSProperties {
  return {
    '--expansion-col-w': `${sticky.expansion}px`,
    '--diagram-col-w': `${sticky.diagram}px`,
  } as CSSProperties
}

function toggleInSet(set: Set<number>, index: number): Set<number> {
  const next = new Set(set)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  return next
}

function sortedIndices(set: Set<number>): number[] {
  return [...set].sort((a, b) => a - b)
}

function areAdjacent(indices: number[]): boolean {
  if (indices.length < 2) {
    return false
  }
  for (let i = 1; i < indices.length; i++) {
    if (indices[i]! - indices[i - 1]! !== 1) {
      return false
    }
  }
  return true
}

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

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set())
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [showCombineDialog, setShowCombineDialog] = useState(false)
  const [combineAxis, setCombineAxis] = useState<'rows' | 'columns'>('rows')
  const [openColumnMenu, setOpenColumnMenu] = useState<number | null>(null)
  const [openRowMenu, setOpenRowMenu] = useState<number | null>(null)

  const n = inferN(table)
  const superTable = isSupercharacterTable(table)
  const expansionCountIssues = superTable ? [] : findExpansionCountIssues(table)
  const columnMinWidths = dataColumnMinWidths(table, compactMath)
  const sticky = stickyColumnWidths(table, n, compactMath)
  const pad = cellPad(compactMath)
  const hPad = headerPad(compactMath)
  const wrap = mathCellWrap(compactMath)

  const rowIndices = useMemo(() => sortedIndices(selectedRows), [selectedRows])
  const colIndices = useMemo(
    () => sortedIndices(selectedColumns),
    [selectedColumns],
  )

  const canCombineRows =
    rowIndices.length >= 2 && areAdjacent(rowIndices)
  const canCombineColumns =
    colIndices.length >= 2 && areAdjacent(colIndices)

  const commitCell = (row: number, col: number, after: string) => {
    const before = getCellLatex(table, row, col)
    if (before !== after) {
      dispatchOp({ op: 'setCell', row, col, before, after })
    }
    setEditingCell(null)
  }

  const primaryRow = rowIndices[0]

  const columnMenuItems = (colIndex: number): HeaderMenuItem[] => [
    {
      id: 'insert-before',
      label: 'Insert column before',
      onSelect: () => insertColumn(colIndex, 'before'),
    },
    {
      id: 'insert-after',
      label: 'Insert column after',
      onSelect: () => insertColumn(colIndex, 'after'),
    },
    {
      id: 'delete',
      label: 'Delete column',
      disabled: table.columns.length <= 1,
      variant: 'danger',
      onSelect: () => removeColumns([colIndex]),
    },
    {
      id: 'combine',
      label: 'Combine selected columns',
      disabled: !canCombineColumns,
      onSelect: () => {
        setCombineAxis('columns')
        setShowCombineDialog(true)
      },
    },
  ]

  const rowMenuItems = (rowIndex: number): HeaderMenuItem[] => [
    {
      id: 'insert-above',
      label: 'Insert row above',
      onSelect: () => insertRow(rowIndex, 'above'),
    },
    {
      id: 'insert-below',
      label: 'Insert row below',
      onSelect: () => insertRow(rowIndex, 'below'),
    },
    {
      id: 'delete',
      label: 'Delete row',
      disabled: table.rows.length <= 1,
      variant: 'danger',
      onSelect: () => removeRows([rowIndex]),
    },
    {
      id: 'combine',
      label: 'Combine selected rows',
      disabled: !canCombineRows,
      onSelect: () => {
        setCombineAxis('rows')
        setShowCombineDialog(true)
      },
    },
  ]

  return (
    <div className="relative w-max max-w-full">
      {(selectedRows.size > 0 || selectedColumns.size > 0) && (
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
                    onClick={() => insertRow(primaryRow, 'above')}
                    className="rounded bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    Insert above
                  </button>
                  <button
                    type="button"
                    onClick={() => insertRow(primaryRow, 'below')}
                    className="rounded bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    Insert below
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => removeRows(rowIndices)}
                disabled={table.rows.length <= selectedRows.size}
                className="rounded bg-white px-2 py-1 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-40"
              >
                Delete row{selectedRows.size === 1 ? '' : 's'}
              </button>
              {canCombineRows && (
                <button
                  type="button"
                  onClick={() => {
                    setCombineAxis('rows')
                    setShowCombineDialog(true)
                  }}
                  className="rounded bg-slate-800 px-2 py-1 font-medium text-white hover:bg-slate-700"
                >
                  Combine rows
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
                    onClick={() => insertColumn(colIndices[0]!, 'before')}
                    className="rounded bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    Insert column before
                  </button>
                  <button
                    type="button"
                    onClick={() => insertColumn(colIndices[0]!, 'after')}
                    className="rounded bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    Insert column after
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => removeColumns(colIndices)}
                disabled={table.columns.length <= selectedColumns.size}
                className="rounded bg-white px-2 py-1 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-40"
              >
                Delete col{selectedColumns.size === 1 ? '' : 's'}
              </button>
              {canCombineColumns && (
                <button
                  type="button"
                  onClick={() => {
                    setCombineAxis('columns')
                    setShowCombineDialog(true)
                  }}
                  className="rounded bg-slate-800 px-2 py-1 font-medium text-white hover:bg-slate-700"
                >
                  Combine columns
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedRows(new Set())
              setSelectedColumns(new Set())
            }}
            className="ml-auto text-slate-500 hover:text-slate-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {showCombineDialog && (
        <CombineHeadersDialog
          table={table}
          axis={combineAxis}
          indices={combineAxis === 'rows' ? rowIndices : colIndices}
          onConfirm={() => {
            const ids =
              combineAxis === 'rows'
                ? rowIndices.map((i) => table.rows[i]?.id).filter(Boolean)
                : colIndices.map((i) => table.columns[i]?.id).filter(Boolean)
            if (ids.length >= 2) {
              applyCombineHeaders({
                axis: combineAxis,
                sourceIds: ids as string[],
                method: 'identical',
              })
              setSelectedRows(new Set())
              setSelectedColumns(new Set())
            }
            setShowCombineDialog(false)
          }}
          onCancel={() => setShowCombineDialog(false)}
        />
      )}

      <div className="overflow-auto">
        <div className="inline-block w-max max-w-full">
        {expansionCountIssues.length > 0 && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            <p className="font-medium">expansionCount required for restricted headers</p>
            <ul className="mt-1 list-inside list-disc">
              {expansionCountIssues.map((issue) => (
                <li key={`${issue.target}-${issue.index}`}>
                  {formatExpansionCountIssue(issue)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <table
          className="character-table w-max border-collapse text-sm"
          style={stickyTableStyle(sticky)}
        >
              <colgroup>
                <col style={{ width: 'var(--sheet-gutter-w)' }} />
                <col
                  style={{
                    width: sticky.expansion,
                    minWidth: sticky.expansion,
                    maxWidth: sticky.expansion,
                  }}
                />
                <col
                  style={{
                    width: sticky.diagram,
                    minWidth: sticky.diagram,
                    maxWidth: sticky.diagram,
                  }}
                />
                {columnMinWidths.map((minWidth, i) => (
                  <col key={i} style={minWidth != null ? { minWidth } : undefined} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <SheetCornerHeader />
                  <th
                    colSpan={2}
                    className="sticky top-0 z-50 h-6 border border-slate-300 bg-slate-100 p-0"
                  />
                  {table.columns.map((_col, colIndex) => (
                    <SheetColumnHeader
                      key={colIndex}
                      colIndex={colIndex}
                      selected={selectedColumns.has(colIndex)}
                      menuOpen={openColumnMenu === colIndex}
                      onSelect={() => {
                        setOpenColumnMenu(null)
                        setSelectedColumns(toggleInSet(selectedColumns, colIndex))
                      }}
                      onToggleMenu={() =>
                        setOpenColumnMenu((cur) =>
                          cur === colIndex ? null : colIndex,
                        )
                      }
                      onCloseMenu={() => setOpenColumnMenu(null)}
                      menuItems={columnMenuItems(colIndex)}
                    />
                  ))}
                </tr>
                <tr>
                  <SheetRowCorner />
                  <th
                    rowSpan={2}
                    className={`${thBase} ${stickyExpansion} top-0 z-40 ${hPad}`}
                  />
                  <th
                    className={`${thBase} ${stickyDiagram} top-0 z-40 ${hPad}`}
                    style={diagramStickyStyle(0)}
                  >
                    <span
                      className={`font-medium uppercase text-slate-400 ${
                        compactMath
                          ? 'text-[8px] tracking-normal'
                          : 'text-[9px] tracking-wide'
                      }`}
                    >
                      {superTable ? '|K|' : '|C|'}
                    </span>
                  </th>
                  {table.columns.map((col, colIndex) => {
                    const latex = col.classSize ?? ''
                    return (
                      <th
                        key={colIndex}
                        className={`${thBase} sticky top-0 z-30 ${wrap} text-[10px] ${
                          selectedColumns.has(colIndex) ? 'bg-sky-50' : ''
                        }`}
                        title={latex || undefined}
                      >
                        <MathCell latex={latex} compact={compactMath} />
                      </th>
                    )
                  })}
                </tr>
                <tr>
                  <SheetRowCorner />
                  <th
                    className={`${thBase} ${stickyDiagram} z-40 ${hPad}`}
                    style={diagramStickyStyle(OUTER_ROW_H)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`font-medium tabular-nums ${
                          compactMath ? 'text-[10px]' : 'text-xs'
                        }`}
                      >
                        {table.columns.length}
                      </span>
                      <span
                        className={`font-medium uppercase text-slate-400 ${
                          compactMath
                            ? 'text-[8px] tracking-normal'
                            : 'text-[9px] tracking-wide'
                        }`}
                      >
                        {superTable ? 'superclasses' : 'classes'}
                      </span>
                    </div>
                  </th>
                  {table.columns.map((col, colIndex) => (
                    <th
                      key={colIndex}
                      className={`${thBase} sticky z-30 ${wrap} text-[10px] ${
                        selectedColumns.has(colIndex) ? 'bg-sky-50' : ''
                      }`}
                      style={{ top: OUTER_ROW_H }}
                    >
                      <ExpansionCountCell spec={col} compact={compactMath} />
                    </th>
                  ))}
                </tr>
                <tr>
                  <SheetRowCorner />
                  <th
                    className={`${thBase} ${stickyExpansion} z-40 ${hPad}`}
                    style={{ top: INNER_HEADER_TOP }}
                  >
                    <span
                      className={`font-medium uppercase text-slate-400 ${
                        compactMath
                          ? 'text-[8px] tracking-normal'
                          : 'text-[9px] tracking-wide'
                      }`}
                    >
                      Choices
                    </span>
                  </th>
                  <th
                    className={`${thBase} ${stickyDiagram} z-40 p-0`}
                    style={diagramStickyStyle(INNER_HEADER_TOP)}
                  >
                    <CornerCell compact={compactMath} />
                  </th>
                  {table.columns.map((col, colIndex) => (
                    <th
                      key={colIndex}
                      className={`${thBase} sticky z-20 p-0 ${
                        selectedColumns.has(colIndex) ? 'bg-sky-50' : ''
                      }`}
                      style={{ top: INNER_HEADER_TOP }}
                    >
                      <RowColHeader
                        diagram={headerToDiagram(col, n)}
                        columnWidth={sticky.diagram}
                        compact={compactMath}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`group hover:bg-slate-50/50 ${
                      selectedRows.has(rowIndex) ? 'bg-sky-50/60' : ''
                    }`}
                  >
                    <SheetRowHeader
                      rowIndex={rowIndex}
                      selected={selectedRows.has(rowIndex)}
                      menuOpen={openRowMenu === rowIndex}
                      onSelect={() => {
                        setOpenRowMenu(null)
                        setSelectedRows(toggleInSet(selectedRows, rowIndex))
                      }}
                      onToggleMenu={() =>
                        setOpenRowMenu((cur) =>
                          cur === rowIndex ? null : rowIndex,
                        )
                      }
                      onCloseMenu={() => setOpenRowMenu(null)}
                      menuItems={rowMenuItems(rowIndex)}
                    />
                    <th
                      className={`${thBase} ${stickyExpansion} z-20 ${pad} text-[10px] group-hover:bg-slate-50`}
                      title="Number of characters this row expands to"
                    >
                      <ExpansionCountCell spec={row} compact={compactMath} />
                    </th>
                    <th
                      className={`${thBase} ${stickyDiagram} z-20 p-0 group-hover:bg-slate-50`}
                      style={diagramStickyStyle()}
                    >
                      <RowColHeader
                        diagram={headerToDiagram(row, n)}
                        columnWidth={sticky.diagram}
                        compact={compactMath}
                      />
                    </th>
                    {table.columns.map((_col, colIndex) => {
                      const latex = getCellLatex(table, rowIndex, colIndex)
                      const isEditing =
                        editingCell?.row === rowIndex &&
                        editingCell?.col === colIndex
                      return (
                        <td
                          key={colIndex}
                          className={`border border-slate-200 bg-white ${wrap} ${
                            selectedColumns.has(colIndex) ? 'bg-sky-50/50' : ''
                          }`}
                          title={latex || undefined}
                        >
                          <EditableCell
                            latex={latex}
                            compact={compactMath}
                            isEditing={isEditing}
                            onStartEdit={() =>
                              setEditingCell({ row: rowIndex, col: colIndex })
                            }
                            onCommit={(value) =>
                              commitCell(rowIndex, colIndex, value)
                            }
                            onCancel={() => setEditingCell(null)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}

function CornerCell({ compact = false }: { compact?: boolean }) {
  const labelClass = compact
    ? 'text-[7px] font-medium uppercase tracking-normal text-slate-500'
    : 'text-[10px] font-medium uppercase tracking-wide text-slate-500'

  return (
    <div className={`relative w-full ${compact ? 'h-10' : 'h-12'}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 64">
        <line x1="0" y1="0" x2="100" y2="64" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
      <span
        className={`absolute ${compact ? 'right-0.5 top-0.5' : 'right-2 top-1'} ${labelClass}`}
      >
        classes
      </span>
      <span
        className={`absolute ${compact ? 'bottom-0.5 left-0.5' : 'bottom-1 left-2'} ${labelClass}`}
      >
        chars
      </span>
    </div>
  )
}
