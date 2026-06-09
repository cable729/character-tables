import type { CharacterTable } from '../types/characterTable'
import { applyGroupSpecToTable, type GroupSpec } from './groupSpec'

function sampleArcTo(maxDot: number): number {
  return Math.min(3, maxDot)
}

export function createBlankTable(spec: GroupSpec): CharacterTable {
  const dots = spec.kind === 'ut_n' ? spec.n : spec.n * (spec.k + 1)
  const arcTo = sampleArcTo(dots)

  const rowArcs: Record<string, [number, number]> = {
    '\\alpha': [1, Math.min(2, dots)],
  }
  if (dots >= 3) {
    rowArcs['\\beta'] = [2, arcTo]
  }

  const base: CharacterTable = {
    columns: [
      {},
      {
        arcs: {
          above: {
            a: [1, arcTo],
          },
        },
      },
    ],
    rows: [
      {},
      {
        arcs: {
          above: rowArcs,
        },
      },
    ],
    matrix: [
      ['1', '1'],
      ['q', '0'],
    ],
  }

  return applyGroupSpecToTable(base, spec)
}
