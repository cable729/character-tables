import { useMemo } from 'react'
import {
  estimateSageRunTiming,
  getChecksPartition,
  runExpandedCountBalanceAtQ,
} from '../checks/registry'
import { isVerifierCheckId } from '../checks/sageRunPlan'
import { sageTableSignature } from '../sage/codegen'
import { findExpansionCountIssues } from '../schema/expansionCountValidation'
import { isSupercharacterTable } from '../schema/tableSchema'
import { useJupyterStore } from '../store/jupyterStore'
import type { CharacterTable } from '../types/characterTable'
import {
  isStructuralCheck,
  usesSageCheck,
} from './sageChecks/checkHelpers'
import { CONSOLE_HEADER_HEIGHT } from './sageChecks/constants'
import { SageChecksExpandedBody } from './sageChecks/SageChecksExpandedBody'
import {
  SUMMARY_ACCENT_BORDER,
  SUMMARY_ACCENT_TEXT,
} from './sageChecks/styles'
import { useCheckResolution } from './sageChecks/useCheckResolution'
import { useSageRunner } from './sageChecks/useSageRunner'
import { useSessionPrefs } from './sageChecks/useSessionPrefs'
import { useStructuralCheckResults } from './sageChecks/useStructuralCheckResults'

type SageChecksPanelProps = {
  table: CharacterTable
}

export function SageChecksPanel({ table }: SageChecksPanelProps) {
  const prefs = useSessionPrefs()
  const {
    expanded,
    setExpanded,
    panelHeight,
    qPoolInput,
    setQPoolInput,
    checkScope,
    setCheckScope,
    qPool,
    qList,
    toggleSelectedQ,
    handleResizeStart,
  } = prefs

  const status = useJupyterStore((s) => s.status)
  const executeSage = useJupyterStore((s) => s.executeSage)
  const cancelSageExecution = useJupyterStore((s) => s.cancelSageExecution)
  const isConnected = status === 'connected'
  const superTable = isSupercharacterTable(table)
  const expansionCountIssues = findExpansionCountIssues(table)
  const hasExpansionCountIssues = !superTable && expansionCountIssues.length > 0

  const qKey = `${checkScope}:${qList.join(',')}`
  const tableKey = useMemo(() => sageTableSignature(table), [table])

  const { enabled: enabledChecks, disabled: disabledChecks } = useMemo(
    () => getChecksPartition(table, qList, checkScope),
    [table, qList, checkScope],
  )

  const verifierChecks = useMemo(
    () => enabledChecks.filter((check) => isVerifierCheckId(check.id)),
    [enabledChecks],
  )
  const diagnosticChecks = useMemo(
    () => enabledChecks.filter((check) => !isVerifierCheckId(check.id)),
    [enabledChecks],
  )

  const structuralChecks = useMemo(
    () => enabledChecks.filter(isStructuralCheck),
    [enabledChecks],
  )
  const sageChecks = useMemo(
    () => enabledChecks.filter(usesSageCheck),
    [enabledChecks],
  )

  const structuralResults = useStructuralCheckResults(
    structuralChecks,
    table,
    qPool,
  )

  const sageBlocked = !isConnected || hasExpansionCountIssues

  const { sageState, handleStopSage, resolveSageCheckState } = useSageRunner({
    table,
    tableKey,
    qKey,
    checkScope,
    qList,
    sageChecks,
    sageBlocked,
    isConnected,
    hasExpansionCountIssues,
    superTable,
    executeSage,
    cancelSageExecution,
  })

  const { resolveCheckState, checkSummary } = useCheckResolution({
    enabledChecks,
    disabledCount: disabledChecks.length,
    sageBlocked,
    structuralResults,
    resolveSageCheckState,
    sageState,
    checkScope,
    isConnected,
    hasExpansionCountIssues,
  })

  const timingEstimate = useMemo(
    () =>
      estimateSageRunTiming({
        selectedQ: qList,
        scope: checkScope,
        sageCheckIds: sageChecks.map((c) => c.id),
      }),
    [qList, checkScope, sageChecks],
  )

  const expansionStatus = useMemo(() => {
    if (superTable) {
      return null
    }
    try {
      return qList.map((q) => ({
        q,
        ...runExpandedCountBalanceAtQ(table, q),
      }))
    } catch {
      return null
    }
  }, [table, qList, superTable])

  return (
    <div className="z-[var(--z-fab)] w-full shrink-0">
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-t-lg border border-b-0 border-slate-200 border-l-4 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm ${SUMMARY_ACCENT_BORDER[checkSummary.accent]}`}
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

        <div className="flex h-12 w-full shrink-0 items-stretch border-b border-slate-200">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={
              expanded ? 'Collapse Sage checks' : 'Expand Sage checks'
            }
            onClick={() => setExpanded((open) => !open)}
            className="flex min-w-0 flex-1 items-center gap-2 px-3 text-left hover:bg-slate-50"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center text-sm text-slate-500"
              aria-hidden
            >
              {expanded ? '▼' : '▲'}
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-800">
              Sage checks
            </span>
            <span className="flex min-w-0 flex-1 items-center truncate text-xs">
              {checkSummary.segments.map((segment, index) => (
                <span
                  key={`${index}-${segment.text}`}
                  className="flex min-w-0 items-center"
                >
                  {index > 0 && (
                    <span className="shrink-0 text-slate-400"> · </span>
                  )}
                  <span
                    className={
                      segment.muted
                        ? 'truncate text-slate-500'
                        : `truncate ${SUMMARY_ACCENT_TEXT[checkSummary.accent]}`
                    }
                  >
                    {segment.text}
                  </span>
                </span>
              ))}
            </span>
          </button>
          {sageState.phase === 'running' && !expanded && (
            <div className="mr-3 flex shrink-0 items-center gap-1.5 self-center">
              <span className="text-xs text-indigo-700">Running…</span>
              <button
                type="button"
                onClick={handleStopSage}
                className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-700"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <SageChecksExpandedBody
            table={table}
            superTable={superTable}
            isConnected={isConnected}
            hasExpansionCountIssues={hasExpansionCountIssues}
            expansionCountIssues={expansionCountIssues}
            expansionStatus={expansionStatus}
            checkScope={checkScope}
            setCheckScope={setCheckScope}
            qPoolInput={qPoolInput}
            setQPoolInput={setQPoolInput}
            qPool={qPool}
            qList={qList}
            toggleSelectedQ={toggleSelectedQ}
            timingEstimate={timingEstimate}
            enabledChecks={verifierChecks}
            diagnosticChecks={diagnosticChecks}
            disabledChecks={disabledChecks}
            sageChecks={sageChecks}
            sageBlocked={sageBlocked}
            sageState={sageState}
            handleStopSage={handleStopSage}
            resolveCheckState={resolveCheckState}
          />
        )}
      </div>
    </div>
  )
}
