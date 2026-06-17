import { describe, expect, it } from 'vitest'
import { ut4Example } from '../data/ut4Example'
import { rowOrthogonalityAtQ } from './rowOrthogonality'
import {
  buildExpandedRowPreview,
  buildOrthogonalityFailureModel,
  buildOrthogonalityPairTable,
  normalizeAssignmentLabel,
  parseSliceKey,
  slicePreviewLabelLatex,
  slicePreviewTitleFromKey,
} from './orthogonalityDetails'
import { substituteCellForDisplay } from './substituteCell'

describe('parseSliceKey', () => {
  it('parses colon keys', () => {
    expect(parseSliceKey('0:0')).toEqual({ familyIndex: 0, sliceIndex: 0 })
    expect(parseSliceKey('1:2')).toEqual({ familyIndex: 1, sliceIndex: 2 })
  })

  it('parses legacy h-prefixed keys', () => {
    expect(parseSliceKey('h1.0')).toEqual({ familyIndex: 1, sliceIndex: 0 })
  })
})

describe('normalizeAssignmentLabel', () => {
  it('strips LaTeX backslash from Greek labels', () => {
    expect(normalizeAssignmentLabel('\\alpha')).toBe('alpha')
    expect(normalizeAssignmentLabel('a')).toBe('a')
  })
})

describe('substituteCellForDisplay', () => {
  it('uses LaTeX cdot between numeric factors', () => {
    expect(
      substituteCellForDisplay(
        '\\theta(\\alpha a)',
        { '\\alpha': 0 },
        { a: 1 },
      ),
    ).toBe('\\theta(0\\cdot 1)')
  })

  it('uses cdot in triple θ products', () => {
    const latex =
      '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    const row = { '\\alpha': 0, '\\beta': 0, '\\gamma': 1 }
    const col = { b: 1, a: 1, c: 0 }
    expect(substituteCellForDisplay(latex, row, col)).toBe(
      '\\theta(0\\cdot 1)\\theta(0\\cdot 1)\\theta(1\\cdot 0)',
    )
  })
})

describe('buildExpandedRowPreview', () => {
  it('includes assignment chips and substituted display latex for UT4 row 1:0', () => {
    const preview = buildExpandedRowPreview(ut4Example, 2, 1, 0)
    expect(preview.key).toBe('1:0')
    expect(preview.assignmentChips.map((c) => c.label)).toEqual(
      expect.arrayContaining(['alpha', 'beta', 'gamma']),
    )
    expect(preview.cells.length).toBeGreaterThan(0)
    const thetaCell = preview.cells.find((c) => c.key === '1:0')
    expect(thetaCell?.displayLatex).toContain('\\cdot')
    expect(thetaCell?.displayLatex).toContain('0')
  })
})

describe('slicePreviewLabelLatex', () => {
  it('uses LaTeX Greek symbols in row labels', () => {
    const preview = buildExpandedRowPreview(ut4Example, 2, 1, 0)
    const latex = slicePreviewLabelLatex(preview)
    expect(latex).toContain(String.raw`\text{Row }`)
    expect(latex).toContain(String.raw`\alpha=`)
    expect(latex).toContain(String.raw`\beta=`)
    expect(latex).toContain(String.raw`\gamma=`)
    expect(latex).not.toContain(String.raw`\ [`)
  })
})

describe('buildOrthogonalityPairTable', () => {
  it('builds a 2-row table with header row and column for row orthogonality', () => {
    const { bad } = rowOrthogonalityAtQ(ut4Example, 2, 1)
    const first = bad[0]!
    const pairTable = buildOrthogonalityPairTable(
      ut4Example,
      2,
      'row',
      first.a,
      first.b,
    )
    expect(pairTable).not.toBeNull()
    expect(pairTable!.rows).toHaveLength(2)
    expect(pairTable!.columns.length).toBeGreaterThan(0)
    expect(pairTable!.rows[0]!.cells).toHaveLength(pairTable!.columns.length)
    expect(pairTable!.columns[0]!.headerLatex).toContain(String.raw`\text{Col }`)
  })
})

describe('buildOrthogonalityFailureModel', () => {
  it('builds lightweight row orthogonality summaries without cell data', () => {
    const { bad, G } = rowOrthogonalityAtQ(ut4Example, 2, 5)
    expect(bad.length).toBeGreaterThan(0)
    const model = buildOrthogonalityFailureModel(
      'row-orthogonality',
      ut4Example,
      2,
      { groupOrder: G, badPairs: bad },
    )
    expect(model).not.toBeNull()
    expect(model?.axis).toBe('row')
    expect(model?.groupOrder).toBe(G)
    expect(model?.pairs.length).toBeGreaterThan(0)
    const first = model!.pairs[0]!
    expect(slicePreviewTitleFromKey(ut4Example, 2, 'row', first.aKey)).toMatch(
      /^Row 0/,
    )
    expect(first.aLabelLatex).toContain(String.raw`\text{Row }`)
    expect(first.ip).toBeTruthy()
    expect(first.expected).toBe('0')
  })

  it('returns null when bad pair keys cannot be resolved', () => {
    const model = buildOrthogonalityFailureModel(
      'row-orthogonality',
      ut4Example,
      2,
      { badPairs: [{ a: 'bad', b: 'worse', expected: 0 }] },
    )
    expect(model).toBeNull()
  })
})
