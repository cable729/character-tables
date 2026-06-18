import { useMemo, useState } from 'react'
import type { CharacterTable } from '../types/characterTable'
import { expansionCountLatex } from '../expansion/expansionCountDisplay'
import { proposeBelowLabelSplit } from '../transforms/proposeSplit'
import {
  buildBelowLabelSplitChildren,
  REFERENCE_Q,
} from '../transforms/splitBelowLabel'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from '../transforms/validateSplit'
import { collectLabelsFromDict, inferN } from '../diagram/utils'
import { useTableStore } from '../store/tableStore'
import { Modal } from './Modal'
import type { HeaderAxis } from './splitHeaderUtils'

type SplitHeaderDialogProps = {
  table: CharacterTable
  axis: HeaderAxis
  index: number
  onClose: () => void
}

export function SplitHeaderDialog({
  table,
  axis,
  index,
  onClose,
}: SplitHeaderDialogProps) {
  const applySplitBelowLabel = useTableStore((s) => s.applySplitBelowLabel)
  const editorError = useTableStore((s) => s.editorError)

  const header = table[axis][index]
  const belowLabels = useMemo(() => {
    if (!header) return []
    return collectLabelsFromDict(header.arcs).belowLabels
  }, [header])

  const [belowLabel, setBelowLabel] = useState('')

  const proposal = useMemo(() => {
    if (!header) return null
    return proposeBelowLabelSplit(header, table)
  }, [header, table])

  const preview = useMemo(() => {
    if (!header || !belowLabel) return null
    try {
      const n = inferN(table)
      const parentCount = countAssignmentsForHeader(header, n, REFERENCE_Q)
      const nonzeroCount = countParentBranchAssignments(
        header,
        n,
        REFERENCE_Q,
        belowLabel,
        'nonzero',
      )
      const zeroCount = countParentBranchAssignments(
        header,
        n,
        REFERENCE_Q,
        belowLabel,
        'zero',
      )
      const split = buildBelowLabelSplitChildren(header, belowLabel, table)
      return {
        parentCount,
        nonzeroCount,
        zeroCount,
        partitionOk: nonzeroCount + zeroCount === parentCount,
        children: split.children,
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }, [header, belowLabel, table])

  const handleApply = (label: string) => {
    if (!header?.id || !label) return
    applySplitBelowLabel({
      axis,
      sourceId: header.id,
      belowLabel: label,
    })
    onClose()
  }

  const axisLabel = axis === 'columns' ? 'column' : 'row'

  return (
    <Modal open onClose={onClose} title={`Split ${axisLabel} ${index}`}>
      {proposal && (
        <div className="mb-3 rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
          <p className="font-medium">Proposed split on {proposal.belowLabel}</p>
          <p className="mt-0.5 text-emerald-800">{proposal.reason}</p>
          <button
            type="button"
            onClick={() => handleApply(proposal.belowLabel)}
            className="mt-2 rounded bg-emerald-800 px-2 py-1 font-medium text-white hover:bg-emerald-700"
          >
            Apply proposed split
          </button>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-slate-600">Below label</span>
        <select
          value={belowLabel}
          onChange={(e) => setBelowLabel(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="">Select…</option>
          {belowLabels.map((lb) => (
            <option key={lb} value={lb}>
              {lb}
            </option>
          ))}
        </select>
      </label>

      {preview && 'error' in preview && (
        <p className="mt-2 text-xs text-red-600">{preview.error}</p>
      )}

      {preview && !('error' in preview) && (
        <div className="mt-3 space-y-1 text-xs text-slate-600">
          <p>
            q={REFERENCE_Q}: parent {preview.parentCount} → nonzero{' '}
            {preview.nonzeroCount} + zero {preview.zeroCount}
            {preview.partitionOk ? ' ✓' : ' (partition mismatch)'}
          </p>
          {preview.children.map((c, branchIndex) => (
            <p key={branchIndex}>
              <span className="font-medium">
                {branchIndex === 0 ? 'nonzero' : 'zero'}
              </span>
              : {c.header.restriction ?? '(no restriction)'}, classes{' '}
              {expansionCountLatex(c.header)}
            </p>
          ))}
        </div>
      )}

      {editorError && (
        <p className="mt-2 text-xs text-red-600">{editorError}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleApply(belowLabel)}
          disabled={!belowLabel}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Apply split
        </button>
      </div>
    </Modal>
  )
}
