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

export function formatExpansionBadge(
  breakdown: ExpansionBreakdown,
  q: number,
): string {
  if (breakdown.aboveLabels.length === 0 && breakdown.belowLabels.length === 0) {
    return '×1'
  }

  const parts: string[] = []
  if (breakdown.aboveLabels.length > 0) {
    const power = breakdown.aboveLabels.length
    parts.push(power === 1 ? '(q−1)' : `(q−1)^${power}`)
  }
  if (breakdown.belowLabels.length > 0) {
    const power = breakdown.belowLabels.length
    parts.push(power === 1 ? 'q' : `q^${power}`)
  }

  const formula = parts.join('·')
  if (breakdown.restrictedTotal !== breakdown.naiveTotal) {
    return `${formula} → ${breakdown.restrictedTotal} @ q=${q}`
  }
  return `${formula} = ${breakdown.restrictedTotal} @ q=${q}`
}
