import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildCombinedSageCode,
  parseSageCheckResults,
  SAGE_CHECK_SCOPE_LABELS,
  type SageCheckScope,
} from '../../checks/registry'
import { sageCheckRunsInScope } from '../../checks/sageRunPlan'
import { SAGE_CONNECT_MESSAGE } from '../../checks/sageBlocked'
import type { CheckResult, TableCheck } from '../../checks/types'
import type { CharacterTable } from '../../types/characterTable'
import type { SageExecuteResult } from '../../jupyter/types'
import { SAGE_RUN_DEBOUNCE_MS } from './constants'
import type { CheckRowState, SageRunState } from './types'

type UseSageRunnerArgs = {
  table: CharacterTable
  tableKey: string
  qKey: string
  checkScope: SageCheckScope
  qList: number[]
  sageChecks: TableCheck[]
  sageBlocked: boolean
  isConnected: boolean
  hasExpansionCountIssues: boolean
  superTable: boolean
  executeSage: (code: string) => Promise<SageExecuteResult>
  cancelSageExecution: () => Promise<void>
}

export function useSageRunner({
  table,
  tableKey,
  qKey,
  checkScope,
  qList,
  sageChecks,
  sageBlocked,
  isConnected,
  hasExpansionCountIssues: _hasExpansionCountIssues,
  superTable,
  executeSage,
  cancelSageExecution,
}: UseSageRunnerArgs) {
  const [sageState, setSageState] = useState<SageRunState>({ phase: 'idle' })
  const [sageResults, setSageResults] = useState<
    Record<string, CheckResult>
  >({})

  const sageRunIdRef = useRef(0)
  const tableRef = useRef(table)
  const runPlanRef = useRef({ selectedQ: qList, scope: checkScope })
  tableRef.current = table
  runPlanRef.current = { selectedQ: qList, scope: checkScope }

  const handleStopSage = useCallback(() => {
    sageRunIdRef.current++
    void cancelSageExecution()
    setSageState({ phase: 'idle' })
    setSageResults({})
  }, [cancelSageExecution])

  useEffect(() => {
    if (sageBlocked || sageChecks.length === 0 || qList.length === 0) {
      setSageState({ phase: 'idle' })
      setSageResults({})
      return
    }

    setSageState({ phase: 'running', startedAt: Date.now() })
    setSageResults({})

    const runId = ++sageRunIdRef.current
    const timer = window.setTimeout(() => {
      const code = buildCombinedSageCode(tableRef.current, runPlanRef.current)

      void executeSage(code)
        .then((result) => {
          if (sageRunIdRef.current !== runId) return
          if (result.cancelled) {
            setSageState({ phase: 'idle' })
            return
          }
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
      sageRunIdRef.current++
      void cancelSageExecution()
    }
  }, [
    tableKey,
    qKey,
    checkScope,
    sageBlocked,
    executeSage,
    cancelSageExecution,
    sageChecks.length,
    qList.length,
  ])

  const resolveSageCheckState = useCallback(
    (check: TableCheck): CheckRowState => {
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
      if (!superTable && !sageCheckRunsInScope(check.id, checkScope)) {
        return {
          status: 'skipped',
          result: {
            passes: true,
            details: SAGE_CHECK_SCOPE_LABELS.diagnostics.hint,
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
    },
    [
      sageBlocked,
      isConnected,
      superTable,
      checkScope,
      sageState,
      sageResults,
    ],
  )

  return {
    sageState,
    sageResults,
    handleStopSage,
    resolveSageCheckState,
  }
}
