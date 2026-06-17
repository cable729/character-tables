import type { TableCheck } from '../../checks/types'
import type { CharacterTable } from '../../types/characterTable'
import { CheckDescription } from './CheckDescription'
import { CheckRow } from './CheckRow'

export function DisabledCheckRowItem({
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
