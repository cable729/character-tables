import type { HeaderSpec } from '../types/characterTable'
import { collectLabelsFromDict } from '../diagram/utils'

export type HeaderAxis = 'rows' | 'columns'

export type HeaderWithBelow = {
  index: number
  id: string
  header: HeaderSpec
  belowLabels: string[]
}

export function headersWithBelow(headers: HeaderSpec[]): HeaderWithBelow[] {
  return headers
    .map((header, index) => {
      const { belowLabels } = collectLabelsFromDict(header.arcs)
      if (belowLabels.length === 0 || !header.id) {
        return null
      }
      return { index, id: header.id, header, belowLabels }
    })
    .filter((x): x is HeaderWithBelow => x !== null)
}

export function formatHeaderOption(
  axis: HeaderAxis,
  candidate: HeaderWithBelow,
): string {
  const axisLabel = axis === 'columns' ? 'Col' : 'Row'
  return `${axisLabel} ${candidate.index} (below: ${candidate.belowLabels.join(', ')})`
}
