import type { HeaderSpec } from '../types/characterTable'
import {
  displayExpansionCountLatex,
  hasExplicitExpansionCount,
} from '../diagram/utils'
import { MathCell } from './MathCell'

export function ExpansionCountCell({
  spec,
  compact = false,
}: {
  spec: HeaderSpec
  compact?: boolean
}) {
  const latex = displayExpansionCountLatex(spec)
  const inferred = !hasExplicitExpansionCount(spec)
  return (
    <div
      className="whitespace-nowrap"
      title={
        inferred
          ? `${latex} — calculated from arcs`
          : latex
      }
    >
      <MathCell latex={latex} compact={compact} />
    </div>
  )
}
