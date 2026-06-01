import type { Diagram, ExpansionSlice, HeaderSpec } from '../types/characterTable'
import { headerToDiagram } from '../diagram/utils'
import { collectLabels, enumerateAssignments } from './restrictions'

function assignmentLabelLatex(assignment: Record<string, number>): string {
  const entries = Object.entries(assignment)
  if (entries.length === 0) {
    return '1'
  }
  return entries.map(([k, v]) => `${k}=${v}`).join(',\\ ')
}

export function expandDiagram(
  diagram: Diagram | undefined,
  prefix: string,
  q: number,
): ExpansionSlice[] {
  if (!diagram) {
    return [{ id: prefix, assignment: {}, labelLatex: '?' }]
  }

  const { aboveLabels, belowLabels } = collectLabels(diagram)
  const assignments = enumerateAssignments(
    aboveLabels,
    belowLabels,
    q,
    diagram.restriction,
  )

  if (assignments.length === 0) {
    return [
      {
        id: `${prefix}_empty`,
        assignment: {},
        labelLatex: '\\text{∅}',
      },
    ]
  }

  return assignments.map((assignment, index) => ({
    id: `${prefix}_${index}`,
    assignment,
    labelLatex: assignmentLabelLatex(assignment),
  }))
}

export function expandHeader(
  spec: HeaderSpec,
  n: number,
  prefix: string,
  q: number,
): ExpansionSlice[] {
  return expandDiagram(headerToDiagram(spec, n), prefix, q)
}

export function expandRowOrCol(
  spec: HeaderSpec,
  n: number,
  index: number,
  q: number,
): ExpansionSlice[] {
  return expandHeader(spec, n, `h${index}`, q)
}

export function totalExpandedCount(
  items: HeaderSpec[],
  n: number,
  q: number,
): number {
  return items.reduce((sum, item, index) => {
    const slices = expandRowOrCol(item, n, index, q)
    return sum + slices.length
  }, 0)
}
