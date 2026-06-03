import type { CSSProperties } from 'react'
import type { CharacterTable } from '../types/characterTable'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import {
  getCellLatex,
  headerToDiagram,
  inferN,
} from '../diagram/utils'
import { ExpansionCountCell } from './ExpansionCountCell'
import { MathCell } from './MathCell'
import { RowColHeader } from './ArcDiagram'
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
const INNER_HEADER_TOP = OUTER_ROW_H * 2

const thBase =
  'border border-slate-200 bg-slate-50 text-center text-slate-600'

const stickyExpansion =
  'sticky-expansion-col sticky left-0 z-30 bg-slate-50'

const stickyDiagram = 'sticky-diagram-col sticky z-30 bg-slate-50'

const mathCellWrap =
  'overflow-hidden whitespace-nowrap px-1.5 py-1 text-center'

function diagramStickyStyle(top?: number): CSSProperties {
  return {
    left: 'var(--expansion-col-w)',
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
}: {
  sticky: StickyColumnWidths
  columnMinWidths: (number | undefined)[]
}) {
  const fixedCol = (px: number) => ({
    width: px,
    minWidth: px,
    maxWidth: px,
  })

  return (
    <colgroup>
      <col style={fixedCol(sticky.expansion)} />
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
  const expansionCountIssues = findExpansionCountIssues(table)
  const columnMinWidths = dataColumnMinWidths(table, compactMath)
  const sticky = stickyColumnWidths(table, n)

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
            <TableColGroup sticky={sticky} columnMinWidths={columnMinWidths} />
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="h-4 border-0 bg-transparent p-0"
                />
                {table.columns.map((_col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`border-0 bg-transparent p-0 text-center text-[10px] font-medium tabular-nums text-slate-400/70 ${mathCellWrap}`}
                  >
                    {colIndex}
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  rowSpan={2}
                  className={`${thBase} ${stickyExpansion} top-0 z-40 px-2 py-1`}
                />
                <th
                  className={`${thBase} ${stickyDiagram} top-0 z-40 px-2 py-1`}
                  style={diagramStickyStyle(0)}
                >
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    |C|
                  </span>
                </th>
                {table.columns.map((col, colIndex) => {
                  const latex = col.classSize ?? ''
                  return (
                    <th
                      key={colIndex}
                      className={`${thBase} sticky top-0 z-30 ${mathCellWrap} text-[10px]`}
                      title={latex || undefined}
                    >
                      <MathCell latex={latex} compact={compactMath} />
                    </th>
                  )
                })}
              </tr>
              <tr>
                <th
                  className={`${thBase} ${stickyDiagram} z-40 px-2 py-1`}
                  style={diagramStickyStyle(OUTER_ROW_H)}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-medium tabular-nums">
                      {table.columns.length}
                    </span>
                    <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      classes
                    </span>
                  </div>
                </th>
                {table.columns.map((col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`${thBase} sticky z-30 ${mathCellWrap} text-[10px]`}
                    style={{ top: OUTER_ROW_H }}
                    title="Number of conjugacy classes this column expands to"
                  >
                    <ExpansionCountCell spec={col} />
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  className={`${thBase} ${stickyExpansion} z-40 px-2 py-1`}
                  style={{ top: INNER_HEADER_TOP }}
                >
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    Choices
                  </span>
                </th>
                <th
                  className={`${thBase} ${stickyDiagram} z-40 p-0`}
                  style={diagramStickyStyle(INNER_HEADER_TOP)}
                >
                  <CornerCell />
                </th>
                {table.columns.map((col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`${thBase} sticky z-20 p-0`}
                    style={{ top: INNER_HEADER_TOP }}
                  >
                    <RowColHeader
                      diagram={headerToDiagram(col, n)}
                      columnWidth={sticky.diagram}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group hover:bg-slate-50/50">
                  <th
                    data-row-index={rowIndex}
                    className={`${thBase} row-index-cell ${stickyExpansion} z-20 px-2 py-2 text-[10px] group-hover:bg-slate-50`}
                    title="Number of characters this row expands to"
                  >
                    <ExpansionCountCell spec={row} />
                  </th>
                  <th
                    className={`${thBase} ${stickyDiagram} z-20 p-0 group-hover:bg-slate-50`}
                    style={diagramStickyStyle()}
                  >
                    <RowColHeader
                      diagram={headerToDiagram(row, n)}
                      columnWidth={sticky.diagram}
                    />
                  </th>
                  {table.columns.map((_col, colIndex) => {
                    const latex = getCellLatex(table, rowIndex, colIndex)
                    return (
                      <td
                        key={colIndex}
                        className={`border border-slate-200 ${mathCellWrap}`}
                        title={latex || undefined}
                      >
                        <MathCell
                          latex={latex}
                          compact={compactMath}
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

function CornerCell() {
  return (
    <div className="relative h-12 w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 64">
        <line x1="0" y1="0" x2="100" y2="64" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
      <span className="absolute right-2 top-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        classes
      </span>
      <span className="absolute bottom-1 left-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        chars
      </span>
    </div>
  )
}
