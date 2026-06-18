import { describe, expect, it } from 'vitest'
import type { HeaderSpec } from '../types/characterTable'
import { makeAdditiveTheta } from './evalCell'
import {
  basicSubsetFromHeader,
  dSubsetR,
  eExponent,
  evaluateAndreFromLabelMaps,
  evaluateAndreTheorem51,
  isBasic,
  isRegular,
  rootKey,
  scStar,
} from './andreTheorem51'

describe('andreTheorem51', () => {
  it('detects basic vs non-basic subsets', () => {
    expect(isBasic(new Set([rootKey(1, 3), rootKey(2, 4)]))).toBe(true)
    expect(isBasic(new Set([rootKey(1, 2), rootKey(1, 3)]))).toBe(false)
  })

  it('computes Sc* and e(D,D′) when D ⊆ R(D′)', () => {
    const D = new Set([rootKey(1, 3), rootKey(2, 4)])
    const Dprime = new Set([rootKey(1, 3), rootKey(2, 4)])
    expect(dSubsetR(D, Dprime)).toBe(true)
    expect([...scStar(D)].sort()).toEqual([rootKey(2, 3), rootKey(3, 4)].sort())
    expect(eExponent(D, Dprime, 4)).toBe(2)
  })

  it('returns 0 when D ⊄ R(D′)', () => {
    const D = new Set([rootKey(1, 3), rootKey(2, 4)])
    const Dprime = new Set([rootKey(1, 2), rootKey(3, 4)])
    expect(isRegular(1, 3, Dprime)).toBe(false)
    expect(dSubsetR(D, Dprime)).toBe(false)
  })

  it('extracts basic subset from header arcs', () => {
    const header: HeaderSpec = {
      arcs: {
        below: { '\\alpha': [1, 2] },
        above: { '\\beta': [2, 4] },
      },
    }
    const data = basicSubsetFromHeader(header, { '\\alpha': 2, '\\beta': 1 }, 4)
    expect(data).not.toBeNull()
    expect([...data!.roots].sort()).toEqual([rootKey(1, 2), rootKey(2, 4)].sort())
    expect(data!.phi.get(rootKey(1, 2))).toBe(2)
  })

  it('evaluates Theorem 5.1 with q-power when class root is absent', () => {
    const q = 3
    const theta = makeAdditiveTheta(q)
    const rowHeader: HeaderSpec = {
      arcs: { below: { '\\alpha': [1, 3] } },
    }
    const v = evaluateAndreTheorem51(
      rowHeader,
      { '\\alpha': 1 },
      {},
      {},
      4,
      q,
      theta,
    )
    expect(v.re).toBe(3)
    expect(v.im).toBeCloseTo(0, 8)
  })

  it('returns 0 for non-basic active roots on the same row', () => {
    const q = 3
    const theta = makeAdditiveTheta(q)
    const rowHeader: HeaderSpec = {
      arcs: {
        below: { '\\alpha': [1, 2], '\\beta': [1, 3] },
      },
    }
    const colHeader: HeaderSpec = { arcs: { below: { a: [1, 2] } } }
    const v = evaluateAndreTheorem51(
      rowHeader,
      { '\\alpha': 1, '\\beta': 2 },
      colHeader,
      { a: 1 },
      4,
      q,
      theta,
    )
    expect(v.re).toBe(0)
    expect(v.im).toBe(0)
  })

  it('evaluates from explicit label→root maps (andre API)', () => {
    const q = 3
    const theta = makeAdditiveTheta(q)
    const charRoots = { '\\alpha': [1, 3] as [number, number] }
    const classRoots = { a: [1, 3] as [number, number] }
    const v = evaluateAndreFromLabelMaps(
      charRoots,
      { '\\alpha': 1 },
      classRoots,
      { a: 2 },
      4,
      q,
      theta,
    )
    expect(v.re).toBeCloseTo(-1.5, 5)
    expect(v.im).toBeCloseTo(-2.598076, 5)
  })
})
