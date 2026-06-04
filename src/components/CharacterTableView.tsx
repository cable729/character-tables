import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { CharacterTable } from '../types/characterTable'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import {
  computeSharedDiagramBand,
  diagramHeaderRowMinHeightPx,
  getDiagramMetrics,
  standardHeaderDiagramWidthPx,
} from '../diagram/arcGeometry'
import {
  getCellLatex,
  headerToDiagram,
  inferN,
} from '../diagram/utils'
import { ExpansionCountCell } from './ExpansionCountCell'
import { MathCell } from './MathCell'
import { RowColHeader } from './ArcDiagram'
import { TableCornerCell } from './TableCornerCell'
import { tableLayoutFlags } from './tableLayout'
import {
  dataColumnMinWidths,
  stickyColumnWidths,
  type StickyColumnWidths,
} from './tableColumnWidths'

type CharacterTableViewProps = {
  table: CharacterTable
  compactMath?: boolean
}

const OUTER_ROW_H = 28

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

function diagramStickyStyle(
  left: string | number,
  top?: number,
): CSSProperties {
  return {
    left,
    ...(top != null ? { top } : {}),
  }
}

function stickyTableStyle(sticky: StickyColumnWidths): CSSProperties {
  return {
    '--expansion-col-w': `${sticky.expansion}px`,
    '--diagram-col-w': `${sticky.diagram}px`,
  } as CSSProperties
}

function TableColGroup({
  sticky,
  columnMinWidths,
  showChoicesColumn,
}: {
  sticky: StickyColumnWidths
  columnMinWidths: (number | undefined)[]
  showChoicesColumn: boolean
}) {
  const fixedCol = (px: number) => ({
    width: px,
    minWidth: px,
    maxWidth: px,
  })

  return (
    <colgroup>
      {showChoicesColumn && <col style={fixedCol(sticky.expansion)} />}
      <col style={fixedCol(sticky.diagram)} />
      {columnMinWidths.map((minWidth, i) => (
        <col key={i} style={minWidth != null ? { minWidth } : undefined} />
      ))}
    </colgroup>
  )
}

export function CharacterTableView({
  table,
  compactMath = false,
}: CharacterTableViewProps) {
  const n = inferN(table)
  const layout = tableLayoutFlags(table)
  const expansionCountIssues = layout.showChoicesColumn
    ? findExpansionCountIssues(table)
    : []
  const columnMinWidths = dataColumnMinWidths(table, compactMath)
  const sticky = stickyColumnWidths(table, n, compactMath, {
    includeExpansionColumn: layout.showChoicesColumn,
  })
  const hPad = headerPad(compactMath)
  const wrap = mathCellWrap(compactMath)
  const sizeLabel = layout.superTable ? '|K|' : '|C|'
  const familyLabel = layout.cornerLabels.col
  const stickyLeft = layout.diagramStickyLeft
  const innerTop = layout.innerHeaderTopPx
  const headerDiagramWidth = standardHeaderDiagramWidthPx(n, compactMath)
  const columnDiagrams = useMemo(
    () => table.columns.map((col) => headerToDiagram(col, n)),
    [table.columns, n],
  )
  const columnSharedBand = useMemo(() => {
    const metrics = getDiagramMetrics(compactMath)
    return computeSharedDiagramBand(
      columnDiagrams,
      headerDiagramWidth,
      metrics,
      layout.showArcLabels,
    )
  }, [
    columnDiagrams,
    headerDiagramWidth,
    compactMath,
    layout.showArcLabels,
  ])
  const diagramHeaderRowMinHeight = diagramHeaderRowMinHeightPx(
    columnSharedBand,
    columnDiagrams,
    headerDiagramWidth,
    getDiagramMetrics(compactMath),
    layout.showArcLabels,
    (d) => Boolean(d.restriction?.trim()),
    compactMath,
  )

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
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
      <div className="inline-block min-w-full pb-1 pl-1">
        <div className="w-max min-w-full pl-6">
          <table
            className="character-table table-auto border-separate border-spacing-0 text-sm"
            style={stickyTableStyle(sticky)}
          >
            <TableColGroup
              sticky={sticky}
              columnMinWidths={columnMinWidths}
              showChoicesColumn={layout.showChoicesColumn}
            />
            <thead>
              <tr>
                <th
                  colSpan={layout.showChoicesColumn ? 2 : 1}
                  className="h-4 border-0 bg-transparent p-0"
                />
                {table.columns.map((_col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`border-0 bg-transparent p-0 text-center text-[10px] font-medium tabular-nums text-slate-400/70 ${wrap}`}
                  >
                    {colIndex}
                  </th>
                ))}
              </tr>
              <tr>
                {layout.showChoicesColumn && (
                  <th
                    rowSpan={2}
                    className={`${thBase} ${stickyExpansion} top-0 z-40 ${hPad}`}
                  />
                )}
                <th
                  className={`${thBase} ${stickyDiagram} top-0 z-40 ${hPad}`}
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
                  return (
                    <th
                      key={colIndex}
                      className={`${thBase} sticky top-0 z-30 ${wrap} text-[10px]`}
                      title={latex || undefined}
                    >
                      <MathCell latex={latex} compact={compactMath} />
                    </th>
                  )
                })}
              </tr>
              {layout.showChoicesColumn && (
                <tr>
                  <th
                    className={`${thBase} ${stickyDiagram} z-40 ${hPad}`}
                    style={diagramStickyStyle(stickyLeft, OUTER_ROW_H)}
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
                        {familyLabel}
                      </span>
                    </div>
                  </th>
                  {table.columns.map((col, colIndex) => (
                    <th
                      key={colIndex}
                      className={`${thBase} sticky z-30 ${wrap} text-[10px]`}
                      style={{ top: OUTER_ROW_H }}
                      title="Number of conjugacy classes this column expands to"
                    >
                      <ExpansionCountCell spec={col} compact={compactMath} />
                    </th>
                  ))}
                </tr>
              )}
              <tr>
                {layout.showChoicesColumn && (
                  <th
                    className={`${thBase} ${stickyExpansion} z-40 ${hPad}`}
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
                  className={`${thBase} ${stickyDiagram} z-40 p-0`}
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
                    className={`diagram-header-cell ${thBase} sticky z-20 p-0 align-top`}
                    style={{
                      top: innerTop,
                      minHeight: diagramHeaderRowMinHeight,
                    }}
                  >
                    <RowColHeader
                      diagram={headerToDiagram(col, n)}
                      diagramWidth={headerDiagramWidth}
                      compact={compactMath}
                      showArcLabels={layout.showArcLabels}
                      showRestriction={layout.showRestriction}
                      sharedBand={columnSharedBand}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group hover:bg-slate-50/50">
                  {layout.showChoicesColumn && (
                    <th
                      data-row-index={rowIndex}
                      className={`${thBase} row-index-cell ${stickyExpansion} z-20 ${cellPad(compactMath)} text-[10px] group-hover:bg-slate-50`}
                      title="Number of characters this row expands to"
                    >
                      <ExpansionCountCell spec={row} compact={compactMath} />
                    </th>
                  )}
                  <th
                    className={`${thBase} ${stickyDiagram} z-20 p-0 align-middle group-hover:bg-slate-50`}
                    style={diagramStickyStyle(stickyLeft)}
                  >
                    <RowColHeader
                      diagram={headerToDiagram(row, n)}
                      diagramWidth={headerDiagramWidth}
                      compact={compactMath}
                      showArcLabels={layout.showArcLabels}
                      showRestriction={layout.showRestriction}
                    />
                  </th>
                  {table.columns.map((_col, colIndex) => {
                    const latex = getCellLatex(table, rowIndex, colIndex)
                    return (
                      <td
                        key={colIndex}
                        className={`border border-slate-200 ${wrap}`}
                        title={latex || undefined}
                      >
                        <MathCell latex={latex} compact={compactMath} />
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
