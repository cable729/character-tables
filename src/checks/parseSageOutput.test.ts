import { describe, expect, it } from 'vitest'
import { parseSageCheckAllOk, parseSageCheckResults } from './parseSageOutput'

describe('parseSageOutput', () => {
  it('parses global all_ok', () => {
    expect(parseSageCheckAllOk('all_ok=True')).toBe(true)
    expect(parseSageCheckAllOk('all_ok=False')).toBe(false)
  })

  it('parses details_json with numeric fields', () => {
    const stdout =
      'CHECK id=conjugacy q=5 ok=True details_json={"sumAtQ":15625,"groupOrderAtQ":15625,"columns":[{"nAtQ":1,"sizeAtQ":1}]}\n'
    const map = parseSageCheckResults(stdout)
    const result = map.get('conjugacy')
    expect(result?.passes).toBe(true)
    const details = result?.perQ?.[0].details as { sumAtQ: number }
    expect(details.sumAtQ).toBe(15625)
  })

  it('aggregates per-q CHECK lines by check id', () => {
    const stdout = [
      'CHECK id=degree-sum q=2 ok=True',
      'CHECK id=degree-sum q=3 ok=False details_json={"sumSq":"4"}',
      'CHECK id=row-orthogonality q=2 ok=True',
    ].join('\n')
    const map = parseSageCheckResults(stdout)
    expect(map.get('degree-sum')?.passes).toBe(false)
    expect(map.get('degree-sum')?.perQ).toHaveLength(2)
    expect(map.get('row-orthogonality')?.passes).toBe(true)
  })
})
