import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildCombinedSageCode,
  conjugacyCheckSymbolic,
  DEFAULT_CHECK_Q_VALUES,
  parseSageCheckAllOk,
  getChecksPartition,
  runExpandedCountBalanceAtQ,
  TABLE_CHECKS,
  type TableCheck,
} from '../checks/registry'
import { effectiveQValues } from '../checks/expansionReadiness'
import { clearExpandedTableCache } from '../checks/expandedTableAtQ'
import type { CheckResult } from '../checks/types'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
} from '../schema/expansionCountValidation'
import { useJupyterStore } from '../store/jupyterStore'
import type { CharacterTable } from '../types/characterTable'
import type { SageExecuteResult } from '../jupyter/types'
import { CheckResultDetails } from './checkFailureDetails'
import { MathCell } from './MathCell'

type SageChecksPanelProps = {
  table: CharacterTable
}

type SageRunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; result: SageExecuteResult; allOk: boolean | null }

type CheckStatus = 'pass' | 'fail' | 'running' | 'disabled' | 'pending'

function parseQValuesInput(input: string): number[] {
  const values = input
    .split(/[,;\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 2)
  return values.length > 0 ? values : [...DEFAULT_CHECK_Q_VALUES]
}

function CheckStatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'running') {
    return <span className="text-xs text-slate-500">Running…</span>
  }
  if (status === 'pending') {
    return <span className="text-xs text-slate-400">Pending</span>
  }
  if (status === 'disabled') {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Disabled
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
          <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
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

function CheckDescription({ check }: { check: TableCheck }) {
  const tierLatex =
    check.tier === 'symbolic'
      ? String.raw`\text{Tier: symbolic in } q \text{ (with numeric spot-check).}`
      : check.tier === 'structural'
        ? String.raw`\text{Tier: structural (no } q \text{ required).}`
        : String.raw`\text{Tier: numeric at each test } q.`

  return (
    <div className="space-y-3 text-sm text-slate-700">
      <MathCell latex={check.description} displayMode />
      <MathCell latex={check.formulaLatex} displayMode />
      <MathCell latex={tierLatex} className="text-xs text-slate-500" />
    </div>
  )
}

function ConjugacySymbolicTable({
  table,
}: {
  table: CharacterTable
}) {
  const breakdown = useMemo(() => {
    try {
      return conjugacyCheckSymbolic(table)
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
              <MathCell latex="n_j" />
            </th>
            <th className="px-2 py-1 font-medium">
              <MathCell latex="|C_j|" />
            </th>
            <th className="px-2 py-1 font-medium">
              <MathCell latex="n_j|C_j|" />
            </th>
          </tr>
        </thead>
        <tbody>
          {breakdown.columns.map((col) => (
            <tr key={col.index} className="border-b border-slate-100">
              <td className="px-2 py-1">{col.index}</td>
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
        </tbody>
      </table>
    </div>
  )
}

type LocalCheckState = {
  result: CheckResult | null
  status: CheckStatus
}

function useLocalCheckResults(
  checks: TableCheck[],
  table: CharacterTable,
  qValues: number[],
): Record<string, LocalCheckState> {
  const checkIds = checks.map((c) => c.id).join('\0')

  const [results, setResults] = useState<Record<string, LocalCheckState>>(() =>
    Object.fromEntries(
      checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
    ),
  )

  useEffect(() => {
    let cancelled = false
    clearExpandedTableCache(table)

    setResults(
      Object.fromEntries(
        checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
      ),
    )

    void (async () => {
      for (const check of checks) {
        if (cancelled) {
          return
        }
        setResults((prev) => ({
          ...prev,
          [check.id]: { status: 'running', result: null },
        }))
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0)
        })
        if (cancelled) {
          return
        }
        try {
          const result = check.runLocal(table, qValues)
          if (cancelled) {
            return
          }
          setResults((prev) => ({
            ...prev,
            [check.id]: {
              status: result.passes ? 'pass' : 'fail',
              result,
            },
          }))
        } catch {
          if (cancelled) {
            return
          }
          setResults((prev) => ({
            ...prev,
            [check.id]: { status: 'fail', result: null },
          }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [checkIds, table, qValues, checks])

  return results
}

export function SageChecksPanel({ table }: SageChecksPanelProps) {
  const status = useJupyterStore((s) => s.status)
  const executeSage = useJupyterStore((s) => s.executeSage)
  const isConnected = status === 'connected'
  const expansionCountIssues = findExpansionCountIssues(table)
  const hasExpansionCountIssues = expansionCountIssues.length > 0

  const [qInput, setQInput] = useState(DEFAULT_CHECK_Q_VALUES.join(', '))
  const qValues = useMemo(() => parseQValuesInput(qInput), [qInput])

  const [sageState, setSageState] = useState<SageRunState>({ phase: 'idle' })

  const qList = useMemo(() => effectiveQValues(qValues), [qValues])

  const { enabled: enabledChecks, disabled: disabledChecks } = useMemo(
    () => getChecksPartition(table, qList),
    [table, qList],
  )

  const expansionStatus = useMemo(() => {
    try {
      return qList.map((q) => ({
        q,
        ...runExpandedCountBalanceAtQ(table, q),
      }))
    } catch {
      return null
    }
  }, [table, qList])

  const localCheckResults = useLocalCheckResults(enabledChecks, table, qValues)

  const sageNeeded = enabledChecks.some((c) => c.buildSageCode)
  const sageBlocked = !isConnected || hasExpansionCountIssues

  useEffect(() => {
    if (sageBlocked) {
      setSageState({ phase: 'idle' })
      return
    }

    let cancelled = false
    setSageState({ phase: 'running' })

    const code = buildCombinedSageCode(table, qValues)

    void executeSage(code).then((result) => {
      if (cancelled) return
      setSageState({
        phase: 'done',
        result,
        allOk: result.success ? parseSageCheckAllOk(result.stdout) : null,
      })
    })

    return () => {
      cancelled = true
    }
  }, [table, qValues, sageBlocked, executeSage])

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-800">Sage checks</h2>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          <span>Test q values (comma-separated)</span>
          <input
            type="text"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="rounded border border-slate-200 px-2 py-1 font-mono text-slate-800"
            placeholder="2, 3, 5"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {!isConnected && (
          <p className="mb-3 text-sm text-slate-600">
            Connect to a local Jupyter Sage kernel (Server settings) to run Sage
            confirmation. Local checks still run below.
          </p>
        )}

        {hasExpansionCountIssues && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
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

        {expansionStatus && (
          <div className="mb-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="mb-1 font-medium">Expansion status (enumerated slices)</p>
            <ul className="space-y-0.5">
              {expansionStatus.map(({ q, rowTotal, colTotal, passes }) => (
                <li key={q}>
                  <MathCell latex={`q = ${q}`} />: {rowTotal} characters, {colTotal}{' '}
                  classes
                  {passes ? ' — square' : ' — not square'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Active checks ({enabledChecks.length})
            </h3>
            {enabledChecks.length === 0 ? (
              <p className="text-xs text-slate-500">None — fix disabled issues below.</p>
            ) : (
              enabledChecks.map((check) => (
                <CheckRowItem
                  key={check.id}
                  check={check}
                  table={table}
                  localState={
                    localCheckResults[check.id] ?? {
                      status: 'pending',
                      result: null,
                    }
                  }
                  sageState={sageState}
                  sageBlocked={sageBlocked}
                  isConnected={isConnected}
                />
              ))
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Disabled checks
              {disabledChecks.length > 0 ? ` (${disabledChecks.length})` : ''}
            </h3>
            {disabledChecks.length === 0 ? (
              <div className="space-y-1 text-xs text-slate-500">
                <p>
                  None — slice counts are square and match declared{' '}
                  <code className="font-mono">expansionCount</code> at every test{' '}
                  <MathCell latex="q" />.
                </p>
                {expansionStatus?.every((s) => s.passes) &&
                  expansionStatus.some(
                    (s) =>
                      s.rowTotal <= table.rows.length &&
                      s.colTotal <= table.columns.length,
                  ) && (
                    <p className="text-amber-800">
                      Counts match the condensed table size only (one slice per
                      header). If you expected UT₄-style expansion, use{' '}
                      <strong>Load UT₄ example</strong> — an older saved table
                      may still be in the browser.
                    </p>
                  )}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600">
                  Cannot run until the issues noted on each row are resolved.
                </p>
                {disabledChecks.map(({ check, reason }) => (
                  <DisabledCheckRowItem
                    key={check.id}
                    check={check}
                    table={table}
                    reason={reason}
                  />
                ))}
              </>
            )}
          </section>
        </div>

        {sageNeeded && sageState.phase === 'done' && !sageBlocked && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-slate-600">Sage kernel output</p>
            <pre
              className={`overflow-x-auto rounded border p-2 text-xs ${
                sageState.result.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {sageState.result.success
                ? sageState.result.stdout || '(ok, no stdout)'
                : sageState.result.error ?? sageState.result.stderr}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckRowItem({
  check,
  table,
  localState,
  sageState,
  sageBlocked,
  isConnected,
}: {
  check: TableCheck
  table: CharacterTable
  localState: LocalCheckState
  sageState: SageRunState
  sageBlocked: boolean
  isConnected: boolean
}) {
  const { result, status: localStatus } = localState

  const status: CheckStatus = (() => {
    if (localStatus === 'running' || localStatus === 'pending') {
      return localStatus
    }
    if (check.buildSageCode && !sageBlocked && sageState.phase === 'running') {
      return 'running'
    }
    return localStatus
  })()

  return (
    <CheckRow title={check.title} status={status}>
      <CheckDescription check={check} />

      {result && <CheckResultDetails checkId={check.id} result={result} />}

      {check.id === 'conjugacy' && table.groupOrder && (
        <ConjugacySymbolicTable table={table} />
      )}

      {check.buildSageCode && isConnected && (
        <p className="text-xs text-slate-500">
          Sage confirmation included in combined kernel run
          {sageState.phase === 'running' ? ' (running…)' : ''}.
        </p>
      )}
    </CheckRow>
  )
}

function DisabledCheckRowItem({
  check,
  table,
  reason,
}: {
  check: TableCheck
  table: CharacterTable
  reason?: string
}) {
  return (
    <CheckRow title={check.title} status="disabled">
      <CheckDescription check={check} />

      {reason && (
        <p className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
          {reason}
        </p>
      )}

      {check.requiresGroupOrder && !table.groupOrder && (
        <p className="text-xs text-slate-600">
          Add <code className="font-mono">groupOrder</code> to the table YAML (e.g.{' '}
          <code className="font-mono">q^{'{6}'}</code>).
        </p>
      )}
    </CheckRow>
  )
}
