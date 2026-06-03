import { useEffect, useMemo, useState } from 'react'
import { useTableStore } from '../store/tableStore'
import type { HeaderSpec } from '../types/characterTable'
import { collectLabelsFromDict } from '../diagram/utils'
import { buildBelowLabelSplitChildren, REFERENCE_Q } from '../transforms/splitBelowLabel'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from '../transforms/validateSplit'
import { inferN } from '../diagram/utils'

type HeaderAxis = 'rows' | 'columns'

export type HeaderWithBelow = {
  index: number
  id: string
  header: HeaderSpec
  belowLabels: string[]
}

export function headersWithBelow(
  headers: HeaderSpec[],
): HeaderWithBelow[] {
  return headers
    .map((header, index) => {
      const { belowLabels } = collectLabelsFromDict(header.arcs)
      if (belowLabels.length === 0 || !header.id) {
        return null
      }
      return { index, id: header.id, header, belowLabels }
    })
    .filter((x): x is HeaderWithBelow => x !== null)
}

export function formatHeaderOption(
  axis: HeaderAxis,
  candidate: HeaderWithBelow,
): string {
  const axisLabel = axis === 'columns' ? 'Col' : 'Row'
  return `${axisLabel} ${candidate.index} (below: ${candidate.belowLabels.join(', ')})`
}

export function SplitHeaderPanel() {
  const table = useTableStore((s) => s.table)
  const project = useTableStore((s) => s.project)
  const applySplitBelowLabel = useTableStore((s) => s.applySplitBelowLabel)
  const editorError = useTableStore((s) => s.editorError)

  const [axis, setAxis] = useState<HeaderAxis>('columns')
  const [sourceIndex, setSourceIndex] = useState<number | ''>('')
  const [belowLabel, setBelowLabel] = useState('')
  const [resultStageName, setResultStageName] = useState('')

  const candidates = useMemo(
    () => headersWithBelow(table[axis]),
    [table, axis],
  )

  useEffect(() => {
    if (
      sourceIndex !== '' &&
      !candidates.some((c) => c.index === sourceIndex)
    ) {
      setSourceIndex('')
      setBelowLabel('')
    }
  }, [candidates, sourceIndex])

  const selected = candidates.find((c) => c.index === sourceIndex)
  const belowOptions = selected?.belowLabels ?? []

  const preview = useMemo(() => {
    if (!selected || !belowLabel) {
      return null
    }
    try {
      const n = inferN(table)
      const parent = selected.header
      const parentCount = countAssignmentsForHeader(parent, n, REFERENCE_Q)
      const nonzeroCount = countParentBranchAssignments(
        parent,
        n,
        REFERENCE_Q,
        belowLabel,
        'nonzero',
      )
      const zeroCount = countParentBranchAssignments(
        parent,
        n,
        REFERENCE_Q,
        belowLabel,
        'zero',
      )
      const split = buildBelowLabelSplitChildren(parent, belowLabel, table)
      return {
        parentCount,
        nonzeroCount,
        zeroCount,
        partitionOk: nonzeroCount + zeroCount === parentCount,
        children: split.children,
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }, [selected, belowLabel, table])

  const defaultStageName = `${project.currentStage}-split-${belowLabel || 'label'}`

  const handleApply = () => {
    if (sourceIndex === '' || !belowLabel || !selected) return
    applySplitBelowLabel({
      axis,
      sourceId: selected.id,
      belowLabel,
      resultStageName: resultStageName.trim() || defaultStageName,
    })
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <div className="mb-2 font-medium text-slate-800">Split below-arc</div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-600">Axis</span>
          <select
            value={axis}
            onChange={(e) => {
              setAxis(e.target.value as HeaderAxis)
              setSourceIndex('')
              setBelowLabel('')
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="columns">Columns</option>
            <option value="rows">Rows</option>
          </select>
        </label>

        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-600">Header</span>
          <select
            value={sourceIndex === '' ? '' : String(sourceIndex)}
            onChange={(e) => {
              const next = e.target.value
              setSourceIndex(next === '' ? '' : Number(next))
              setBelowLabel('')
            }}
            className="min-w-[8rem] rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">Select…</option>
            {candidates.map((c) => (
              <option key={c.index} value={c.index}>
                {formatHeaderOption(axis, c)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-600">Below label</span>
          <select
            value={belowLabel}
            onChange={(e) => setBelowLabel(e.target.value)}
            disabled={sourceIndex === ''}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">Select…</option>
            {belowOptions.map((lb) => (
              <option key={lb} value={lb}>
                {lb}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-600">Result stage</span>
          <input
            type="text"
            value={resultStageName}
            onChange={(e) => setResultStageName(e.target.value)}
            placeholder={defaultStageName}
            className="w-40 rounded border border-slate-300 bg-white px-2 py-1"
          />
        </label>

        <button
          type="button"
          onClick={handleApply}
          disabled={sourceIndex === '' || !belowLabel}
          className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Apply split
        </button>
      </div>

      {preview && 'error' in preview && (
        <p className="mt-2 text-xs text-red-600">{preview.error}</p>
      )}

      {preview && !('error' in preview) && (
        <div className="mt-2 space-y-1 text-xs text-slate-600">
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
              : {c.header.restriction ?? '(no restriction)'}, count{' '}
              {c.header.expansionCount ?? '(from arcs)'}
            </p>
          ))}
        </div>
      )}

      {editorError && !editorError.startsWith('stage ') && (
        <p className="mt-2 text-xs text-red-600">{editorError}</p>
      )}
    </div>
  )
}
