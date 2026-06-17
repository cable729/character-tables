import { useMemo, useState } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import type {
  OrthogonalityBadPairDetail,
  OrthogonalityFailureModel,
  OrthogonalityPairTable,
} from '../../expansion/orthogonalityDetails'
import { buildOrthogonalityPairTable } from '../../expansion/orthogonalityDetails'
import { MathCell } from '../MathCell'

function innerProductValueLatex(ip: string): string {
  const trimmed = ip.trim()
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
    return trimmed
  }
  return `\\text{${trimmed.replace(/\\/g, '\\\\').replace(/}/g, '\\}')}}`
}

function PairComparisonTable({ table }: { table: OrthogonalityPairTable }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-max border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[2] border border-slate-200 bg-slate-100 px-2 py-1" />
            {table.columns.map((col) => (
              <th
                key={col.key}
                className="border border-slate-200 bg-slate-50 px-1.5 py-1 align-bottom font-normal"
              >
                <MathCell latex={col.headerLatex} compact maxLines={1} />
                {col.classWeight != null && col.classWeight !== 1 ? (
                  <div className="mt-0.5 text-[9px] text-slate-500">
                    <MathCell
                      latex={`|C|=${col.classWeight}`}
                      compact
                      title="Conjugacy class size |C| used as inner-product weight"
                    />
                  </div>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th className="sticky left-0 z-[1] border border-slate-200 bg-slate-50 px-2 py-1 align-middle text-left font-normal">
                <MathCell latex={row.headerLatex} compact maxLines={1} />
                {row.classWeight != null && row.classWeight !== 1 ? (
                  <div className="mt-0.5 text-[9px] text-slate-500">
                    <MathCell latex={`|C|=${row.classWeight}`} compact />
                  </div>
                ) : null}
              </th>
              {row.cells.map((cell) => (
                <td
                  key={cell.key}
                  className="border border-slate-200 px-1.5 py-0.5 text-center align-middle"
                >
                  <MathCell latex={cell.displayLatex} compact maxLines={2} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrthogonalityPairCard({
  table,
  q,
  axis,
  pair,
}: {
  table: CharacterTable
  q: number
  axis: OrthogonalityFailureModel['axis']
  pair: OrthogonalityBadPairDetail
}) {
  const [expanded, setExpanded] = useState(false)
  const pairLatex = `\\langle ${pair.aLabelLatex},\\,${pair.bLabelLatex} \\rangle = ${innerProductValueLatex(pair.ip)}`

  const pairTable = useMemo(() => {
    if (!expanded) {
      return null
    }
    return buildOrthogonalityPairTable(table, q, axis, pair.aKey, pair.bKey)
  }, [expanded, table, q, axis, pair.aKey, pair.bKey])

  return (
    <div className="rounded border border-red-100 bg-white/70">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start justify-between gap-2 p-2 text-left hover:bg-red-50/40"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 text-slate-800">
          <MathCell latex={pairLatex} compact />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800">
            Expected: {pair.expected}
          </span>
          <span className="text-slate-400" aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </button>
      {expanded && pairTable && (
        <div className="border-t border-red-100 px-2 pb-2">
          <PairComparisonTable table={pairTable} />
        </div>
      )}
      {expanded && !pairTable && (
        <p className="border-t border-red-100 px-2 py-2 text-xs text-red-800">
          Could not build comparison table for this pair.
        </p>
      )}
    </div>
  )
}

type OrthogonalityFailureDetailsProps = {
  model: OrthogonalityFailureModel
  table: CharacterTable
  q: number
}

export function OrthogonalityFailureDetails({
  model,
  table,
  q,
}: OrthogonalityFailureDetailsProps) {
  return (
    <div className="mt-1.5 space-y-2 border-t border-red-100 pt-1.5">
      {model.groupOrder != null && (
        <p className="text-xs text-red-900">
          <span className="font-medium">|G|</span> at this q = {model.groupOrder}
        </p>
      )}
      <p className="text-[10px] text-slate-500">
        Expand a pair to load its comparison table.
      </p>
      {model.pairs.map((pair, index) => (
        <OrthogonalityPairCard
          key={`${pair.aKey}-${pair.bKey}-${index}`}
          table={table}
          q={q}
          axis={model.axis}
          pair={pair}
        />
      ))}
      {model.truncatedCount > 0 && (
        <p className="text-[10px] text-slate-500">
          … {model.truncatedCount} more pair(s) omitted
        </p>
      )}
    </div>
  )
}
