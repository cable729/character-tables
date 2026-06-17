import { describe, expect, it } from 'vitest'
import { buildCombinedSageCode } from './registry'
import {
  defaultSelectedQ,
  estimateSageRunTiming,
  intersectSelectedQ,
  sageCheckRunsInScope,
  sortSelectedQ,
} from './sageRunPlan'
import type { CharacterTable } from '../types/characterTable'

const miniTable: CharacterTable = {
  groupOrder: 'q',
  n: 2,
  columns: [{ classSize: '1' }, { classSize: '1' }],
  rows: [{}, {}],
  matrix: [
    ['1', '1'],
    ['1', 'q'],
  ],
}

describe('sageRunPlan', () => {
  it('runs verifier sage checks in verifier scope', () => {
    expect(sageCheckRunsInScope('conjugacy', 'verifier')).toBe(true)
    expect(sageCheckRunsInScope('row-orthogonality', 'verifier')).toBe(true)
    expect(sageCheckRunsInScope('column-orthogonality', 'verifier')).toBe(true)
    expect(sageCheckRunsInScope('theta-sum', 'verifier')).toBe(false)
  })

  it('includes diagnostics only in diagnostics scope', () => {
    expect(sageCheckRunsInScope('theta-sum', 'diagnostics')).toBe(true)
    expect(sageCheckRunsInScope('duplicate-irrep', 'diagnostics')).toBe(true)
    expect(sageCheckRunsInScope('row-orthogonality', 'diagnostics')).toBe(true)
  })

  it('intersects selected q with pool', () => {
    expect(intersectSelectedQ([2, 3, 5], [3, 5, 9])).toEqual([3, 5])
    expect(sortSelectedQ([5, 2, 3])).toEqual([2, 3, 5])
  })

  it('defaults to q=2 and q=3 when available', () => {
    expect(defaultSelectedQ([2, 3, 5])).toEqual([2, 3])
  })

  it('builds verifier code with row and column orthogonality', () => {
    const verifier = buildCombinedSageCode(miniTable, {
      selectedQ: [2, 3],
      scope: 'verifier',
    })
    expect(verifier).toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality", [2, 3])',
    )
    expect(verifier).toContain(
      'run_column_orthogonality_check(TABLE, "column-orthogonality", [2, 3])',
    )
    expect(verifier).not.toContain('run_theta_sum_check("theta-sum"')
  })

  it('includes diagnostics when scope is diagnostics', () => {
    const diagnostics = buildCombinedSageCode(miniTable, {
      selectedQ: [2],
      scope: 'diagnostics',
    })
    expect(diagnostics).toContain('run_theta_sum_check("theta-sum", [2])')
    expect(diagnostics).toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality", [2])',
    )
  })

  it('warns on long UT₄ orthogonality at q=5', () => {
    const est = estimateSageRunTiming({
      selectedQ: [5],
      scope: 'verifier',
      sageCheckIds: [
        'conjugacy',
        'row-orthogonality',
        'column-orthogonality',
      ],
    })
    expect(est.level).toBe('severe')
    expect(est.message).toContain('q = 5')
    expect(est.detail).toBeTruthy()
  })
})
