import type { HeaderSpec } from '../types/characterTable'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { countChoices } from './countChoices'
import { evalQPolynomial } from './evalClassSize'
import { headerToDiagram } from '../diagram/utils'

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
