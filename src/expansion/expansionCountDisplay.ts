import type { HeaderSpec } from '../types/characterTable'
import { collectLabelsFromDict, headerToDiagram } from '../diagram/utils'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { countChoices } from './countChoices'
import { evalQPolynomial } from './evalClassSize'

/** Symbolic expansion factor as LaTeX, e.g. (q-1)^{3} */
export function symbolicCountLatex(spec: HeaderSpec): string | null {
  const { aboveLabels, belowLabels } = collectLabelsFromDict(spec.arcs)

  if (aboveLabels.length === 0 && belowLabels.length === 0) {
    return null
  }

  const parts: string[] = []
  if (aboveLabels.length > 0) {
    parts.push(
      aboveLabels.length === 1 ? '(q-1)' : `(q-1)^{${aboveLabels.length}}`,
    )
  }
  if (belowLabels.length > 0) {
    parts.push(belowLabels.length === 1 ? 'q' : `q^{${belowLabels.length}}`)
  }

  return parts.join('')
}

/** True when YAML has a non-empty explicit expansionCount. */
export function hasExplicitExpansionCount(spec: HeaderSpec): boolean {
  return Boolean(spec.expansionCount?.trim())
}

/** Count implied by arcs only (ignores explicit expansionCount). */
export function calculatedExpansionCountLatex(spec: HeaderSpec): string {
  return symbolicCountLatex(spec) ?? '1'
}

/** LaTeX shown in grid; never throws. */
export function displayExpansionCountLatex(spec: HeaderSpec): string {
  if (hasExplicitExpansionCount(spec)) {
    return spec.expansionCount!.trim()
  }
  return calculatedExpansionCountLatex(spec)
}

/** Apply inline or dialog edit: omit expansionCount when it matches the calculated value. */
export function mergeExpansionCountAfterEdit(
  spec: HeaderSpec,
  committed: string,
): HeaderSpec {
  const trimmed = committed.trim()
  const calculated = calculatedExpansionCountLatex(spec)
  if (!trimmed || trimmed === calculated) {
    const { expansionCount: _, ...rest } = spec
    return rest
  }
  return { ...spec, expansionCount: trimmed }
}

/** Symbolic expansion factor for outer headers; identity patterns expand to 1. */
export function expansionCountLatex(spec: HeaderSpec): string {
  if (isExpansionCountMissing(spec)) {
    throw new Error('expansionCount is required when restriction is set')
  }
  if (spec.expansionCount) {
    return spec.expansionCount
  }
  return symbolicCountLatex(spec) ?? '1'
}

/** Numeric n_j at prime-power q. */
export function expansionCountAtQ(
  spec: HeaderSpec,
  n: number,
  q: number,
): number {
  if (isExpansionCountMissing(spec)) {
    throw new Error('expansionCount is required when restriction is set')
  }
  if (spec.expansionCount) {
    return evalQPolynomial(spec.expansionCount, q)
  }
  return countChoices(headerToDiagram(spec, n), q).total
}
