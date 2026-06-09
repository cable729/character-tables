import { useEffect, useId, useState } from 'react'
import type { GroupSpec } from '../types/characterTable'
import { dotCount, formatGroupLatex } from '../groups/groupSpec'
import { MathCell } from './MathCell'

type GroupPickerProps = {
  initialSpec: GroupSpec
  actionLabel: string
  onSubmit: (spec: GroupSpec) => void
}

function specFromForm(kind: GroupSpec['kind'], n: number, k: number): GroupSpec {
  if (kind === 'ut_n_k') {
    return { kind: 'ut_n_k', n, k }
  }
  return { kind: 'ut_n', n }
}

export function GroupPicker({ initialSpec, actionLabel, onSubmit }: GroupPickerProps) {
  const fieldId = useId()
  const [kind, setKind] = useState<GroupSpec['kind']>(initialSpec.kind)
  const [n, setN] = useState(
    initialSpec.kind === 'ut_n' ? initialSpec.n : initialSpec.n,
  )
  const [k, setK] = useState(initialSpec.kind === 'ut_n_k' ? initialSpec.k : 1)

  useEffect(() => {
    setKind(initialSpec.kind)
    setN(initialSpec.n)
    setK(initialSpec.kind === 'ut_n_k' ? initialSpec.k : 1)
  }, [initialSpec])

  const spec = specFromForm(kind, n, k)
  const dots = dotCount(spec)
  const groupLatex = formatGroupLatex(spec)

  const handleSubmit = () => {
    onSubmit(spec)
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-slate-600">Group type</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`group-kind-${fieldId}`}
            checked={kind === 'ut_n'}
            onChange={() => setKind('ut_n')}
          />
          <span>
            <MathCell latex="UT_n(\mathbb{F}_q)" className="inline" />
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`group-kind-${fieldId}`}
            checked={kind === 'ut_n_k'}
            onChange={() => setKind('ut_n_k')}
          />
          <span>
            <MathCell latex="UT_n^{(k)}(\mathbb{F}_q)" className="inline" />
          </span>
        </label>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">n</span>
        <input
          type="number"
          min={2}
          value={n}
          onChange={(e) => setN(Math.max(2, Number(e.target.value) || 2))}
          className="w-20 rounded border border-slate-300 px-2 py-1"
        />
      </label>

      {kind === 'ut_n_k' && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">k</span>
          <input
            type="number"
            min={1}
            value={k}
            onChange={(e) => setK(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded border border-slate-300 px-2 py-1"
          />
        </label>
      )}

      <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-1">
          <span>Group:</span>
          <MathCell latex={groupLatex} className="inline" />
        </div>
        <div>Dots: {dots}</div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
      >
        {actionLabel}
      </button>
    </div>
  )
}
