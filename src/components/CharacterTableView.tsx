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

type CharacterTableViewProps = {
  table: CharacterTable
}

const OUTER_ROW_H = 28
const INNER_HEADER_TOP = OUTER_ROW_H * 2
const EXPANSION_COL_W = 52
const DIAGRAM_COL_W = 100
const DATA_COL_MIN_W = 120

const thBase =
  'border border-slate-200 bg-slate-50 text-center text-slate-600'

function TableColGroup({ columnCount }: { columnCount: number }) {
  return (
    <colgroup>
      <col style={{ width: EXPANSION_COL_W }} />
      <col style={{ width: DIAGRAM_COL_W }} />
      {Array.from({ length: columnCount }, (_, i) => (
        <col key={i} style={{ minWidth: DATA_COL_MIN_W }} />
      ))}
    </colgroup>
  )
}

export function CharacterTableView({ table }: CharacterTableViewProps) {
  const n = inferN(table)
  const expansionCountIssues = findExpansionCountIssues(table)

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
        <div className="pl-6">
          <table className="mb-0.5 w-full table-fixed border-collapse">
            <TableColGroup columnCount={table.columns.length} />
            <tbody>
              <tr>
                <td colSpan={2} className="h-4 border-0 bg-transparent p-0" />
                {table.columns.map((_col, colIndex) => (
                  <td
                    key={colIndex}
                    className="border-0 bg-transparent p-0 text-center text-[10px] font-medium tabular-nums text-slate-400/70"
                  >
                    {colIndex}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <table className="w-full table-fixed border-collapse text-sm">
            <TableColGroup columnCount={table.columns.length} />
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={`${thBase} sticky left-0 top-0 z-40 px-2 py-1`}
                />
                <th
                  className={`${thBase} sticky z-40 px-2 py-1`}
                  style={{ top: 0, left: EXPANSION_COL_W }}
                >
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    |C|
                  </span>
                </th>
                {table.columns.map((col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`${thBase} sticky top-0 z-30 px-2 py-1 text-[10px]`}
                  >
                    <MathCell latex={col.classSize ?? ''} />
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  className={`${thBase} sticky z-40 px-2 py-1`}
                  style={{ top: OUTER_ROW_H, left: EXPANSION_COL_W }}
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
                    className={`${thBase} sticky z-30 px-2 py-1 text-[10px]`}
                    style={{ top: OUTER_ROW_H }}
                    title="Number of conjugacy classes this column expands to"
                  >
                    <ExpansionCountCell spec={col} />
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  className={`${thBase} sticky left-0 z-40 px-2 py-1`}
                  style={{ top: INNER_HEADER_TOP }}
                >
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    Choices
                  </span>
                </th>
                <th
                  className={`${thBase} sticky z-40 p-0`}
                  style={{ top: INNER_HEADER_TOP, left: EXPANSION_COL_W }}
                >
                  <CornerCell />
                </th>
                {table.columns.map((col, colIndex) => (
                  <th
                    key={colIndex}
                    className={`${thBase} sticky z-20 p-0`}
                    style={{ top: INNER_HEADER_TOP }}
                  >
                    <RowColHeader diagram={headerToDiagram(col, n)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/50">
                  <th
                    data-row-index={rowIndex}
                    className={`${thBase} row-index-cell sticky left-0 z-20 px-2 py-2 text-[10px]`}
                    title="Number of characters this row expands to"
                  >
                    <ExpansionCountCell spec={row} />
                  </th>
                  <th
                    className={`${thBase} sticky z-20 p-0`}
                    style={{ left: EXPANSION_COL_W }}
                  >
                    <RowColHeader diagram={headerToDiagram(row, n)} />
                  </th>
                  {table.columns.map((_col, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-slate-200 px-3 py-2 text-center"
                    >
                      <MathCell latex={getCellLatex(table, rowIndex, colIndex)} />
                    </td>
                  ))}
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
    <div className="relative h-16 w-full">
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
