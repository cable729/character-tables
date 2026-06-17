import { describe, expect, it } from 'vitest'
import {
  allowedSplitIndices,
  buildDisplayLatex,
  displayLatexForCell,
  formatMultilineDisplayLatex,
  greedySplitIndex,
  isValidSplitIndex,
  parseTopLevelFactors,
  splitLatexIntoLines,
} from './wrapDisplayLatex'
import { formatCompactDisplayLatex } from './formatDisplayLatex'
import { ut4Example } from '../data/ut4Example'
import { dataColumnMinWidthPx } from '../components/tableColumnWidths'
import {
  lineUnitBudgetFromColumnPx,
  maxWrappedLineUnits,
} from './wrapDisplayLatex'
import { estimateRenderUnits } from './renderUnits'

describe('displayLatexForCell', () => {
  it('merges theta only in compact mode', () => {
    const stored = '\\theta(\\alpha a)\\theta(\\beta b)'
    expect(displayLatexForCell(stored, false)).toBe(stored)
    expect(displayLatexForCell(stored, true)).toBe(
      formatCompactDisplayLatex(stored),
    )
  })
})

describe('isValidSplitIndex', () => {
  it('rejects scalar-only line 1', () => {
    const factors = ['q^2', '\\theta(\\alpha a)', '\\theta(\\beta b)']
    expect(isValidSplitIndex(1, factors)).toBe(false)
    expect(isValidSplitIndex(2, factors)).toBe(true)
  })
})

describe('allowedSplitIndices', () => {
  it('allows split after first theta when compact has two thetas', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const factors = parseTopLevelFactors(stored)
    expect(allowedSplitIndices(factors)).toEqual([2])
  })

  it('allows only delta breaks when compact has merged single theta', () => {
    const display = formatCompactDisplayLatex(
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)',
    )
    const factors = parseTopLevelFactors(display)
    expect(allowedSplitIndices(factors)).toEqual([2])
  })

  it('allows theta breaks in non-compact with two or more thetas', () => {
    const two = parseTopLevelFactors(
      '\\theta(\\alpha a)\\theta(\\beta b)',
    )
    expect(allowedSplitIndices(two)).toEqual([1])

    const qTwo = parseTopLevelFactors(
      'q^2\\theta(\\alpha a)\\theta(\\beta b)',
    )
    expect(allowedSplitIndices(qTwo)).toEqual([2])
  })
})

describe('greedySplitIndex', () => {
  it('prefers the largest prefix that fits the budget', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const factors = parseTopLevelFactors(stored)
    expect(greedySplitIndex(factors, 30, true)).toBe(2)
    expect(greedySplitIndex(factors, 8, true)).toBe(2)
  })
})

describe('splitLatexIntoLines', () => {
  it('keeps short literals on one line', () => {
    expect(splitLatexIntoLines('q', { lineUnitBudget: 40 })).toEqual(['q'])
    expect(splitLatexIntoLines('0', { lineUnitBudget: 40 })).toEqual(['0'])
  })

  it('wraps q^2 theta alpha on line 1 and theta beta on line 2 in compact', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: 9,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/q\^2/)
    expect(lines[0]).toMatch(/\\alpha a/)
    expect(lines[0]).not.toMatch(/\\beta b/)
    expect(lines[1]).toMatch(/\\beta b/)
    expect(lines[0]).not.toMatch(/^q\^2\s*\\cdot\s*$/)
  })

  it('does not split merged compact theta with three args on one line', () => {
    const stored =
      '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    const display = displayLatexForCell(stored, true)
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: 40,
    })
    expect(lines).toEqual([display])
  })

  it('splits after delta in compact mode', () => {
    const stored =
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)'
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: 8,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/\\delta_\{/)
    expect(lines[1]).toMatch(/\\theta/)
  })

  it('splits between three separate thetas in non-compact mode', () => {
    const stored =
      '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
    const lines = splitLatexIntoLines(stored, {
      compact: false,
      lineUnitBudget: 10,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/\\theta\([^)]*\)/)
    expect(lines[1]).toMatch(/\\theta/)
  })

  it('does not mutate stored latex', () => {
    const stored =
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)'
    splitLatexIntoLines(stored, { compact: true, lineUnitBudget: 10 })
    expect(stored).toBe(
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)',
    )
  })
})

describe('formatMultilineDisplayLatex', () => {
  it('wraps in gathered environment for centered lines', () => {
    expect(formatMultilineDisplayLatex(['a', 'b'])).toBe(
      '\\begin{gathered}a \\\\ b\\end{gathered}',
    )
  })
})

describe('q-polynomial parenthesized factors', () => {
  it('parses parenthesized multiplicative factors', () => {
    expect(parseTopLevelFactors('q(q-1)^2')).toEqual(['q', '(q-1)^2'])
    expect(parseTopLevelFactors('q(q - 1)')).toEqual(['q', '(q - 1)'])
    expect(parseTopLevelFactors('q(q-1)')).toEqual(['q', '(q-1)'])
    expect(parseTopLevelFactors('(q-1)^2q')).toEqual(['(q-1)^2', 'q'])
    expect(parseTopLevelFactors('(q^2-1)(q-1)')).toEqual(['(q^2-1)', '(q-1)'])
    expect(parseTopLevelFactors('-(q-1)')).toEqual(['-(q-1)'])
  })

  it('parses thin-space and row-label LaTeX without throwing', () => {
    const label = String.raw`\text{Row }0\,[\alpha=0, \beta=1]`
    expect(() => parseTopLevelFactors(label)).not.toThrow()
    expect(() =>
      buildDisplayLatex(label, { compact: true, maxLines: 2 }),
    ).not.toThrow()
  })

  it('does not corrupt q(q-1)^2 when wrapping under budget pressure', () => {
    const stored = 'q(q-1)^2'
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: 6,
    })
    expect(lines).toEqual(['q(q-1)^2'])
    const { displayLatex, wrapped } = buildDisplayLatex(stored, {
      compact: true,
      lineUnitBudget: 6,
      maxLines: 2,
    })
    expect(wrapped).toBe(false)
    expect(displayLatex).toBe('q(q-1)^2')
  })
})

describe('buildDisplayLatex', () => {
  it('returns single line when within budget', () => {
    const { displayLatex, wrapped } = buildDisplayLatex('1', {
      lineUnitBudget: 50,
    })
    expect(wrapped).toBe(false)
    expect(displayLatex).toBe('1')
  })

  it('wraps compact q^2 with two thetas when over budget', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const { wrapped, lines } = buildDisplayLatex(stored, {
      compact: true,
      lineUnitBudget: 9,
      maxLines: 2,
    })
    expect(wrapped).toBe(true)
    expect(lines[0]).toMatch(/\\alpha a/)
    expect(lines[1]).toMatch(/\\beta b/)
  })

  it('wraps q^2 two-theta cell in non-compact mode', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const lines = splitLatexIntoLines(stored, {
      compact: false,
      lineUnitBudget: 11,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/q\^2/)
    expect(lines[0]).toMatch(/\\alpha a/)
    expect(lines[1]).toMatch(/\\beta b/)
  })

  it('reports ut4 col7 delta cell line units for column sizing', () => {
    const stored =
      'q\\delta_{\\alpha a = \\beta b}\\theta(\\alpha a)\\theta(\\gamma b)'
    const wrapped = maxWrappedLineUnits(stored, true)
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: 14,
    })
    const lineUnitEstimates = lines.map((l) => estimateRenderUnits(l, true))
    expect(lines).toHaveLength(2)
    expect(lineUnitEstimates[0]!).toBeGreaterThan(lineUnitEstimates[1]!)
    expect(Math.max(wrapped, ...lineUnitEstimates)).toBeLessThanOrEqual(16)
  })

  it('wraps ut4 matrix cell using real column min-width budget', () => {
    const stored = 'q^2\\theta(\\alpha a)\\theta(\\beta b)'
    const colW = dataColumnMinWidthPx(ut4Example, 5, true)
    const budget = lineUnitBudgetFromColumnPx(colW, true)!
    const lines = splitLatexIntoLines(stored, {
      compact: true,
      lineUnitBudget: budget,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/\\alpha a/)
    expect(lines[0]).not.toMatch(/\\beta b/)
    expect(lines[1]).toMatch(/\\beta b/)
  })
})
