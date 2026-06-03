import type { HeaderSpec } from '../types/characterTable'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { expansionCountLatex } from '../diagram/utils'
import { MathCell } from './MathCell'

export function ExpansionCountCell({ spec }: { spec: HeaderSpec }) {
  if (isExpansionCountMissing(spec)) {
    return (
      <span
        className="text-[10px] font-medium text-red-600"
        title="Set expansionCount in YAML whenever restriction is present"
      >
        expansionCount required
      </span>
    )
  }

  const latex = expansionCountLatex(spec)
  return (
    <div className="whitespace-nowrap" title={latex}>
      <MathCell latex={latex} />
    </div>
  )
}
