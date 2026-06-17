import { useMemo } from 'react'
import { superclassSizesCheckSymbolic } from '../../checks/conjugacyClassOrderCheck'
import type { CharacterTable } from '../../types/characterTable'
import { MathCell } from '../MathCell'

export function SuperclassSizesSymbolicTable({
  table,
}: {
  table: CharacterTable
}) {
  const breakdown = useMemo(() => {
    try {
      return superclassSizesCheckSymbolic(table)
    } catch {
      return null
    }
  }, [table])

  if (!breakdown) {
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="px-2 py-1 font-medium">j</th>
            <th className="px-2 py-1 font-medium">
              <MathCell latex="|K_j|" />
            </th>
          </tr>
        </thead>
        <tbody>
          {breakdown.columns.map((col) => (
            <tr key={col.index} className="border-b border-slate-100">
              <td className="px-2 py-1">{col.index}</td>
              <td className="px-2 py-1">
                <MathCell latex={col.classSize} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
