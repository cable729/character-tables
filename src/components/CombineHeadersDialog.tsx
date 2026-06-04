import type { CharacterTable } from '../types/characterTable'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'

type CombineHeadersDialogProps = {
  table: CharacterTable
  axis: 'rows' | 'columns'
  indices: number[]
  onConfirm: () => void
  onCancel: () => void
}

function headersMatch(
  a: CharacterTable['rows'][number],
  b: CharacterTable['rows'][number],
): boolean {
  const stripId = (h: CharacterTable['rows'][number]) => {
    const { id: _id, ...rest } = h
    return rest
  }
  return JSON.stringify(stripId(a)) === JSON.stringify(stripId(b))
}

function matrixSlicesIdentical(slices: string[][]): boolean {
  if (slices.length <= 1) {
    return true
  }
  const first = slices[0]!
  return slices.every(
    (slice) =>
      slice.length === first.length &&
      slice.every((cell, i) => cell === first[i]),
  )
}

export function CombineHeadersDialog({
  table,
  axis,
  indices,
  onConfirm,
  onCancel,
}: CombineHeadersDialogProps) {
  const headers =
    axis === 'rows'
      ? indices.map((i) => table.rows[i]!)
      : indices.map((i) => table.columns[i]!)

  const first = headers[0]
  const headersOk =
    first != null &&
    headers.every((h) => headersMatch(first, h))

  let matrixOk = true
  if (axis === 'rows') {
    const slices = indices.map((i) => table.matrix[i] ?? [])
    matrixOk = matrixSlicesIdentical(slices)
  } else {
    const slices = indices.map((colIndex) =>
      table.matrix.map((row) => row[colIndex] ?? '0'),
    )
    matrixOk = matrixSlicesIdentical(slices)
  }

  const expansionIssues = findExpansionCountIssues(table)
  const axisLabel = axis === 'rows' ? 'rows' : 'columns'
  const canCommit = headersOk && matrixOk

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div
        className="max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="combine-dialog-title"
      >
        <h2
          id="combine-dialog-title"
          className="text-base font-semibold text-slate-900"
        >
          Combine {indices.length} {axisLabel}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Identical combine requires matching header specs and matrix{' '}
          {axis === 'rows' ? 'rows' : 'columns'}.
        </p>

        <ul className="mt-3 space-y-1 text-sm">
          <li className={headersOk ? 'text-emerald-700' : 'text-red-700'}>
            Headers {headersOk ? 'match' : 'do not match'}
          </li>
          <li className={matrixOk ? 'text-emerald-700' : 'text-red-700'}>
            Matrix {axisLabel} {matrixOk ? 'match' : 'do not match'}
          </li>
          {expansionIssues.length > 0 && (
            <li className="text-amber-800">
              {expansionIssues.length} expansion-count warning
              {expansionIssues.length === 1 ? '' : 's'} (non-blocking)
            </li>
          )}
        </ul>

        {expansionIssues.length > 0 && (
          <ul className="mt-2 max-h-24 overflow-auto text-xs text-amber-900">
            {expansionIssues.map((issue) => (
              <li key={`${issue.target}-${issue.index}`}>
                {formatExpansionCountIssue(issue)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canCommit}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
          >
            Combine
          </button>
        </div>
      </div>
    </div>
  )
}
