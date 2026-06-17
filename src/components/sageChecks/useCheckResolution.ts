import { useMemo } from 'react'
import { formatCheckSummary } from '../../checks/checkSummary'
import { isVerifierCheckId } from '../../checks/sageRunPlan'
import type { TableCheck } from '../../checks/types'
import { isStructuralCheck, usesSageCheck } from './checkHelpers'
import type { CheckRowState, SageRunState } from './types'

type UseCheckResolutionArgs = {
  enabledChecks: TableCheck[]
  disabledCount: number
  sageBlocked: boolean
  structuralResults: Record<string, CheckRowState>
  resolveSageCheckState: (check: TableCheck) => CheckRowState
  sageState: SageRunState
  checkScope: string
  isConnected: boolean
  hasExpansionCountIssues: boolean
}

export function useCheckResolution({
  enabledChecks,
  disabledCount,
  sageBlocked,
  structuralResults,
  resolveSageCheckState,
  sageState,
  checkScope,
  isConnected,
  hasExpansionCountIssues,
}: UseCheckResolutionArgs) {
  function resolveCheckState(check: TableCheck): CheckRowState {
    if (isStructuralCheck(check)) {
      const structural =
        structuralResults[check.id] ?? {
          status: 'pending' as const,
          result: null,
        }
      if (!usesSageCheck(check)) {
        return structural
      }
      if (structural.status !== 'pass') {
        return structural
      }
      return resolveSageCheckState(check)
    }
    return resolveSageCheckState(check)
  }

  const checkSummary = useMemo(() => {
    const verifierChecks = enabledChecks.filter((check) =>
      isVerifierCheckId(check.id),
    )
    const enabledStatuses = verifierChecks.map(
      (check) => resolveCheckState(check).status,
    )
    const diagnosticSkipped = enabledChecks.filter(
      (check) =>
        !isVerifierCheckId(check.id) &&
        resolveCheckState(check).status === 'skipped',
    ).length
    return formatCheckSummary({
      enabledStatuses,
      disabledCount,
      sageBlocked,
      diagnosticSkipped,
    })
  }, [
    enabledChecks,
    disabledCount,
    sageBlocked,
    structuralResults,
    sageState,
    checkScope,
    isConnected,
    hasExpansionCountIssues,
  ])

  return { resolveCheckState, checkSummary }
}
