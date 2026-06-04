import { describe, expect, it } from 'vitest'
import type { CharacterTable } from '../types/characterTable'
import { fillMissingExpansionCounts } from './fillMissingExpansionCounts'
import { isExpansionCountMissing } from './expansionCountValidation'

describe('fillMissingExpansionCounts', () => {
  it('infers expansionCount from arcs when restriction is set', () => {
    const table: CharacterTable = {
      group: 'G',
      columns: [
        {
          classSize: 'q',
          restriction: String.raw`\neg(a=b=0)`,
          arcs: { below: { a: [1, 2] }, above: { b: [2, 3] } },
        },
      ],
      rows: [{}],
      matrix: [['1']],
    }
    const next = fillMissingExpansionCounts(table)
    expect(next.columns[0]?.expansionCount).toBe('(q-1)q')
    expect(isExpansionCountMissing(next.columns[0]!)).toBe(false)
  })
})
