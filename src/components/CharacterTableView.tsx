import type { CharacterTable } from '../types/characterTable'
import {
  getCellLatex,
  headerToDiagram,
  inferN,
  symbolicCountLatex,
} from '../diagram/utils'
import { MathCell } from './MathCell'
import { RowColHeader } from './ArcDiagram'

type CharacterTableViewProps = {
  table: CharacterTable
}

export function CharacterTableView({ table }: CharacterTableViewProps) {
  const n = inferN(table)

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 min-w-[100px] border border-slate-200 bg-slate-50 p-0">
              <CornerCell />
            </th>
            {table.columns.map((col, colIndex) => (
              <th
                key={colIndex}
                className="sticky top-0 z-10 min-w-[120px] border border-slate-200 bg-slate-50 p-0"
              >
                <RowColHeader
                  diagram={headerToDiagram(col, n)}
                  variant="class"
                  countLatex={symbolicCountLatex(col, Boolean(col.restriction))}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/50">
              <th className="sticky left-0 z-10 border border-slate-200 bg-slate-50 p-0">
                <RowColHeader
                  diagram={headerToDiagram(row, n)}
                  variant="character"
                  countLatex={symbolicCountLatex(row, Boolean(row.restriction))}
                />
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
    <div className="relative h-16 w-full min-w-[100px]">
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
