import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  formatCheckSummary,
  type CheckSummaryAccent,
} from '../checks/checkSummary'
import { sageTableSignature } from '../sage/codegen'
import {
  buildCombinedSageCode,
  conjugacyCheckSymbolic,
  DEFAULT_CHECK_Q_VALUES,
  getChecksPartition,
  parseSageCheckResults,
  runExpandedCountBalanceAtQ,
  SAGE_CHECK_DEPTH_LABELS,
  type SageCheckDepth,
} from '../checks/registry'
import { qValuesForDepth, sageCheckRunsInDepth } from '../checks/checkMode'
import type { TableCheck } from '../checks/types'
import { SAGE_CONNECT_MESSAGE } from '../checks/sageBlocked'
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
  | { phase: 'running'; startedAt: number }
  | { phase: 'done'; result: SageExecuteResult }

const SAGE_RUN_DEBOUNCE_MS = 600
const CONSOLE_STORAGE_KEY = 'sage-checks-console'
const CONSOLE_MIN_HEIGHT = 160
const CONSOLE_DEFAULT_HEIGHT = 320
const CONSOLE_HEADER_HEIGHT = 48

function maxConsoleHeight(): number {
  return Math.floor(window.innerHeight * 0.85)
}

function clampConsoleHeight(height: number): number {
  return Math.min(maxConsoleHeight(), Math.max(CONSOLE_MIN_HEIGHT, height))
}

function loadConsolePrefs(): { expanded: boolean; panelHeight: number } {
  try {
    const raw = sessionStorage.getItem(CONSOLE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as {
        expanded?: boolean
        panelHeight?: number
      }
      return {
        expanded: Boolean(parsed.expanded),
        panelHeight: clampConsoleHeight(
          typeof parsed.panelHeight === 'number'
            ? parsed.panelHeight
            : CONSOLE_DEFAULT_HEIGHT,
        ),
      }
    }
  } catch {
    // ignore invalid storage
  }
  return { expanded: false, panelHeight: CONSOLE_DEFAULT_HEIGHT }
}

const SUMMARY_ACCENT_BORDER: Record<CheckSummaryAccent, string> = {
  pass: 'border-l-emerald-500',
  fail: 'border-l-red-500',
  warn: 'border-l-amber-500',
  pending: 'border-l-slate-300',
}

const SUMMARY_ACCENT_TEXT: Record<CheckSummaryAccent, string> = {
  pass: 'text-emerald-800',
  fail: 'text-red-800',
  warn: 'text-amber-800',
  pending: 'text-slate-600',
}

type CheckStatus =
  | 'pass'
  | 'fail'
  | 'running'
  | 'disabled'
  | 'pending'
  | 'blocked'
  | 'skipped'

function parseQValuesInput(input: string): number[] {
  const values = input
    .split(/[,;\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 2)
  return values.length > 0 ? values : [...DEFAULT_CHECK_Q_VALUES]
}

function isStructuralCheck(check: TableCheck): boolean {
  return check.tier === 'structural'
}

function CheckStatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'running') {
    return <span className="text-xs text-slate-500">Running…</span>
  }
  if (status === 'pending') {
    return <span className="text-xs text-slate-400">Pending</span>
  }
  if (status === 'skipped') {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Full only
      </span>
    )
  }
  if (status === 'blocked') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Needs Sage
      </span>
    )
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
      ? String.raw`\text{Tier: symbolic in } q \text{ (verified in Sage at each test } q\text{).}`
      : check.tier === 'structural'
        ? String.raw`\text{Tier: structural (no } q \text{ required).}`
        : String.raw`\text{Tier: numeric at each test } q \text{ (Sage kernel required).}`

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

type CheckRowState = {
  result: CheckResult | null
  status: CheckStatus
}

function useStructuralCheckResults(
  checks: TableCheck[],
  table: CharacterTable,
  qValues: number[],
): Record<string, CheckRowState> {
  const checkIds = checks.map((c) => c.id).join('\0')

  const [results, setResults] = useState<Record<string, CheckRowState>>(() =>
    Object.fromEntries(
      checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
    ),
  )

  useEffect(() => {
    let cancelled = false
    setResults(
      Object.fromEntries(
        checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
      ),
    )

    void (async () => {
      for (const check of checks) {
        if (cancelled) return
        setResults((prev) => ({
          ...prev,
          [check.id]: { status: 'running', result: null },
        }))
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
        if (cancelled) return
        try {
          const result = check.runLocal(table, qValues)
          if (cancelled) return
          setResults((prev) => ({
            ...prev,
            [check.id]: {
              status: result.passes ? 'pass' : 'fail',
              result,
            },
          }))
        } catch {
          if (cancelled) return
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
  const initialConsolePrefs = useMemo(() => loadConsolePrefs(), [])
  const [expanded, setExpanded] = useState(initialConsolePrefs.expanded)
  const [panelHeight, setPanelHeight] = useState(initialConsolePrefs.panelHeight)

  const status = useJupyterStore((s) => s.status)
  const executeSage = useJupyterStore((s) => s.executeSage)
  const isConnected = status === 'connected'
  const expansionCountIssues = findExpansionCountIssues(table)
  const hasExpansionCountIssues = expansionCountIssues.length > 0

  const [qInput, setQInput] = useState(DEFAULT_CHECK_Q_VALUES.join(', '))
  const [checkDepth, setCheckDepth] = useState<SageCheckDepth>('quick')
  const qValues = useMemo(() => parseQValuesInput(qInput), [qInput])

  const [sageState, setSageState] = useState<SageRunState>({ phase: 'idle' })
  const [sageResults, setSageResults] = useState<
    Record<string, CheckResult>
  >({})

  const qList = useMemo(
    () => qValuesForDepth(qValues, checkDepth),
    [qValues, checkDepth],
  )
  const qKey = `${checkDepth}:${qList.join(',')}`
  const tableKey = useMemo(() => sageTableSignature(table), [table])

  const { enabled: enabledChecks, disabled: disabledChecks } = useMemo(
    () => getChecksPartition(table, qList),
    [table, qList],
  )

  const structuralChecks = useMemo(
    () => enabledChecks.filter(isStructuralCheck),
    [enabledChecks],
  )
  const sageChecks = useMemo(
    () => enabledChecks.filter((c) => !isStructuralCheck(c)),
    [enabledChecks],
  )

  const structuralResults = useStructuralCheckResults(
    structuralChecks,
    table,
    qValues,
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

  const sageBlocked = !isConnected || hasExpansionCountIssues
  const sageRunIdRef = useRef(0)
  const tableRef = useRef(table)
  const qValuesRef = useRef(qValues)
  tableRef.current = table
  qValuesRef.current = qValues

  useEffect(() => {
    if (sageBlocked || sageChecks.length === 0) {
      setSageState({ phase: 'idle' })
      setSageResults({})
      return
    }

    setSageState({ phase: 'running', startedAt: Date.now() })
    setSageResults({})

    const runId = ++sageRunIdRef.current
    const timer = window.setTimeout(() => {
      const code = buildCombinedSageCode(
        tableRef.current,
        qValuesRef.current,
        checkDepth,
      )

      void executeSage(code)
        .then((result) => {
          if (sageRunIdRef.current !== runId) return
          setSageState({ phase: 'done', result })
          if (result.success) {
            const parsed = parseSageCheckResults(result.stdout)
            const byId: Record<string, CheckResult> = {}
            for (const [id, checkResult] of parsed) {
              byId[id] = checkResult
            }
            setSageResults(byId)
          } else {
            setSageResults({})
          }
        })
        .catch((err: unknown) => {
          if (sageRunIdRef.current !== runId) return
          const message = err instanceof Error ? err.message : String(err)
          setSageState({
            phase: 'done',
            result: {
              stdout: '',
              stderr: '',
              error: message,
              success: false,
            },
          })
          setSageResults({})
        })
    }, SAGE_RUN_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [tableKey, qKey, checkDepth, sageBlocked, executeSage, sageChecks.length])

  function resolveCheckState(check: TableCheck): CheckRowState {
    if (isStructuralCheck(check)) {
      return (
        structuralResults[check.id] ?? {
          status: 'pending',
          result: null,
        }
      )
    }
    if (sageBlocked) {
      return {
        status: 'blocked',
        result: {
          passes: false,
          blocked: true,
          blockReason: !isConnected
            ? SAGE_CONNECT_MESSAGE
            : 'Fix expansionCount metadata before running Sage checks.',
        },
      }
    }
    if (!sageCheckRunsInDepth(check.id, checkDepth)) {
      return {
        status: 'skipped',
        result: {
          passes: true,
          details: SAGE_CHECK_DEPTH_LABELS.full.hint,
        },
      }
    }
    if (sageState.phase === 'running') {
      return { status: 'running', result: null }
    }
    if (sageState.phase === 'done' && !sageState.result.success) {
      return {
        status: 'fail',
        result: {
          passes: false,
          details: sageState.result.error ?? sageState.result.stderr,
        },
      }
    }
    const result = sageResults[check.id]
    if (!result) {
      return {
        status: 'fail',
        result: {
          passes: false,
          details: 'No result from Sage for this check.',
        },
      }
    }
    return {
      status: result.passes ? 'pass' : 'fail',
      result,
    }
  }

  const checkSummary = useMemo(() => {
    const enabledStatuses = enabledChecks.map(
      (check) => resolveCheckState(check).status,
    )
    return formatCheckSummary({
      enabledStatuses,
      disabledCount: disabledChecks.length,
      sageBlocked,
    })
  }, [
    enabledChecks,
    disabledChecks.length,
    sageBlocked,
    structuralResults,
    sageState,
    sageResults,
    checkDepth,
    isConnected,
    hasExpansionCountIssues,
  ])

  useEffect(() => {
    sessionStorage.setItem(
      CONSOLE_STORAGE_KEY,
      JSON.stringify({ expanded, panelHeight }),
    )
  }, [expanded, panelHeight])

  const handleResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startY = e.clientY
      const startHeight = panelHeight

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault()
        const delta = startY - ev.clientY
        setPanelHeight(clampConsoleHeight(startHeight + delta))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [panelHeight],
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col">
      <div
        className={`pointer-events-auto relative flex flex-col overflow-hidden rounded-t-lg border border-b-0 border-slate-200 border-l-4 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm ${SUMMARY_ACCENT_BORDER[checkSummary.accent]}`}
        style={
          expanded
            ? { height: panelHeight }
            : { height: CONSOLE_HEADER_HEIGHT }
        }
      >
        {expanded && (
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize Sage checks panel"
            className="absolute inset-x-0 top-0 z-10 h-1.5 cursor-ns-resize touch-none"
            onPointerDown={handleResizeStart}
          />
        )}

        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 px-3">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={
              expanded ? 'Collapse Sage checks' : 'Expand Sage checks'
            }
            onClick={() => setExpanded((open) => !open)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <span className="text-sm" aria-hidden>
              {expanded ? '▼' : '▲'}
            </span>
          </button>
          <h2 className="shrink-0 text-sm font-semibold text-slate-800">
            Sage checks
          </h2>
          <p
            className={`min-w-0 flex-1 truncate text-xs ${SUMMARY_ACCENT_TEXT[checkSummary.accent]}`}
          >
            {checkSummary.text}
          </p>
        </div>

        {expanded && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 px-4 py-2">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-[8rem] flex-col gap-1 text-xs text-slate-600">
            <span>Check depth</span>
            <select
              value={checkDepth}
              onChange={(e) => setCheckDepth(e.target.value as SageCheckDepth)}
              className="rounded border border-slate-200 px-2 py-1 text-slate-800"
            >
              <option value="quick">{SAGE_CHECK_DEPTH_LABELS.quick.label}</option>
              <option value="full">{SAGE_CHECK_DEPTH_LABELS.full.label}</option>
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-slate-600">
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
        <p className="text-xs text-slate-500">
          {SAGE_CHECK_DEPTH_LABELS[checkDepth].hint}
          {checkDepth === 'quick' &&
            ` Using q=${qList[0]} only.`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {!isConnected && (
          <p className="mb-3 text-sm text-slate-600">
            Connect to a local Jupyter Sage kernel (Server settings) to run
            numeric and symbolic spot-checks. Structural checks still run below.
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
                  state={resolveCheckState(check)}
                  sageState={sageState}
                  checkDepth={checkDepth}
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

        {sageChecks.length > 0 &&
          sageState.phase === 'running' &&
          !sageBlocked &&
          checkDepth === 'full' && (
            <p className="mt-4 text-xs text-slate-500">
              Full checks running… UT₄ at q=5 can take many minutes (row
              orthogonality and duplicate-irrep are the slowest).
            </p>
          )}

        {sageChecks.length > 0 && sageState.phase === 'done' && !sageBlocked && (
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
        )}
      </div>
    </div>
  )
}

function CheckRowItem({
  check,
  table,
  state,
  sageState,
  checkDepth,
}: {
  check: TableCheck
  table: CharacterTable
  state: CheckRowState
  sageState: SageRunState
  checkDepth: SageCheckDepth
}) {
  const { result, status } = state

  return (
    <CheckRow title={check.title} status={status}>
      <CheckDescription check={check} />

      {result?.blocked && result.blockReason && (
        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          {result.blockReason}
        </p>
      )}

      {result && !result.blocked && (
        <CheckResultDetails checkId={check.id} result={result} />
      )}

      {check.id === 'conjugacy' && table.groupOrder && (
        <ConjugacySymbolicTable table={table} />
      )}

      {status === 'skipped' && (
        <p className="text-xs text-slate-500">
          Not run in quick mode. Switch check depth to Full.
        </p>
      )}

      {check.requiresSage &&
        sageCheckRunsInDepth(check.id, checkDepth) &&
        sageState.phase === 'running' &&
        status === 'running' && (
          <p className="text-xs text-slate-500">Running in Sage kernel…</p>
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
