import type { CharacterTable } from '../types/characterTable'
import { Modal } from './Modal'
import { isSupercharacterTable } from '../schema/tableSchema'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import { headersStructurallyEqual } from '../headers/mergeHeaders'
import type { SupercharacterRowCombinePreview } from '../tableOps/supercharacterCombine'

type CombineHeadersDialogProps = {
  table: CharacterTable
  axis: 'rows' | 'columns'
  indices: number[]
  method: 'sum' | 'identical'
  rowCombinePreview?: SupercharacterRowCombinePreview | null
  onConfirm: () => void
  onCancel: () => void
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
  method,
  rowCombinePreview,
  onConfirm,
  onCancel,
}: CombineHeadersDialogProps) {
  const superTable = isSupercharacterTable(table)
  const headers =
    axis === 'rows'
      ? indices.map((i) => table.rows[i]!)
      : indices.map((i) => table.columns[i]!)

  const first = headers[0]
  const headersOk =
    first != null &&
    headers.every((h) => headersStructurallyEqual(first, h))

  let matrixOk = true
  if (axis === 'rows' && method === 'identical') {
    const slices = indices.map((i) => table.matrix[i] ?? [])
    matrixOk = matrixSlicesIdentical(slices)
  } else if (axis === 'columns') {
    const slices = indices.map((colIndex) =>
      table.matrix.map((row) => row[colIndex] ?? '0'),
    )
    matrixOk = matrixSlicesIdentical(slices)
  }

  const sumOk = method === 'sum' && rowCombinePreview != null && !rowCombinePreview.sumFailed
  const columnGroupOk =
    method === 'sum' &&
    rowCombinePreview != null &&
    rowCombinePreview.canCombine

  const expansionIssues = findExpansionCountIssues(table)
  const axisLabel = axis === 'rows' ? 'rows' : 'columns'

  const canCommit =
    method === 'sum'
      ? sumOk && columnGroupOk
      : superTable && axis === 'columns'
        ? matrixOk
        : headersOk && matrixOk

  const description =
    method === 'sum'
      ? 'Sum matrix entries across selected rows. Requires a block of identical columns matching the row count.'
      : superTable && axis === 'columns'
        ? 'Merge superclasses with identical matrix columns. Arc diagrams may be merged automatically or edited afterward.'
        : `Identical combine requires matching header specs and matrix ${axisLabel}.`

  return (
    <Modal
      open
      onClose={onCancel}
      title={`Combine ${indices.length} ${axisLabel}`}
      titleId="combine-dialog-title"
    >
        <p className="text-sm text-slate-600">{description}</p>

        <ul className="mt-3 space-y-1 text-sm">
          {method === 'sum' ? (
            <>
              <li className={sumOk ? 'text-emerald-700' : 'text-red-700'}>
                Row sum {sumOk ? 'ok' : 'failed'}
              </li>
              <li className={columnGroupOk ? 'text-emerald-700' : 'text-red-700'}>
                Identical column group {columnGroupOk ? 'found' : 'missing'}
              </li>
              {rowCombinePreview?.warning && (
                <li className="text-amber-800">{rowCombinePreview.warning}</li>
              )}
            </>
          ) : (
            <>
              {!(superTable && axis === 'columns') && (
                <li className={headersOk ? 'text-emerald-700' : 'text-red-700'}>
                  Headers {headersOk ? 'match' : 'do not match'}
                </li>
              )}
              <li className={matrixOk ? 'text-emerald-700' : 'text-red-700'}>
                Matrix {axisLabel} {matrixOk ? 'match' : 'do not match'}
              </li>
            </>
          )}
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
    </Modal>
  )
}
