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
  it('filters checks by scope', () => {
    expect(sageCheckRunsInScope('theta-sum', 'quick')).toBe(true)
    expect(sageCheckRunsInScope('row-orthogonality', 'quick')).toBe(false)
    expect(sageCheckRunsInScope('row-orthogonality', 'all')).toBe(true)
  })

  it('intersects selected q with pool', () => {
    expect(intersectSelectedQ([2, 3, 5], [3, 5, 9])).toEqual([3, 5])
    expect(sortSelectedQ([5, 2, 3])).toEqual([2, 3, 5])
  })

  it('defaults to q=2 when available', () => {
    expect(defaultSelectedQ([2, 3, 5])).toEqual([2])
  })

  it('builds code for selected q and scope', () => {
    const quick = buildCombinedSageCode(miniTable, {
      selectedQ: [2, 3],
      scope: 'quick',
    })
    expect(quick).toContain('run_theta_sum_check("theta-sum", [2, 3])')
    expect(quick).not.toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality"',
    )

    const all = buildCombinedSageCode(miniTable, {
      selectedQ: [2],
      scope: 'all',
    })
    expect(all).toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality", [2])',
    )
  })

  it('warns on long UT₄ all-check q=5 runs', () => {
    const est = estimateSageRunTiming({
      selectedQ: [5],
      scope: 'all',
      sageCheckIds: [
        'conjugacy',
        'row-orthogonality',
        'column-orthogonality',
        'theta-sum',
      ],
    })
    expect(est.level).toBe('severe')
    expect(est.message).toContain('q = 5')
    expect(est.detail).toBeTruthy()
  })
})
