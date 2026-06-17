import { useEffect, useState } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import { headerToDiagram } from '../../diagram/utils'
import {
  displayExpansionCountLatex,
  hasExplicitExpansionCount,
} from '../../expansion/expansionCountDisplay'
import { RowColHeader } from '../ArcDiagram'
import { EditableCell } from '../EditableCell'
import { TableCornerCell } from '../TableCornerCell'
import {
  SheetColumnHeader,
  SheetCornerHeader,
  SheetRowCorner,
} from '../grid/SheetHeaders'
import {
  diagramHeaderCellClasses,
  editableLatexCellHost,
  isClassSizeCellActive,
  isDiagramColActive,
  isExpansionCellActive,
  type TableEditFocus,
} from '../tableCellStyles'
import type { DiagramEditorTarget } from '../DiagramEditorDialog'
import type { CharacterTableLayout } from './useCharacterTableLayout'
import type { TableSelection } from './useTableSelection'
import {
  columnMenuItems,
  type ColumnTableActions,
} from './tableActions'
import {
  OUTER_ROW_H,
  diagramStickyStyle,
  stickyDiagram,
  stickyExpansion,
  thBase,
} from './layoutConstants'

type CharacterTableHeadProps = {
  table: CharacterTable
  compactMath: boolean
  layout: CharacterTableLayout
  selection: TableSelection
  columnActions: ColumnTableActions
  editFocus: TableEditFocus | null
  diagramEditor: DiagramEditorTarget | null
  showColumnSelection: boolean
  onOpenDiagramEditor: (target: DiagramEditorTarget) => void
  onStartClassSizeEdit: (colIndex: number) => void
  onCommitClassSize: (colIndex: number, value: string) => void
  onCancelClassSize: () => void
  onStartExpansionEdit: (axis: 'column', index: number) => void
  onCommitExpansionCount: (
    axis: 'column',
    index: number,
    value: string,
  ) => void
  onCancelExpansionEdit: () => void
}

export function CharacterTableHead({
  table,
  compactMath,
  layout: {
    n,
    layout,
    sticky,
    columnMinWidths,
    sizeLabel,
    familyLabel,
    stickyLeft,
    innerTop,
    hPad,
    headerDiagramWidth,
    columnSharedBand,
    diagramHeaderRowMinHeight,
  },
  selection,
  columnActions,
  editFocus,
  diagramEditor,
  showColumnSelection,
  onOpenDiagramEditor,
  onStartClassSizeEdit,
  onCommitClassSize,
  onCancelClassSize,
  onStartExpansionEdit,
  onCommitExpansionCount,
  onCancelExpansionEdit,
}: CharacterTableHeadProps) {
  const [openColumnMenu, setOpenColumnMenu] = useState<number | null>(null)

  useEffect(() => {
    if (diagramEditor) {
      setOpenColumnMenu(null)
    }
  }, [diagramEditor])

  const columnIndexSelected = (colIndex: number) =>
    showColumnSelection && selection.selectedColumns.has(colIndex)

  return (
    <thead>
      <tr>
        <SheetCornerHeader />
        <th
          colSpan={layout.showChoicesColumn ? 2 : 1}
          className="sticky top-0 z-[var(--z-sticky-corner)] h-6 border border-slate-300 bg-slate-100 p-0"
        />
        {table.columns.map((_col, colIndex) => (
          <SheetColumnHeader
            key={colIndex}
            colIndex={colIndex}
            selected={columnIndexSelected(colIndex)}
            menuOpen={openColumnMenu === colIndex}
            onSelect={() => {
              setOpenColumnMenu(null)
              selection.toggleColumnSelection(colIndex)
            }}
            onToggleMenu={() =>
              setOpenColumnMenu((cur) => (cur === colIndex ? null : colIndex))
            }
            onCloseMenu={() => setOpenColumnMenu(null)}
            menuItems={columnMenuItems(
              colIndex,
              table,
              columnActions,
              selection.canCombineColumns,
            )}
          />
        ))}
      </tr>
      <tr>
        <SheetRowCorner />
        {layout.showChoicesColumn && (
          <th
            rowSpan={2}
            className={`${thBase} ${stickyExpansion} top-0 z-[var(--z-sticky-corner)] ${hPad}`}
          />
        )}
        <th
          className={`${thBase} ${stickyDiagram} top-0 z-[var(--z-sticky-corner)] ${hPad}`}
          style={diagramStickyStyle(stickyLeft, 0)}
        >
          <span
            className={`font-medium uppercase text-slate-400 ${
              compactMath
                ? 'text-[8px] tracking-normal'
                : 'text-[9px] tracking-wide'
            }`}
          >
            {sizeLabel}
          </span>
        </th>
        {table.columns.map((col, colIndex) => {
          const latex = col.classSize ?? ''
          const isEditingClassSize = isClassSizeCellActive(colIndex, editFocus)
          return (
            <th
              key={colIndex}
              className={`${thBase} sticky top-0 z-[var(--z-sticky-header)] text-[10px] ${editableLatexCellHost(
                compactMath,
                isEditingClassSize,
              )} ${columnIndexSelected(colIndex) ? 'bg-sky-50' : ''}`}
            >
              <EditableCell
                latex={latex}
                compact={compactMath}
                isEditing={isEditingClassSize}
                columnWidthPx={columnMinWidths[colIndex]}
                onStartEdit={() => onStartClassSizeEdit(colIndex)}
                onCommit={(value) => onCommitClassSize(colIndex, value)}
                onCancel={onCancelClassSize}
              />
            </th>
          )
        })}
      </tr>
      {layout.showChoicesColumn && (
        <tr>
          <SheetRowCorner />
          <th
            className={`${thBase} ${stickyDiagram} z-[var(--z-sticky-corner)] ${hPad}`}
            style={diagramStickyStyle(stickyLeft, OUTER_ROW_H)}
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
          {table.columns.map((col, colIndex) => {
            const countLatex = displayExpansionCountLatex(col)
            const isEditingCount = isExpansionCellActive(
              'column',
              colIndex,
              editFocus,
            )
            const inferred = !hasExplicitExpansionCount(col)
            return (
              <th
                key={colIndex}
                className={`${thBase} sticky z-[var(--z-sticky-header)] text-[10px] ${editableLatexCellHost(
                  compactMath,
                  isEditingCount,
                )} ${columnIndexSelected(colIndex) ? 'bg-sky-50' : ''}`}
                style={{ top: OUTER_ROW_H }}
              >
                <EditableCell
                  latex={countLatex}
                  compact={compactMath}
                  isEditing={isEditingCount}
                  columnWidthPx={columnMinWidths[colIndex]}
                  title={
                    inferred
                      ? `${countLatex} — calculated from arcs; click to override`
                      : `${countLatex} — click to edit`
                  }
                  onStartEdit={() => onStartExpansionEdit('column', colIndex)}
                  onCommit={(value) =>
                    onCommitExpansionCount('column', colIndex, value)
                  }
                  onCancel={onCancelExpansionEdit}
                />
              </th>
            )
          })}
        </tr>
      )}
      <tr className="group/diagram-row">
        <SheetRowCorner />
        {layout.showChoicesColumn && (
          <th
            className={`${thBase} ${stickyExpansion} z-[var(--z-sticky-corner)] ${hPad}`}
            style={{ top: innerTop }}
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
        )}
        <th
          className={`${thBase} ${stickyDiagram} z-[var(--z-sticky-corner)] p-0`}
          style={diagramStickyStyle(stickyLeft, innerTop)}
        >
          {layout.showChoicesColumn ? (
            <TableCornerCell
              cornerLabels={layout.cornerLabels}
              compact={compactMath}
            />
          ) : (
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
                {familyLabel}
              </span>
            </div>
          )}
        </th>
        {table.columns.map((col, colIndex) => (
          <th
            key={colIndex}
            className={`diagram-header-cell ${thBase} sticky z-[var(--z-sticky)] p-0 align-top group-hover/diagram-row:bg-slate-50 ${diagramHeaderCellClasses(
              isDiagramColActive(colIndex, editFocus),
            )} ${
              !isDiagramColActive(colIndex, editFocus) &&
              columnIndexSelected(colIndex)
                ? 'bg-sky-50'
                : ''
            }`}
            style={{
              top: innerTop,
              minHeight: diagramHeaderRowMinHeight,
            }}
          >
            <RowColHeader
              diagram={headerToDiagram(col, n)}
              diagramWidth={headerDiagramWidth}
              restrictionColumnWidthPx={sticky.diagram}
              compact={compactMath}
              showArcLabels={layout.showArcLabels}
              showRestriction={layout.showRestriction}
              sharedBand={columnSharedBand}
              onClick={() =>
                onOpenDiagramEditor({ kind: 'column', index: colIndex })
              }
            />
          </th>
        ))}
      </tr>
    </thead>
  )
}
