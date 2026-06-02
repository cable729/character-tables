import { describe, expect, it } from 'vitest'
import { buildCombinedSageCode } from './registry'
import { qValuesForDepth, sageCheckRunsInDepth } from './checkMode'
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

describe('checkMode', () => {
  it('quick mode uses one q and omits orthogonality', () => {
    expect(qValuesForDepth([2, 3, 5], 'quick')).toEqual([2])
    expect(sageCheckRunsInDepth('theta-sum', 'quick')).toBe(true)
    expect(sageCheckRunsInDepth('row-orthogonality', 'quick')).toBe(false)

    const code = buildCombinedSageCode(miniTable, [2, 3, 5], 'quick')
    expect(code).toContain('run_theta_sum_check("theta-sum", [2])')
    expect(code).not.toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality"',
    )
  })

  it('full mode includes orthogonality and all q values', () => {
    const code = buildCombinedSageCode(miniTable, [2, 3], 'full')
    expect(code).toContain(
      'run_row_orthogonality_check(TABLE, "row-orthogonality", [2, 3])',
    )
  })
})
