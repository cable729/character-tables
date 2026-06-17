import { formatCompactDisplayLatex } from './formatDisplayLatex'
import { estimateRenderUnits, estimateRenderUnitsForWrap } from './renderUnits'

export type WrapDisplayOptions = {
  compact?: boolean
  maxLines?: 1 | 2
  /** Max render units per line before wrapping (from column width). */
  lineUnitBudget?: number
}

export type SplitLineOptions = WrapDisplayOptions & {
  /** @deprecated Splitting uses stored latex factors, then formats each line. */
  displayLatex?: string
}

const DEFAULT_LINE_UNIT_BUDGET = 14
const WRAP_SAFETY = 1.02

/** Budget multiplier applied to column px → units (leave margin for KaTeX). */
const LINE_BUDGET_MARGIN = 0.88

/** Display string shown in the cell (compact merges θ; non-compact keeps stored form). */
export function displayLatexForCell(latex: string, compact: boolean): string {
  const trimmed = latex.trim()
  if (!trimmed) {
    return trimmed
  }
  return compact ? formatCompactDisplayLatex(trimmed) : trimmed
}

function findMatchingParen(s: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '(') {
      depth++
    } else if (s[i] === ')') {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return s.length - 1
}

function findMatchingBrace(s: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '{') {
      depth++
    } else if (s[i] === '}') {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return s.length - 1
}

/** Optional `^n` or `^{n}` immediately after a parenthesized factor. */
function trailingExponentEnd(s: string, closeIdx: number): number {
  const after = s.slice(closeIdx + 1)
  const exp = after.match(/^(\^[0-9]+|\^\{[0-9]+\})/)
  return closeIdx + (exp ? exp[0].length : 0)
}

/** Top-level multiplicative factors (stored or display LaTeX). */
export function parseTopLevelFactors(latex: string): string[] {
  const factors: string[] = []
  let i = 0
  const s = latex

  while (i < s.length) {
    if (/\s/.test(s[i]!)) {
      i++
      continue
    }
    const start = i
    const rest = s.slice(i)

    let factorEnd = -1

    if (rest.startsWith('\\neg(')) {
      factorEnd = findMatchingParen(s, i + 4)
    } else if (rest.startsWith('\\delta_{')) {
      factorEnd = findMatchingBrace(s, i + 7)
    } else if (rest.startsWith('\\theta\\!\\left(')) {
      const leftStart = i + '\\theta\\!\\left('.length - 1
      const close = s.indexOf('\\right)', leftStart + 1)
      factorEnd = close >= 0 ? close + '\\right)'.length - 1 : findMatchingParen(s, leftStart)
    } else if (rest.startsWith('\\theta(')) {
      factorEnd = findMatchingParen(s, i + 6)
    } else if (rest.startsWith('(')) {
      const close = findMatchingParen(s, i)
      factorEnd = trailingExponentEnd(s, close)
    } else if (/^q(\^[0-9]+)?/.test(rest)) {
      const m = rest.match(/^q(\^[0-9]+)?/)!
      factorEnd = i + m[0].length - 1
    } else if (rest.startsWith('-(')) {
      const close = findMatchingParen(s, i + 1)
      factorEnd = trailingExponentEnd(s, close)
    } else if (/^[0-9]+/.test(rest)) {
      const m = rest.match(/^[0-9]+/)!
      factorEnd = i + m[0].length - 1
    } else if (rest.startsWith('\\')) {
      const m =
        rest.match(/^\\[a-zA-Z]+(\*?)?/) ?? rest.match(/^\\[^a-zA-Z]/)
      if (!m) {
        i++
        continue
      }
      let end = i + m[0].length - 1
      if (s[end + 1] === '{') {
        end = findMatchingBrace(s, end + 1)
      } else if (s[end + 1] === '(') {
        end = findMatchingParen(s, end + 1)
      }
      factorEnd = end
    } else {
      i++
      continue
    }

    factors.push(s.slice(start, factorEnd + 1).trim())
    i = factorEnd + 1
  }

  return factors.filter(Boolean)
}

function isSeparateThetaFactor(factor: string): boolean {
  return /^\\theta\([^)]*\)$/.test(factor)
}

function isDeltaFactor(factor: string): boolean {
  return /^\\delta_\{/.test(factor)
}

function isScalarFactor(factor: string): boolean {
  return /^(q(\^[0-9]+)?|[0-9]+)$/.test(factor)
}

/** Reject splits that leave only q (or a lone scalar) on line 1. */
export function isValidSplitIndex(k: number, factors: string[]): boolean {
  const line1 = factors.slice(0, k)
  if (line1.length === 1 && isScalarFactor(line1[0]!)) {
    return false
  }
  return k >= 1 && k < factors.length
}

/**
 * Valid split indices k: line1 = factors[0..k-1], line2 = factors[k..].
 */
export function allowedSplitIndices(factors: string[]): number[] {
  const allowed: number[] = []
  const thetaCount = factors.filter(isSeparateThetaFactor).length

  for (let k = 1; k < factors.length; k++) {
    if (!isValidSplitIndex(k, factors)) {
      continue
    }

    const left = factors[k - 1]!
    const right = factors[k]!

    if (isDeltaFactor(left)) {
      allowed.push(k)
      continue
    }

    if (
      isSeparateThetaFactor(left) &&
      isSeparateThetaFactor(right) &&
      thetaCount >= 2
    ) {
      allowed.push(k)
    }
  }

  return allowed
}

/** When needsWrap but no rule matched, pick largest valid k (greedy line 1). */
function fallbackSplitIndex(factors: string[]): number | null {
  for (let k = factors.length - 1; k >= 1; k--) {
    if (isValidSplitIndex(k, factors)) {
      return k
    }
  }
  return null
}

function formatFactorsAsLine(factors: string[], compact: boolean): string {
  const joined = factors.join('')
  if (!joined) {
    return ''
  }
  return compact ? formatCompactDisplayLatex(joined) : joined
}

function lineUnits(factors: string[], compact: boolean): number {
  const formatted = formatFactorsAsLine(factors, compact)
  return estimateRenderUnits(formatted, compact)
}

function prefixLineUnits(
  factors: string[],
  endIndex: number,
  compact: boolean,
): number {
  return lineUnits(factors.slice(0, endIndex), compact)
}

function needsContinuationMarker(line: string, nextLine: string): boolean {
  const trimmed = line.trim()
  if (!nextLine.trim()) {
    return false
  }
  if (/^(0|1)$/.test(trimmed)) {
    return false
  }
  return /^\\theta|\\delta|\\neg/.test(nextLine.trim())
}

/** True when content should use two lines instead of one merged line. */
export function needsMultilineWrap(
  display: string,
  factors: string[],
  compact: boolean,
  lineBudget: number,
): boolean {
  const effective = estimateRenderUnitsForWrap(display, compact)
  if (effective > lineBudget) {
    return true
  }
  if (factors.length < 2) {
    return false
  }
  if (allowedSplitIndices(factors).length === 0) {
    return false
  }
  const joinedUnits = estimateRenderUnitsForWrap(
    formatFactorsAsLine(factors, compact),
    compact,
  )
  return joinedUnits > lineBudget
}

/**
 * Largest allowed split k so line 1 fits the budget (greedy fill).
 */
export function greedySplitIndex(
  factors: string[],
  lineBudget: number,
  compact: boolean,
): number | null {
  const splits = allowedSplitIndices(factors)
  if (splits.length === 0) {
    return null
  }

  const limit = lineBudget * WRAP_SAFETY
  let best: number | null = null
  for (const k of splits) {
    if (prefixLineUnits(factors, k, compact) <= limit) {
      best = k
    }
  }
  if (best != null) {
    return best
  }

  let fallback: number | null = null
  let fallbackOverflow = Infinity
  for (const k of splits) {
    const overflow = prefixLineUnits(factors, k, compact) - limit
    if (overflow < fallbackOverflow) {
      fallbackOverflow = overflow
      fallback = k
    }
  }
  return fallback
}

/**
 * Split stored LaTeX into 1–2 display lines (greedy first line, then per-line compact format).
 */
export function splitLatexIntoLines(
  latex: string,
  options: SplitLineOptions = {},
): string[] {
  const maxLines = options.maxLines ?? 2
  const compact = options.compact ?? false
  const stored = latex.trim()

  if (maxLines < 2 || !stored) {
    return stored ? [displayLatexForCell(stored, compact)] : []
  }

  const lineBudget = options.lineUnitBudget ?? DEFAULT_LINE_UNIT_BUDGET
  const display = displayLatexForCell(stored, compact)
  const factors = parseTopLevelFactors(stored)

  const needsWrap = needsMultilineWrap(display, factors, compact, lineBudget)
  if (!needsWrap) {
    return [display]
  }

  if (factors.length < 2) {
    return [display]
  }

  let splitAt = greedySplitIndex(factors, lineBudget, compact)
  if (splitAt == null && needsWrap) {
    splitAt = fallbackSplitIndex(factors)
  }
  if (splitAt == null) {
    return [display]
  }

  const line1Factors = factors.slice(0, splitAt)
  const line2Factors = factors.slice(splitAt)
  if (line2Factors.length === 0) {
    return [display]
  }

  let line1 = formatFactorsAsLine(line1Factors, compact)
  const line2 = formatFactorsAsLine(line2Factors, compact)
  if (needsContinuationMarker(line1, line2)) {
    line1 = `${line1.trimEnd()} \\cdot`
  }
  return [line1, line2]
}

/** KaTeX gathered block (centered lines). */
export function formatMultilineDisplayLatex(lines: string[]): string {
  if (lines.length <= 1) {
    return lines[0] ?? ''
  }
  return `\\begin{gathered}${lines[0]} \\\\ ${lines[1]}\\end{gathered}`
}

/**
 * Display LaTeX with optional 2-line wrap (display-only; does not mutate stored yaml).
 */
export function buildDisplayLatex(
  latex: string,
  options: WrapDisplayOptions = {},
): { displayLatex: string; wrapped: boolean; lines: string[] } {
  const compact = options.compact ?? false
  const maxLines = options.maxLines ?? 2
  const base = displayLatexForCell(latex, compact)

  if (maxLines < 2 || !base) {
    return { displayLatex: base, wrapped: false, lines: base ? [base] : [] }
  }

  const lines = splitLatexIntoLines(latex, {
    compact,
    maxLines: 2,
    lineUnitBudget: options.lineUnitBudget,
  })

  if (lines.length < 2) {
    return { displayLatex: base, wrapped: false, lines }
  }

  return {
    displayLatex: formatMultilineDisplayLatex(lines),
    wrapped: true,
    lines,
  }
}

/**
 * Max render units for one line after compact wrap (for column min-width).
 * Single-line cells return full width; wrapped cells return max(line1, line2).
 */
export function maxWrappedLineUnits(latex: string, compact: boolean): number {
  const stored = latex.trim()
  if (!stored) {
    return 0
  }
  const display = displayLatexForCell(stored, compact)
  const factors = parseTopLevelFactors(stored)
  const fullUnits = estimateRenderUnits(display, compact)
  if (factors.length < 2) {
    return fullUnits
  }
  const lineBudget = Math.max(6, Math.ceil(fullUnits / 2))
  if (!needsMultilineWrap(display, factors, compact, lineBudget)) {
    return fullUnits
  }
  let splitAt = greedySplitIndex(factors, lineBudget, compact)
  if (splitAt == null) {
    splitAt = fallbackSplitIndex(factors)
  }
  if (splitAt == null) {
    return fullUnits
  }

  const lines = splitLatexIntoLines(stored, {
    compact,
    maxLines: 2,
    lineUnitBudget: lineBudget,
  })
  if (lines.length < 2) {
    return fullUnits
  }
  return Math.max(
    ...lines.map((line) => estimateRenderUnits(line, compact)),
  )
}

/** Render-unit budget per line from column min-width (px). */
export function lineUnitBudgetFromColumnPx(
  columnWidthPx: number | undefined,
  compact: boolean,
): number | undefined {
  if (columnWidthPx == null) {
    return undefined
  }
  const padding = compact ? 12 : 16
  const scale = compact ? 0.82 : 1
  const px = Math.max(24, columnWidthPx - padding)
  return Math.max(
    6,
    Math.floor((px / (5.5 * scale)) * LINE_BUDGET_MARGIN),
  )
}
