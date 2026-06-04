import type { HeaderSpec } from '../types/characterTable'
import {
  displayExpansionCountLatex,
  hasExplicitExpansionCount,
} from '../diagram/utils'
import { MathCell } from './MathCell'

export function ExpansionCountCell({
  spec,
  compact = false,
  maxLines = 2,
  columnWidthPx,
}: {
  spec: HeaderSpec
  compact?: boolean
  maxLines?: 1 | 2
  columnWidthPx?: number
}) {
  const latex = displayExpansionCountLatex(spec)
  const inferred = !hasExplicitExpansionCount(spec)
  return (
    <div
      className="whitespace-normal"
      title={
        inferred
          ? `${latex} — calculated from arcs`
          : latex
      }
    >
      <MathCell
        latex={latex}
        compact={compact}
        maxLines={maxLines}
        columnWidthPx={columnWidthPx}
      />
    </div>
  )
}
