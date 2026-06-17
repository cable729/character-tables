import { describe, expect, it } from 'vitest'
import { ut3Example } from '../data/ut3Example'
import { passesRowOrthogonality } from './rowOrthogonality'

/** Primary orthogonality gate: example tables used in Sage verifier smoke tests. */
describe('row orthogonality (verifier examples)', () => {
  it('UT3 character table passes at q=2 and q=3', () => {
    expect(passesRowOrthogonality(ut3Example, 2)).toBe(true)
    expect(passesRowOrthogonality(ut3Example, 3)).toBe(true)
  })
})
