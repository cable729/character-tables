import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildSageConjugacyCheckCode,
  conjugacyCheckAtQ,
  conjugacyCheckSymbolic,
  DEFAULT_CHECK_Q_VALUES,
  parseSageCheckAllOk,
  type ConjugacyCheckBreakdown,
  type SymbolicConjugacyCheckBreakdown,
} from '../checks/conjugacyClassOrderCheck'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import { useJupyterStore } from '../store/jupyterStore'
import type { CharacterTable } from '../types/characterTable'
import type { SageExecuteResult } from '../jupyter/types'
import { MathCell } from './MathCell'

type SageChecksPanelProps = {
  table: CharacterTable
}

type CheckState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; result: SageExecuteResult; allOk: boolean | null }

type CheckStatus = 'pass' | 'fail' | 'running' | 'blocked' | 'pending'

function checkIdentityLatex(groupOrder: string | undefined): string {
  if (!groupOrder) {
    return String.raw`\sum_j n_j |C_j| = |G|`
  }
  return String.raw`\sum_j n_j |C_j| = ${groupOrder} = |G|`
}

function CheckStatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'running') {
    return <span className="text-xs text-slate-500">Running…</span>
  }
  if (status === 'pending') {
    return <span className="text-xs text-slate-400">Pending</span>
  }
  if (status === 'blocked') {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Blocked
      </span>
    )
  }
  if (status === 'pass') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Pass
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Fail
    </span>
  )
}

function CheckRow({
  title,
  status,
  children,
}: {
  title: string
  status: CheckStatus
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded border border-slate-200">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="shrink-0 text-[10px] text-slate-400"
            aria-hidden
          >
            {expanded ? '▼' : '▶'}
          </span>
          <span className="text-sm font-medium text-slate-800">{title}</span>
        </div>
        <CheckStatusBadge status={status} />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-slate-200 px-3 py-3">{children}</div>
      )}
    </div>
  )
}

function BreakdownTableHeader() {
  return (
    <thead>
      <tr className="border-b border-slate-200 text-left text-slate-600">
        <th className="px-2 py-1 font-medium">
          <MathCell latex="j" />
        </th>
        <th className="px-2 py-1 font-medium">
          <div className="flex flex-col gap-0.5">
            <span>
              <MathCell latex="n_j" /> = class choices
            </span>
            <span className="text-[10px] font-normal text-slate-500">
              conjugacy classes per column
            </span>
          </div>
        </th>
        <th className="px-2 py-1 font-medium">
          <div className="flex flex-col gap-0.5">
            <span>
              <MathCell latex="|C_j|" />
            </span>
            <span className="text-[10px] font-normal text-slate-500">
              class size
            </span>
          </div>
        </th>
        <th className="px-2 py-1 font-medium">
          <MathCell latex="n_j |C_j|" />
        </th>
      </tr>
    </thead>
  )
}

function SymbolicBreakdownTable({
  breakdown,
}: {
  breakdown: SymbolicConjugacyCheckBreakdown
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <BreakdownTableHeader />
        <tbody>
          {breakdown.columns.map((col) => (
            <tr key={col.index} className="border-b border-slate-100">
              <td className="px-2 py-1">
                <MathCell latex={String(col.index)} />
              </td>
              <td className="px-2 py-1">
                <MathCell latex={col.nSymbolic} />
              </td>
              <td className="px-2 py-1">
                <MathCell latex={col.classSize} />
              </td>
              <td className="px-2 py-1">
                <MathCell latex={col.weightedSymbolic} />
              </td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 font-medium text-slate-800">
            <td className="px-2 py-1" colSpan={3}>
              <MathCell latex={String.raw`\sum_j n_j |C_j|`} />
            </td>
            <td className="px-2 py-1">
              <MathCell latex={breakdown.groupOrder} />
            </td>
          </tr>
          <tr className="font-medium text-slate-800">
            <td className="px-2 py-1" colSpan={3}>
              <MathCell latex="|G|" />
            </td>
            <td className="px-2 py-1">
              <MathCell latex={breakdown.groupOrder} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function NumericBreakdownTable({ breakdown }: { breakdown: ConjugacyCheckBreakdown }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <BreakdownTableHeader />
        <tbody>
          {breakdown.columns.map((col) => (
            <tr key={col.index} className="border-b border-slate-100">
              <td className="px-2 py-1">
                <MathCell latex={String(col.index)} />
              </td>
              <td className="px-2 py-1">{col.nAtQ}</td>
              <td className="px-2 py-1">{col.sizeAtQ}</td>
              <td className="px-2 py-1">{col.weightedAtQ}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 font-medium text-slate-800">
            <td className="px-2 py-1" colSpan={3}>
              <MathCell latex={String.raw`\sum_j n_j |C_j|`} />
            </td>
            <td className="px-2 py-1">{breakdown.sumAtQ}</td>
          </tr>
          <tr className="font-medium text-slate-800">
            <td className="px-2 py-1" colSpan={3}>
              <MathCell latex="|G|" />
            </td>
            <td className="px-2 py-1">{breakdown.groupOrderAtQ}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ConjugacyClassCheckDetails({
  table,
  checkState,
  symbolicBreakdown,
  qBreakdowns,
}: {
  table: CharacterTable
  checkState: CheckState
  symbolicBreakdown: SymbolicConjugacyCheckBreakdown | null
  qBreakdowns: ConjugacyCheckBreakdown[] | null
}) {
  const identityLatex = checkIdentityLatex(table.groupOrder)

  return (
    <>
      <p className="text-sm text-slate-800">
        <MathCell latex={identityLatex} displayMode />
      </p>

      {symbolicBreakdown && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">
            Column breakdown in <MathCell latex="q" /> (symbolic)
          </p>
          <SymbolicBreakdownTable breakdown={symbolicBreakdown} />
        </div>
      )}

      {qBreakdowns && qBreakdowns.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-600">
            Numeric evaluation at{' '}
            <MathCell latex={`q \\in \\{${DEFAULT_CHECK_Q_VALUES.join(', ')}\\}`} />
          </p>
          {qBreakdowns.map((breakdown, index) => {
            const q = DEFAULT_CHECK_Q_VALUES[index]
            return (
              <div key={q}>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-700">
                    <MathCell latex={`q = ${q}`} />
                  </p>
                  <CheckStatusBadge status={breakdown.passes ? 'pass' : 'fail'} />
                </div>
                <NumericBreakdownTable breakdown={breakdown} />
              </div>
            )
          })}
        </div>
      )}

      {checkState.phase === 'done' && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">Sage kernel output</p>
          <pre
            className={`overflow-x-auto rounded border p-2 text-xs ${
              checkState.result.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {checkState.result.success
              ? checkState.result.stdout || '(ok, no stdout)'
              : checkState.result.error ?? checkState.result.stderr}
          </pre>
        </div>
      )}
    </>
  )
}

export function SageChecksPanel({ table }: SageChecksPanelProps) {
  const status = useJupyterStore((s) => s.status)
  const executeSage = useJupyterStore((s) => s.executeSage)
  const isConnected = status === 'connected'
  const missingGroupOrder = !table.groupOrder
  const expansionCountIssues = findExpansionCountIssues(table)
  const hasExpansionCountIssues = expansionCountIssues.length > 0
  const conjugacyBlocked =
    !isConnected || missingGroupOrder || hasExpansionCountIssues

  const [checkState, setCheckState] = useState<CheckState>({ phase: 'idle' })

  const symbolicBreakdown = useMemo(() => {
    if (missingGroupOrder || hasExpansionCountIssues) return null
    try {
      return conjugacyCheckSymbolic(table)
    } catch {
      return null
    }
  }, [table, missingGroupOrder, hasExpansionCountIssues])

  const qBreakdowns = useMemo(() => {
    if (missingGroupOrder || hasExpansionCountIssues) return null
    try {
      return DEFAULT_CHECK_Q_VALUES.map((q) => conjugacyCheckAtQ(table, q))
    } catch {
      return null
    }
  }, [table, missingGroupOrder, hasExpansionCountIssues])

  useEffect(() => {
    if (conjugacyBlocked) {
      setCheckState({ phase: 'idle' })
      return
    }

    let cancelled = false
    setCheckState({ phase: 'running' })

    const code = buildSageConjugacyCheckCode(table, DEFAULT_CHECK_Q_VALUES)

    void executeSage(code).then((result) => {
      if (cancelled) return

      setCheckState({
        phase: 'done',
        result,
        allOk: result.success ? parseSageCheckAllOk(result.stdout) : null,
      })
    })

    return () => {
      cancelled = true
    }
  }, [table, conjugacyBlocked, executeSage])

  const conjugacyStatus: CheckStatus = (() => {
    if (conjugacyBlocked) return 'blocked'
    if (checkState.phase === 'running') return 'running'
    if (checkState.phase === 'idle') return 'pending'
    if (!checkState.result.success || checkState.allOk == null) return 'fail'
    return checkState.allOk ? 'pass' : 'fail'
  })()

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-800">Sage checks</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {!isConnected && (
          <p className="mb-3 text-sm text-slate-600">
            Connect to a local Jupyter Sage kernel (Server settings in the header) to run
            checks.
          </p>
        )}

        <div className="space-y-2">
          <CheckRow title="Conjugacy class sizes are correct" status={conjugacyStatus}>
            {hasExpansionCountIssues && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
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

            {isConnected && missingGroupOrder && !hasExpansionCountIssues && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Add <code className="font-mono">groupOrder</code> to the table YAML (e.g.{' '}
                <code className="font-mono">q^{'{6}'}</code>) to verify the conjugacy-class
                partition.
              </div>
            )}

            {!conjugacyBlocked && (
              <ConjugacyClassCheckDetails
                table={table}
                checkState={checkState}
                symbolicBreakdown={symbolicBreakdown}
                qBreakdowns={qBreakdowns}
              />
            )}

            {conjugacyBlocked && !hasExpansionCountIssues && !missingGroupOrder && (
              <p className="text-sm text-slate-500">
                <MathCell latex={checkIdentityLatex(table.groupOrder)} displayMode />
              </p>
            )}
          </CheckRow>
        </div>
      </div>
    </div>
  )
}
