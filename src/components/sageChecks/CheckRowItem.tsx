import type { TableCheck } from '../../checks/types'
import type { CharacterTable } from '../../types/characterTable'
import { CheckResultDetails } from '../checkFailureDetails'
import { CheckDescription } from './CheckDescription'
import { CheckRow } from './CheckRow'
import { ConjugacySymbolicTable } from './ConjugacySymbolicTable'
import { SuperclassSizesSymbolicTable } from './SuperclassSizesSymbolicTable'
import type { CheckRowState, SageRunState } from './types'

export function CheckRowItem({
  check,
  table,
  state,
  sageState,
}: {
  check: TableCheck
  table: CharacterTable
  state: CheckRowState
  sageState: SageRunState
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
        <CheckResultDetails checkId={check.id} result={result} table={table} />
      )}

      {check.id === 'conjugacy' && table.groupOrder && (
        <ConjugacySymbolicTable table={table} />
      )}

      {check.id === 'superchar-superclass-sizes' && table.groupOrder && (
        <SuperclassSizesSymbolicTable table={table} />
      )}

      {status === 'skipped' && (
        <p className="text-xs text-slate-500">
          Not run — switch “Checks to run” to Include diagnostics.
        </p>
      )}

      {check.requiresSage &&
        sageState.phase === 'running' &&
        status === 'running' && (
          <p className="text-xs text-slate-500">Running in Sage kernel…</p>
        )}
    </CheckRow>
  )
}
