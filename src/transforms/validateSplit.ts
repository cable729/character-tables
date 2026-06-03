import type { HeaderSpec } from '../types/characterTable'
import {
  collectLabels,
  enumerateAssignments,
  satisfiesRestriction,
} from '../expansion/restrictions'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { headerToDiagram } from '../diagram/utils'

/** Assignment count; uses explicit expansionCount when the diagram is minimized. */
export function effectiveCountAtQ(
  spec: HeaderSpec,
  n: number,
  q: number,
): number {
  if (spec.expansionCount?.trim()) {
    return evalQPolynomial(spec.expansionCount, q)
  }
  return countAssignmentsForHeader(spec, n, q)
}

export function countAssignmentsForHeader(
  spec: HeaderSpec,
  n: number,
  q: number,
): number {
  const diagram = headerToDiagram(spec, n)
  const { aboveLabels, belowLabels } = collectLabels(diagram)
  return enumerateAssignments(
    aboveLabels,
    belowLabels,
    q,
    spec.restriction,
  ).length
}

export function countParentBranchAssignments(
  parent: HeaderSpec,
  n: number,
  q: number,
  belowLabel: string,
  branch: 'nonzero' | 'zero',
): number {
  const diagram = headerToDiagram(parent, n)
  const { aboveLabels, belowLabels } = collectLabels(diagram)
  const assignments = enumerateAssignments(
    aboveLabels,
    belowLabels,
    q,
    parent.restriction,
  )
  const extra =
    branch === 'nonzero' ? `${belowLabel}!=0` : `${belowLabel}=0`
  return assignments.filter((a) => satisfiesRestriction(extra, a)).length
}
