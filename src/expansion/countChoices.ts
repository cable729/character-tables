import type { Diagram, ExpansionBreakdown } from '../types/characterTable'
import {
  collectLabels,
  enumerateAssignments,
  naiveChoiceCount,
} from './restrictions'

export function countChoices(
  diagram: Diagram,
  q: number,
): ExpansionBreakdown & { total: number } {
  const { aboveLabels, belowLabels } = collectLabels(diagram)
  const naiveTotal = naiveChoiceCount(aboveLabels, belowLabels, q)
  const assignments = enumerateAssignments(
    aboveLabels,
    belowLabels,
    q,
    diagram.restriction,
  )

  return {
    aboveLabels,
    belowLabels,
    naiveTotal,
    restrictedTotal: assignments.length,
    total: assignments.length,
  }
}
