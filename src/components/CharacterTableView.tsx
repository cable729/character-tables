import type { CharacterTable } from '../types/characterTable'
import {
  expansionCountLatex,
  getCellLatex,
  headerToDiagram,
  inferN,
} from '../diagram/utils'
import { MathCell } from './MathCell'
import { RowColHeader } from './ArcDiagram'

type CharacterTableViewProps = {
  table: CharacterTable
}

const OUTER_ROW_H = 28
const INNER_HEADER_TOP = OUTER_ROW_H * 2
const EXPANSION_COL_W = 52

const thBase =
  'border border-slate-200 bg-slate-50 text-center text-slate-600'

export function CharacterTableView({ table }: CharacterTableViewProps) {
  const n = inferN(table)

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              colSpan={2}
              className={`${thBase} sticky left-0 top-0 z-40 min-w-[152px] px-2 py-1`}
            >
              <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                |C|
              </span>
            </th>
            {table.columns.map((col, colIndex) => (
              <th
                key={colIndex}
                className={`${thBase} sticky top-0 z-30 min-w-[120px] px-2 py-1 text-[10px]`}
              >
                <MathCell latex={col.classSize ?? ''} />
              </th>
            ))}
          </tr>
          <tr>
            <th
              colSpan={2}
              className={`${thBase} sticky left-0 z-40 min-w-[152px] px-2 py-1`}
              style={{ top: OUTER_ROW_H }}
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
                className={`${thBase} sticky z-30 min-w-[120px] px-2 py-1 text-[10px]`}
                style={{ top: OUTER_ROW_H }}
                title="Number of conjugacy classes this column expands to"
              >
                <MathCell latex={expansionCountLatex(col)} />
              </th>
            ))}
          </tr>
          <tr>
            <th
              className={`${thBase} sticky left-0 z-40 w-[52px] min-w-[52px] p-0`}
              style={{ top: INNER_HEADER_TOP }}
            />
            <th
              className={`${thBase} sticky z-40 min-w-[100px] w-[100px] p-0`}
              style={{ top: INNER_HEADER_TOP, left: EXPANSION_COL_W }}
            >
              <CornerCell />
            </th>
            {table.columns.map((col, colIndex) => (
              <th
                key={colIndex}
                className={`${thBase} sticky z-20 min-w-[120px] p-0`}
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
                className={`${thBase} sticky left-0 z-20 w-[52px] min-w-[52px] px-2 py-2 text-[10px]`}
                title="Number of characters this row expands to"
              >
                <MathCell latex={expansionCountLatex(row)} />
              </th>
              <th
                className={`${thBase} sticky z-20 min-w-[100px] w-[100px] p-0`}
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
