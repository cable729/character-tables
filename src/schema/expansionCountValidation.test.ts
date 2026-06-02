import { describe, expect, it } from 'vitest'
import { parseCharacterTable } from './tableSchema'
import {
  findExpansionCountIssues,
  formatExpansionCountIssue,
  isExpansionCountMissing,
} from './expansionCountValidation'
import type { CharacterTable } from '../types/characterTable'

describe('expansionCountValidation', () => {
  const baseTable: CharacterTable = {
    group: 'G',
    columns: [{ classSize: '1' }],
    rows: [{}],
    matrix: [['1']],
  }

  it('detects missing expansionCount when restriction is set', () => {
    const table: CharacterTable = {
      ...baseTable,
      columns: [
        {
          classSize: 'q',
          restriction: String.raw`\neg(a=b=0)`,
        },
      ],
    }
    expect(isExpansionCountMissing(table.columns[0])).toBe(true)
    expect(findExpansionCountIssues(table)).toEqual([
      {
        target: 'column',
        index: 0,
        restriction: String.raw`\neg(a=b=0)`,
      },
    ])
    expect(formatExpansionCountIssue(findExpansionCountIssues(table)[0]!)).toBe(
      'column 1: restriction set but expansionCount is missing',
    )
  })

  it('rejects parse when restriction lacks expansionCount', () => {
    expect(() =>
      parseCharacterTable({
        group: 'G',
        columns: [
          {
            classSize: 'q',
            restriction: String.raw`\neg(a=b=0)`,
          },
        ],
        rows: [{}],
        matrix: [['1']],
      }),
    ).toThrow(/expansionCount is required/)
  })

  it('accepts restricted header with expansionCount', () => {
    expect(() =>
      parseCharacterTable({
        group: 'G',
        columns: [
          {
            classSize: 'q',
            restriction: String.raw`\neg(a=b=0)`,
            expansionCount: 'q^{2} - 1',
          },
        ],
        rows: [{}],
        matrix: [['1']],
      }),
    ).not.toThrow()
  })
})
