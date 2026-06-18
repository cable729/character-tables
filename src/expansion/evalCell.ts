import { inferN } from '../diagram/utils'
import type { CharacterTable, HeaderSpec, LabelAssignment } from '../types/characterTable'
import { evalQPolynomial } from './evalClassSize'
import { substituteCell } from './substituteCell'

export type Complex = { re: number; im: number }

export type ThetaFn = (x: number) => Complex

export type EvalCellContext = {
  n: number
  rowHeader: HeaderSpec
  colHeader: HeaderSpec
}

export function evalCellContextFromTable(
  table: CharacterTable,
  rowIndex: number,
  colIndex: number,
): EvalCellContext {
  return {
    n: inferN(table),
    rowHeader: table.rows[rowIndex] ?? {},
    colHeader: table.columns[colIndex] ?? {},
  }
}

const TOL = 1e-8

export function complex(re: number, im = 0): Complex {
  return { re, im }
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }
}

export function complexConj(a: Complex): Complex {
  return { re: a.re, im: -a.im }
}

export function complexAbsSq(a: Complex): number {
  return a.re * a.re + a.im * a.im
}

export function complexScale(s: number, a: Complex): Complex {
  return { re: s * a.re, im: s * a.im }
}

export function complexFromReal(n: number): Complex {
  return { re: n, im: 0 }
}

export function isComplexZero(a: Complex): boolean {
  return Math.abs(a.re) < TOL && Math.abs(a.im) < TOL
}

export function complexEq(a: Complex, b: Complex): boolean {
  return Math.abs(a.re - b.re) < TOL && Math.abs(a.im - b.im) < TOL
}

/** Nontrivial additive character on F_q (prime q): θ(x) = exp(2πi x/q). */
export function makeAdditiveTheta(q: number): ThetaFn {
  const omegaRe = Math.cos((2 * Math.PI) / q)
  const omegaIm = Math.sin((2 * Math.PI) / q)
  return (x: number) => {
    const t = ((x % q) + q) % q
    if (t === 0) {
      return complex(1, 0)
    }
    let re = 1
    let im = 0
    for (let i = 0; i < t; i++) {
      const nr = re * omegaRe - im * omegaIm
      const ni = re * omegaIm + im * omegaRe
      re = nr
      im = ni
    }
    return complex(re, im)
  }
}

/** Sum_{x in F_q} θ(c·x) for c ≠ 0 (additive θ). */
export function thetaSumOverField(q: number, c: number, theta: ThetaFn): Complex {
  let sum = complex(0, 0)
  for (let x = 0; x < q; x++) {
    sum = complexAdd(sum, theta((c * x) % q))
  }
  return sum
}

function stripCellLatex(latex: string): string {
  return latex.replace(/\s/g, '').replace(/\\cdot/g, '*')
}

/** `q` followed by a digit (e.g. delta → 1) must not parse as `q1`. */
function normalizeImplicitMul(latex: string): string {
  return latex.replace(/q(\d)/g, 'q*$1')
}

function evalDelta(
  lhs: string,
  rhs: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
  q: number,
): number {
  const combined = normalizeAssignment({
    ...colAssignment,
    ...rowAssignment,
  })
  const lv = evalLinearForm(lhs, combined)
  const rv = evalLinearForm(rhs, combined)
  return ((lv - rv) % q + q) % q === 0 ? 1 : 0
}

/** Evaluate a linear form like αa or 3*2 from numeric / label tokens. */
function normalizeGreekLabels(expr: string): string {
  return expr.replace(/\\/g, '')
}

function normalizeAssignment(assignment: LabelAssignment): LabelAssignment {
  const out: LabelAssignment = {}
  for (const [key, value] of Object.entries(assignment)) {
    out[normalizeGreekLabels(key)] = value
  }
  return out
}

function evalLinearForm(expr: string, assignment: LabelAssignment): number {
  const s = normalizeGreekLabels(stripCellLatex(expr))
  if (/^\d+$/.test(s)) {
    return Number(s)
  }

  let sum = 0
  const parts = s.split(/(?=[+-])|(?<=[+-])/).filter(Boolean)
  if (parts.length === 0) {
    return evalProduct(s, assignment)
  }

  let sign = 1
  for (const part of parts.length > 1 ? parts : [s]) {
    if (part === '+') {
      sign = 1
      continue
    }
    if (part === '-') {
      sign = -1
      continue
    }
    sum += sign * evalProduct(part.replace(/^[+-]/, ''), assignment)
    sign = 1
  }
  return sum
}

function evalProduct(expr: string, assignment: LabelAssignment): number {
  const s = stripCellLatex(expr)
  if (/^\d+$/.test(s)) {
    return Number(s)
  }
  if (s.includes('*')) {
    return s.split('*').reduce((p, part) => p * evalProduct(part, assignment), 1)
  }

  const labels = Object.keys(assignment).sort((a, b) => b.length - a.length)
  let remaining = s
  let product = 1
  let matched = false

  while (remaining.length > 0) {
    let found = false
    for (const label of labels) {
      if (remaining.startsWith(label)) {
        product *= assignment[label]
        remaining = remaining.slice(label.length)
        found = true
        matched = true
        break
      }
    }
    if (!found) {
      const num = /^(\d+)/.exec(remaining)
      if (num) {
        product *= Number(num[1])
        remaining = remaining.slice(num[1].length)
        matched = true
      } else {
        break
      }
    }
  }

  if (!matched && /^\d+$/.test(s)) {
    return Number(s)
  }
  return product
}

function parseDeltaFactors(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
  q: number,
): { rest: string; value: number } | null {
  const match = /\\delta_\{([^}]+)\}/.exec(latex)
  if (!match) {
    return null
  }
  const inner = normalizeGreekLabels(match[1].replace(/\s/g, ''))
  const eq = inner.split('=')
  if (eq.length !== 2) {
    throw new Error(`Unsupported delta: ${match[0]}`)
  }
  const value = evalDelta(eq[0], eq[1], rowAssignment, colAssignment, q)
  return {
    rest: latex.slice(0, match.index) + latex.slice(match.index + match[0].length),
    value,
  }
}

function parseThetaFactors(
  latex: string,
  q: number,
  theta: ThetaFn,
  assignment: LabelAssignment,
): { rest: string; value: Complex } | null {
  const match = /\\theta\(([^)]+)\)/.exec(latex)
  if (!match) {
    return null
  }
  const inner = match[1]
  const fieldElt =
    evalLinearForm(inner, assignment) %
    q
  const value = theta(fieldElt)
  return {
    rest: latex.slice(0, match.index) + latex.slice(match.index + match[0].length),
    value,
  }
}

function isQPolynomialAtom(s: string): boolean {
  return (
    s === '1' ||
    s === 'q' ||
    /^q\^\d+$/.test(s) ||
    s.startsWith('(q') ||
    s.includes('q')
  )
}

function splitFactors(latex: string): string[] {
  const s = stripCellLatex(latex)
  if (!s) {
    return []
  }

  const factors: string[] = []
  let i = 0
  while (i < s.length) {
    if (s.startsWith('\\delta_', i)) {
      const close = s.indexOf('}', i)
      if (close < 0) {
        throw new Error(`Unclosed delta in ${latex}`)
      }
      factors.push(s.slice(i, close + 1))
      i = close + 1
      continue
    }
    if (s.startsWith('\\theta(', i)) {
      const close = s.indexOf(')', i)
      if (close < 0) {
        throw new Error(`Unclosed theta in ${latex}`)
      }
      factors.push(s.slice(i, close + 1))
      i = close + 1
      continue
    }
    if (s[i] === '*') {
      i++
      continue
    }
    if (s[i] === '(') {
      let depth = 0
      let j = i
      for (; j < s.length; j++) {
        if (s[j] === '(') depth++
        else if (s[j] === ')') {
          depth--
          if (depth === 0) {
            j++
            break
          }
        }
      }
      factors.push(s.slice(i, j))
      i = j
      continue
    }
    const nextSpecial = (() => {
      const d = s.indexOf('\\delta_', i)
      const t = s.indexOf('\\theta(', i)
      const p = s.indexOf('(', i)
      const star = s.indexOf('*', i)
      const candidates = [d, t, p, star].filter((x) => x >= 0)
      return candidates.length ? Math.min(...candidates) : -1
    })()
    if (nextSpecial === i) {
      continue
    }
    const end = nextSpecial >= 0 ? nextSpecial : s.length
    const chunk = s.slice(i, end)
    if (chunk) {
      factors.push(chunk)
    }
    i = end
  }
  return factors
}

/**
 * Evaluate a matrix cell at prime-power q (additive θ on F_q for prime q).
 */
function replaceDeltasInLatex(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
  q: number,
): string {
  return latex.replace(/\\delta_\{([^}]+)\}/g, (_match, inner: string) => {
    const normalized = normalizeGreekLabels(inner.replace(/\s/g, ''))
    const eq = normalized.split('=')
    if (eq.length !== 2) {
      throw new Error(`Unsupported delta: \\delta_{${inner}}`)
    }
    const value = evalDelta(eq[0], eq[1], rowAssignment, colAssignment, q)
    return String(value)
  })
}

export function evalCellAtQ(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
  q: number,
  theta: ThetaFn,
  _context?: EvalCellContext,
): Complex {
  if (!latex || latex === '0') {
    return complex(0, 0)
  }
  if (latex === '1') {
    return complex(1, 0)
  }

  const withDeltas = replaceDeltasInLatex(latex, rowAssignment, colAssignment, q)
  const substituted = normalizeImplicitMul(
    substituteCell(withDeltas, rowAssignment, colAssignment),
  )
  const combined = normalizeAssignment({
    ...colAssignment,
    ...rowAssignment,
  })
  let product = complex(1, 0)

  for (const factor of splitFactors(substituted)) {
    if (factor === '1' || factor === '') {
      continue
    }
    if (factor === '0') {
      return complex(0, 0)
    }

    const delta = parseDeltaFactors(factor, rowAssignment, colAssignment, q)
    if (delta) {
      product = complexMul(product, complexFromReal(delta.value))
      continue
    }

    const thetaFactor = parseThetaFactors(factor, q, theta, combined)
    if (thetaFactor) {
      product = complexMul(product, thetaFactor.value)
      continue
    }

    if (isQPolynomialAtom(factor.replace(/[{}]/g, ''))) {
      const n = evalQPolynomial(factor, q)
      product = complexMul(product, complexFromReal(n))
      continue
    }

    if (/^\d+$/.test(factor)) {
      product = complexMul(product, complexFromReal(Number(factor)))
      continue
    }

    if (factor.includes('\\theta')) {
      const t = parseThetaFactors(factor, q, theta, combined)
      if (t) {
        product = complexMul(product, t.value)
        continue
      }
    }

    if (factor.includes('\\delta')) {
      const d = parseDeltaFactors(factor, rowAssignment, colAssignment, q)
      if (d) {
        product = complexMul(product, complexFromReal(d.value))
        continue
      }
    }

    const linear = evalLinearForm(factor, {
      ...colAssignment,
      ...rowAssignment,
    })
    product = complexMul(product, complexFromReal(linear))
  }

  return product
}

export function cellHasTheta(latex: string): boolean {
  return latex.includes('\\theta')
}

export function cellHasDelta(latex: string): boolean {
  return latex.includes('\\delta')
}

export function isDegreeOnlyCell(latex: string): boolean {
  if (!latex || cellHasTheta(latex) || cellHasDelta(latex)) {
    return false
  }
  const s = latex.replace(/\s/g, '').replace(/[{}]/g, '')
  return /^[\d(q)^+\-()]*$/.test(s) || s === '1'
}
