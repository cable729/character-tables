import type { HeaderSpec } from '../types/characterTable'
import {
  collectLabels,
  enumerateAssignments,
  satisfiesRestriction,
} from '../expansion/restrictions'
import { headerToDiagram } from '../diagram/utils'

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
