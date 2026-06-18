/**
 * Regression tests encoding bugs found while debugging orthogonality failures.
 * Each test maps to a concrete failure mode from session logs / cell diffs.
 */
import { describe, expect, it } from 'vitest'
import { ut3Example } from '../data/ut3Example'
import { ut4Example } from '../data/ut4Example'
import { expandRowOrCol } from './expandDiagram'
import { evalCellAtQ, makeAdditiveTheta } from './evalCell'
import { substituteCell } from './substituteCell'
import { rowOrthogonalityAtQ } from './rowOrthogonality'
import { columnOrthogonalityAtQ } from './columnOrthogonality'
import { expandedRowCells, weightedRowSum } from './expandedRowSum'

describe('orthogonality debug regressions', () => {
  describe('bug: θ inner "2 1" parsed as 21 (UT3 q=3, α=2,a=1)', () => {
    const q = 3
    const theta = makeAdditiveTheta(q)
    const latex = '\\theta(\\alpha a)'

    it('substitution must produce 2*1 not "2 1"', () => {
      expect(substituteCell(latex, { '\\alpha': 2 }, { a: 1 })).toBe('\\theta(2*1)')
    })

    it('α=2,a=1 must give θ(2)=ζ₃² not θ(0)=1', () => {
      const v = evalCellAtQ(latex, { '\\alpha': 2 }, { a: 1 }, q, theta)
      expect(v.re).toBeCloseTo(-0.5, 6)
      expect(v.im).toBeCloseTo(-0.8660254, 5)
    })

    it('α=1 and α=2 slices on row 1 differ at col 1:0', () => {
      const rows = ut3Example.rows.map((s, i) => expandRowOrCol(s, 3, i, q))
      const cols = ut3Example.columns.map((s, i) => expandRowOrCol(s, 3, i, q))
      const v10 = evalCellAtQ(
        latex,
        rows[1][0].assignment,
        cols[1][0].assignment,
        q,
        theta,
      )
      const v11 = evalCellAtQ(
        latex,
        rows[1][1].assignment,
        cols[1][0].assignment,
        q,
        theta,
      )
      expect(v10.im).not.toBeCloseTo(v11.im, 3)
    })
  })

  describe('bug: identical Sage rows for 1:0 and 1:1 (row assignment ignored)', () => {
    it('UT3 q=3 row orthogonality: 1:0 vs 1:1 must not have inner product |G|', () => {
      const { bad, G } = rowOrthogonalityAtQ(ut3Example, 3)
      const parallel = bad.find(
        (b) =>
          (b.a === '1:0' && b.b === '1:1') || (b.a === '1:1' && b.b === '1:0'),
      )
      expect(parallel).toBeUndefined()
      expect(G).toBe(27)
    })
  })

  describe('UT4 triple-θ row 1 cell (below labels α,β,γ)', () => {
    const latex = '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    const q = 2
    const theta = makeAdditiveTheta(q)

    it('substitution uses explicit products for 0*1 and 1*0 factors', () => {
      const row = { '\\alpha': 0, '\\beta': 0, '\\gamma': 1 }
      const col = { b: 1, a: 1, c: 0 }
      expect(substituteCell(latex, row, col)).toBe(
        '\\theta(0*1)\\theta(0*1)\\theta(1*0)',
      )
    })

    it('each θ factor evaluates on its own field element (not merged digits)', () => {
      const row = { '\\alpha': 0, '\\beta': 0, '\\gamma': 1 }
      const col = { b: 1, a: 1, c: 0 }
      // θ(0)*θ(0)*θ(0) = 1
      const v = evalCellAtQ(latex, row, col, q, theta)
      expect(v.re).toBeCloseTo(1, 10)
      expect(v.im).toBeCloseTo(0, 10)
    })
  })

  describe('UT4 orthogonality at q=2', () => {
    it('trivial row 0:0 is orthogonal to row 1 slices at q=2', () => {
      const { bad } = rowOrthogonalityAtQ(ut4Example, 2, 999)
      const fail = bad.filter(
        (b) =>
          (b.a === '0:0' && b.b.startsWith('1:')) ||
          (b.b === '0:0' && b.a.startsWith('1:')),
      )
      expect(fail).toEqual([])
    })

    it('trivial row 0:0 is orthogonal to row 4 slices at q=2', () => {
      const { bad } = rowOrthogonalityAtQ(ut4Example, 2, 999)
      const fail = bad.filter(
        (b) =>
          (b.a === '0:0' && b.b.startsWith('4:')) ||
          (b.b === '0:0' && b.a.startsWith('4:')),
      )
      expect(fail).toEqual([])
    })

    it('row 1:0 has weighted column sum 0 (orthogonal to trivial)', () => {
      const sum = weightedRowSum(ut4Example, 2, 1, 0)
      expect(sum.re).toBeCloseTo(0, 8)
      expect(sum.im).toBeCloseTo(0, 8)
    })

    it('documents non-1 cells on row 1:0 (debug anchor from session)', () => {
      const cells = expandedRowCells(ut4Example, 2, 1, 0)
      const interesting = cells
        .filter(
          (c) =>
            Math.abs(c.re - 1) > 1e-9 ||
            Math.abs(c.im) > 1e-9 ||
            c.latex === '0',
        )
        .map((c) => ({
          col: c.colKey,
          w: c.classWeight,
          re: c.re,
          latex: c.latex,
        }))
      expect(interesting).toMatchInlineSnapshot(`
        [
          {
            "col": "1:0",
            "latex": "\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)",
            "re": -1,
            "w": 8,
          },
          {
            "col": "1:2",
            "latex": "\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)",
            "re": -1,
            "w": 8,
          },
          {
            "col": "2:0",
            "latex": "\\theta(\\gamma b)",
            "re": -1,
            "w": 4,
          },
          {
            "col": "2:1",
            "latex": "\\theta(\\gamma b)",
            "re": -1,
            "w": 4,
          },
          {
            "col": "7:0",
            "latex": "\\theta(\\alpha a)\\theta(\\gamma b)",
            "re": -1,
            "w": 4,
          },
          {
            "col": "7:1",
            "latex": "\\theta(\\alpha a)\\theta(\\gamma b)",
            "re": -1,
            "w": 4,
          },
        ]
      `)
      expect(weightedRowSum(ut4Example, 2, 1, 0).re).toBeCloseTo(0, 8)
    })

    it('trivial row 0:0 is orthogonal to row 1:0', () => {
      const { bad } = rowOrthogonalityAtQ(ut4Example, 2, 20)
      const fail = bad.find((b) => b.a === '0:0' && b.b === '1:0')
      expect(fail).toBeUndefined()
    })

    it.each([2, 3] as const)('full row orthogonality passes at q=%s', (q) => {
      expect(rowOrthogonalityAtQ(ut4Example, q, 999).bad).toEqual([])
    })

    it.each([2, 3] as const)('full column orthogonality passes at q=%s', (q) => {
      expect(columnOrthogonalityAtQ(ut4Example, q, 999).bad).toEqual([])
    })
  })
})
