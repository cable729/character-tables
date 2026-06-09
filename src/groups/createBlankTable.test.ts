import { describe, expect, it } from 'vitest'
import { createBlankTable } from './createBlankTable'

describe('createBlankTable', () => {
  it('creates UT_n with n dots', () => {
    const table = createBlankTable({ kind: 'ut_n', n: 5 })
    expect(table.n).toBe(5)
    expect(table.group).toBe('UT_5(\\mathbb{F}_q)')
    expect(table.groupOrder).toBe('q^{10}')
    expect(table.groupSpec).toEqual({ kind: 'ut_n', n: 5 })
  })

  it('creates UT_n^(k) with n(k+1) dots', () => {
    const table = createBlankTable({ kind: 'ut_n_k', n: 3, k: 2 })
    expect(table.n).toBe(9)
    expect(table.group).toBe('UT_3^{(2)}(\\mathbb{F}_q)')
    expect(table.groupSpec).toEqual({ kind: 'ut_n_k', n: 3, k: 2 })
  })
})
