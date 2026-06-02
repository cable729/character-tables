import { useEffect, useMemo, useState } from 'react'
import {
  buildSageConjugacyCheckCode,
  conjugacyCheckSymbolic,
  DEFAULT_CHECK_Q_VALUES,
  parseSageCheckAllOk,
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

function checkIdentityLatex(groupOrder: string | undefined): string {
  if (!groupOrder) {
    return String.raw`\sum_j n_j |C_j| = |G|`
  }
  return String.raw`\sum_j n_j |C_j| = ${groupOrder} = |G|`
}

export function SageChecksPanel({ table }: SageChecksPanelProps) {
  const status = useJupyterStore((s) => s.status)
  const executeSage = useJupyterStore((s) => s.executeSage)
  const isConnected = status === 'connected'
  const missingGroupOrder = !table.groupOrder
  const expansionCountIssues = findExpansionCountIssues(table)
  const hasExpansionCountIssues = expansionCountIssues.length > 0

  const [checkState, setCheckState] = useState<CheckState>({ phase: 'idle' })

  const symbolicBreakdown = useMemo(() => {
    if (missingGroupOrder || hasExpansionCountIssues) return null
    try {
      return conjugacyCheckSymbolic(table)
    } catch {
      return null
    }
  }, [table, missingGroupOrder, hasExpansionCountIssues])

  useEffect(() => {
    if (!isConnected || missingGroupOrder || hasExpansionCountIssues) {
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
  }, [table, isConnected, missingGroupOrder, hasExpansionCountIssues, executeSage])

  const identityLatex = checkIdentityLatex(table.groupOrder)

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Sage checks</h2>
          {checkState.phase === 'done' && checkState.result.success && checkState.allOk != null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                checkState.allOk
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {checkState.allOk ? 'Pass' : 'Fail'}
            </span>
          )}
          {checkState.phase === 'running' && (
            <span className="text-xs text-slate-500">Running…</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {!isConnected && (
          <p className="text-sm text-slate-600">
            Connect to a local Jupyter Sage kernel (Server settings in the header) to run checks.
          </p>
        )}

        {isConnected && hasExpansionCountIssues && (
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
            <code className="font-mono">q^{'{6}'}</code>) to verify the conjugacy-class partition.
          </div>
        )}

        {(!isConnected || missingGroupOrder || hasExpansionCountIssues) && (
          <p className="mt-2 text-sm text-slate-500">
            <MathCell latex={identityLatex} displayMode />
          </p>
        )}

        {isConnected && !missingGroupOrder && !hasExpansionCountIssues && checkState.phase === 'done' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-800">
              <MathCell latex={identityLatex} displayMode />
            </p>

            {symbolicBreakdown && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">
                  Column breakdown in <MathCell latex="q" />
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="px-2 py-1 font-medium">
                          <MathCell latex="j" />
                        </th>
                        <th className="px-2 py-1 font-medium">
                          <MathCell latex="n_j" />
                        </th>
                        <th className="px-2 py-1 font-medium">
                          <MathCell latex="|C_j|" />
                        </th>
                        <th className="px-2 py-1 font-medium">
                          <MathCell latex="n_j |C_j|" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolicBreakdown.columns.map((col) => (
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
                          <MathCell latex={symbolicBreakdown.groupOrder} />
                        </td>
                      </tr>
                      <tr className="font-medium text-slate-800">
                        <td className="px-2 py-1" colSpan={3}>
                          <MathCell latex="|G|" />
                        </td>
                        <td className="px-2 py-1">
                          <MathCell latex={symbolicBreakdown.groupOrder} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">
                Numeric verification at{' '}
                <MathCell latex={`q \\in \\{${DEFAULT_CHECK_Q_VALUES.join(', ')}\\}`} />
              </p>
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
          </div>
        )}
      </div>
    </div>
  )
}
