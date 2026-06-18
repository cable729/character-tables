import {
  SAGE_CHECK_SCOPE_LABELS,
  type SageCheckScope,
} from '../../checks/registry'
import type {
  ExpansionCountGuidance,
  ExpansionStatusRow,
} from '../../checks/expansionCountSummary'
import type { TableCheck } from '../../checks/types'
import {
  formatExpansionCountIssue,
  type ExpansionCountIssue,
} from '../../schema/expansionCountValidation'
import type { CharacterTable } from '../../types/characterTable'
import { MathCell } from '../MathCell'
import { SageRunningFab } from '../SageRunningFab'
import { CheckRowItem } from './CheckRowItem'
import { DisabledCheckRowItem } from './DisabledCheckRowItem'
import { TIMING_BOX_CLASS } from './styles'
import type { CheckRowState, SageRunState } from './types'

type TimingEstimate = {
  level: keyof typeof TIMING_BOX_CLASS
  message: string
  detail?: string
}

type SageChecksExpandedBodyProps = {
  table: CharacterTable
  superTable: boolean
  isConnected: boolean
  hasExpansionCountIssues: boolean
  expansionCountIssues: ExpansionCountIssue[]
  expansionStatus: ExpansionStatusRow[] | null
  expansionGuidance: ExpansionCountGuidance | null
  orthogonalityFailed: boolean
  checkScope: SageCheckScope
  setCheckScope: (scope: SageCheckScope) => void
  qPoolInput: string
  setQPoolInput: (value: string) => void
  qPool: number[]
  qList: number[]
  toggleSelectedQ: (q: number) => void
  timingEstimate: TimingEstimate
  enabledChecks: TableCheck[]
  diagnosticChecks?: TableCheck[]
  disabledChecks: { check: TableCheck; reason?: string }[]
  sageChecks: TableCheck[]
  sageBlocked: boolean
  sageState: SageRunState
  handleStopSage: () => void
  resolveCheckState: (check: TableCheck) => CheckRowState
}

function ChecksGuidance({
  expansionGuidance,
  orthogonalityFailed,
  allEnabledPass,
  orthogonalityDisabled,
}: {
  expansionGuidance: ExpansionCountGuidance | null
  orthogonalityFailed: boolean
  allEnabledPass: boolean
  orthogonalityDisabled: boolean
}) {
  let message: string | null = null
  let tone: 'amber' | 'blue' | 'emerald' = 'amber'

  if (expansionGuidance?.countsMismatch) {
    message = expansionGuidance.detail
    tone = 'amber'
  } else if (orthogonalityFailed) {
    message =
      'Row and column counts are balanced. Orthogonality checks are running — failures below show which row or column pairs do not satisfy the orthogonality relations.'
    tone = 'blue'
  } else if (allEnabledPass && orthogonalityDisabled) {
    message =
      'Structural checks pass; orthogonality checks not run (see disabled checks below).'
    tone = 'emerald'
  } else if (allEnabledPass) {
    message = 'All structural and orthogonality checks pass.'
    tone = 'emerald'
  }

  if (!message) {
    return null
  }

  const toneClass =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : tone === 'blue'
        ? 'border-blue-200 bg-blue-50 text-blue-950'
        : 'border-emerald-200 bg-emerald-50 text-emerald-950'

  return (
    <div className={`mb-3 rounded border px-3 py-2 text-sm ${toneClass}`}>
      {expansionGuidance?.countsMismatch && (
        <p className="mb-1 font-medium">{expansionGuidance.headline}</p>
      )}
      <p>{message}</p>
    </div>
  )
}

export function SageChecksExpandedBody({
  table,
  superTable,
  isConnected,
  hasExpansionCountIssues,
  expansionCountIssues,
  expansionStatus,
  expansionGuidance,
  orthogonalityFailed,
  checkScope,
  setCheckScope,
  qPoolInput,
  setQPoolInput,
  qPool,
  qList,
  toggleSelectedQ,
  timingEstimate,
  enabledChecks,
  diagnosticChecks = [],
  disabledChecks,
  sageChecks,
  sageBlocked,
  sageState,
  handleStopSage,
  resolveCheckState,
}: SageChecksExpandedBodyProps) {
  const allEnabledPass =
    !superTable &&
    enabledChecks.length > 0 &&
    enabledChecks.every((c) => resolveCheckState(c).status === 'pass')

  const orthogonalityDisabled = disabledChecks.some(
    ({ check }) =>
      check.id === 'row-orthogonality' || check.id === 'column-orthogonality',
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 px-4 py-2">
        <div className="flex flex-wrap gap-3">
          {!superTable && (
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs text-slate-600">
              <span>Checks to run</span>
              <select
                value={checkScope}
                onChange={(e) =>
                  setCheckScope(e.target.value as SageCheckScope)
                }
                className="rounded border border-slate-200 px-2 py-1 text-slate-800"
              >
                <option value="verifier">
                  {SAGE_CHECK_SCOPE_LABELS.verifier.label}
                </option>
                <option value="diagnostics">
                  {SAGE_CHECK_SCOPE_LABELS.diagnostics.label}
                </option>
              </select>
            </label>
          )}
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-slate-600">
            <span>Available test q (pool)</span>
            <input
              type="text"
              value={qPoolInput}
              onChange={(e) => setQPoolInput(e.target.value)}
              className="rounded border border-slate-200 px-2 py-1 font-mono text-slate-800"
              placeholder="2, 3, 5, 7"
            />
          </label>
        </div>
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <legend className="sr-only">Run checks at these q values</legend>
          <span className="w-full text-xs font-medium text-slate-600">
            Run at q
          </span>
          {qPool.map((q) => (
            <label
              key={q}
              className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-800"
            >
              <input
                type="checkbox"
                checked={qList.includes(q)}
                onChange={() => toggleSelectedQ(q)}
                className="rounded border-slate-300"
              />
              <MathCell latex={`q = ${q}`} />
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-slate-500">
          {superTable
            ? 'All four supercharacter checks run at each selected q.'
            : SAGE_CHECK_SCOPE_LABELS[checkScope].hint}
        </p>
        <div
          className={`rounded border px-2 py-1.5 text-xs ${TIMING_BOX_CLASS[timingEstimate.level]}`}
        >
          <p>{timingEstimate.message}</p>
          {timingEstimate.detail && (
            <p className="mt-1 opacity-90">{timingEstimate.detail}</p>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {!isConnected && (
          <p className="mb-3 text-sm text-slate-600">
            Connect to a local Jupyter Sage kernel (Server settings) to run
            numeric and symbolic spot-checks. Structural checks still run below.
          </p>
        )}

        {!superTable && (
          <ChecksGuidance
            expansionGuidance={expansionGuidance}
            orthogonalityFailed={orthogonalityFailed}
            allEnabledPass={allEnabledPass}
            orthogonalityDisabled={orthogonalityDisabled}
          />
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
            <ul className="space-y-1">
              {expansionStatus.map(
                ({
                  q,
                  rowTotal,
                  colTotal,
                  passes,
                  declaredRowTotal,
                  declaredColTotal,
                  declaredPasses,
                  declaredMatchesEnumerated,
                }) => (
                  <li key={q}>
                    <MathCell latex={`q = ${q}`} />
                    <ul className="ml-4 mt-0.5 list-disc space-y-0.5">
                      <li>
                        Enumerated: {rowTotal} characters, {colTotal} classes
                        {passes ? ' — square' : ' — not square'}
                      </li>
                      <li>
                        Declared (Choices): {declaredRowTotal} characters,{' '}
                        {declaredColTotal} classes
                        {declaredPasses ? ' — square' : ' — not square'}
                        {!declaredMatchesEnumerated && ' — differs from enumerated'}
                      </li>
                    </ul>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Verifier checks ({enabledChecks.length})
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
                />
              ))
            )}
          </section>

          {diagnosticChecks.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Diagnostics ({diagnosticChecks.length})
              </h3>
              {diagnosticChecks.map((check) => (
                <CheckRowItem
                  key={check.id}
                  check={check}
                  table={table}
                  state={resolveCheckState(check)}
                  sageState={sageState}
                />
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Disabled checks
              {disabledChecks.length > 0 ? ` (${disabledChecks.length})` : ''}
            </h3>
            {disabledChecks.length === 0 ? (
              <div className="space-y-1 text-xs text-slate-500">
                {superTable ? (
                  <p>None — all supercharacter checks are active.</p>
                ) : (
                  <p>
                    None — slice counts are square and match declared{' '}
                    <code className="font-mono">expansionCount</code> at every test{' '}
                    <MathCell latex="q" />.
                  </p>
                )}
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
      {sageState.phase === 'running' && !sageBlocked && (
        <SageRunningFab
          startedAt={sageState.startedAt}
          onStop={handleStopSage}
        />
      )}
    </div>
  )
}
