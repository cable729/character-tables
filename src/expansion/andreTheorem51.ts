import { headerToDiagram } from '../diagram/utils'
import { ANDRE_CELL_LATEX } from '../math/andreNotation'
import { evalQPolynomial } from './evalClassSize'
import {
  complex,
  complexFromReal,
  complexMul,
  type Complex,
  type ThetaFn,
} from './evalCell'
import type { HeaderSpec, LabelAssignment } from '../types/characterTable'

export type Root = { i: number; j: number }

export function rootKey(i: number, j: number): string {
  return `${i},${j}`
}

export function parseRootKey(key: string): Root {
  const [i, j] = key.split(',').map(Number)
  return { i: i!, j: j! }
}

export function allRoots(n: number): string[] {
  const roots: string[] = []
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      roots.push(rootKey(i, j))
    }
  }
  return roots
}

export function isBasic(D: ReadonlySet<string>): boolean {
  const rows = new Set<number>()
  const cols = new Set<number>()
  for (const key of D) {
    const { i, j } = parseRootKey(key)
    if (rows.has(i) || cols.has(j)) {
      return false
    }
    rows.add(i)
    cols.add(j)
  }
  return true
}

/** Root (i,j) is D′-regular when no root of D′ lies strictly between i and j. */
export function isRegular(i: number, j: number, Dprime: ReadonlySet<string>): boolean {
  for (let k = i + 1; k < j; k++) {
    if (Dprime.has(rootKey(i, k)) || Dprime.has(rootKey(k, j))) {
      return false
    }
  }
  return true
}

export function regularRoots(n: number, Dprime: ReadonlySet<string>): Set<string> {
  const R = new Set<string>()
  for (const key of allRoots(n)) {
    const { i, j } = parseRootKey(key)
    if (isRegular(i, j, Dprime)) {
      R.add(key)
    }
  }
  return R
}

/** Sc*(D): column roots (a,j) with (i,j) in D and i < a < j. */
export function scStar(D: ReadonlySet<string>): Set<string> {
  const S = new Set<string>()
  for (const key of D) {
    const { i, j } = parseRootKey(key)
    for (let a = i + 1; a < j; a++) {
      S.add(rootKey(a, j))
    }
  }
  return S
}

export function eExponent(
  D: ReadonlySet<string>,
  Dprime: ReadonlySet<string>,
  n: number,
): number {
  const R = regularRoots(n, Dprime)
  const S = scStar(D)
  let count = 0
  for (const key of S) {
    if (R.has(key)) {
      count++
    }
  }
  return count
}

export function dSubsetR(
  D: ReadonlySet<string>,
  Dprime: ReadonlySet<string>,
): boolean {
  for (const key of D) {
    const { i, j } = parseRootKey(key)
    if (!isRegular(i, j, Dprime)) {
      return false
    }
  }
  return true
}

export type BasicSubsetData = {
  roots: Set<string>
  phi: Map<string, number>
}

function assignmentValue(
  assignment: LabelAssignment,
  label: string,
): number | undefined {
  const raw = label.trim()
  const candidates = [
    raw,
    raw.startsWith('\\') ? raw : `\\${raw}`,
    raw.startsWith('\\') ? raw.slice(1) : undefined,
  ].filter(Boolean) as string[]
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(assignment, c)) {
      return assignment[c]
    }
  }
  return undefined
}

function rootConflicts(a: string, b: string): boolean {
  const ra = parseRootKey(a)
  const rb = parseRootKey(b)
  return ra.i === rb.i || ra.j === rb.j
}

/**
 * Build (D, φ) from header arcs. Above arcs define the base; nonzero below
 * arcs replace any above root on the same row or column (condensed tables).
 */
export function basicSubsetFromHeader(
  header: HeaderSpec,
  assignment: LabelAssignment,
  n: number,
): BasicSubsetData | null {
  const diagram = headerToDiagram(header, n)
  const active = new Map<string, number>()

  for (const arc of diagram.arcs) {
    if (arc.position !== 'above') {
      continue
    }
    const label = arc.label.trim()
    if (!label) {
      continue
    }
    const val = assignmentValue(assignment, label)
    if (val === undefined || val === 0) {
      continue
    }
    active.set(rootKey(arc.from, arc.to), val)
  }

  for (const arc of diagram.arcs) {
    if (arc.position !== 'below') {
      continue
    }
    const label = arc.label.trim()
    if (!label) {
      continue
    }
    const val = assignmentValue(assignment, label)
    if (val === undefined) {
      continue
    }
    const key = rootKey(arc.from, arc.to)
    for (const existing of [...active.keys()]) {
      if (rootConflicts(key, existing)) {
        active.delete(existing)
      }
    }
    active.set(key, val)
  }

  const roots = new Set(active.keys())
  if (roots.size === 0) {
    return { roots, phi: new Map() }
  }
  if (!isBasic(roots)) {
    return null
  }

  const phi = new Map<string, number>()
  for (const [key, val] of active) {
    phi.set(key, val)
  }
  return { roots, phi }
}

/**
 * André (2001) Corollary 5.1: ξ_D(φ) on the class representative e_{D′}(φ′).
 * Uses additive θ as ψ on F_q.
 */
export function evaluateAndreTheorem51(
  rowHeader: HeaderSpec,
  rowAssignment: LabelAssignment,
  colHeader: HeaderSpec,
  colAssignment: LabelAssignment,
  n: number,
  q: number,
  theta: ThetaFn,
): Complex {
  const Ddata = basicSubsetFromHeader(rowHeader, rowAssignment, n)
  const DprimeData = basicSubsetFromHeader(colHeader, colAssignment, n)

  if (!Ddata || !DprimeData) {
    return complex(0, 0)
  }

  const D = Ddata.roots
  const Dprime = DprimeData.roots

  if (!dSubsetR(D, Dprime)) {
    return complex(0, 0)
  }

  const e = eExponent(D, Dprime, n)
  let product = complex(1, 0)

  for (const key of D) {
    const phi = Ddata.phi.get(key) ?? 0
    const x = DprimeData.phi.get(key) ?? 0
    product = complexMul(product, theta((phi * x) % q))
  }

  const qPow = evalQPolynomial(`q^${e}`, q)
  return complexMul(complexFromReal(qPow), product)
}

export function isAndreCell(latex: string): boolean {
  const s = latex.replace(/\s/g, '')
  return s === ANDRE_CELL_LATEX || s === 'andre'
}

export type LabelRootMap = Record<string, [number, number]>

/** Map each arc label on a header to its matrix coordinate (i, j). */
export function labelRootsFromHeader(header: HeaderSpec, n: number): LabelRootMap {
  const diagram = headerToDiagram(header, n)
  const out: LabelRootMap = {}
  for (const arc of diagram.arcs) {
    const label = arc.label.trim()
    if (label) {
      out[label] = [arc.from, arc.to]
    }
  }
  return out
}

function basicSubsetFromRootMap(
  rootMap: LabelRootMap,
  assignment: LabelAssignment,
): BasicSubsetData | null {
  const active = new Map<string, number>()
  for (const [label, [i, j]] of Object.entries(rootMap)) {
    const val = assignmentValue(assignment, label)
    if (val === undefined || val === 0) {
      continue
    }
    active.set(rootKey(i, j), val)
  }
  const roots = new Set(active.keys())
  if (roots.size > 0 && !isBasic(roots)) {
    return null
  }
  const phi = new Map<string, number>()
  for (const [key, val] of active) {
    phi.set(key, val)
  }
  return { roots, phi }
}

/**
 * André Cor. 5.1 from explicit label→(i,j) maps and slice values.
 * Conceptually `andre({α,β,γ}, {a,b,c})` once each label is tied to a root
 * via the row/column arc diagrams (see `labelRootsFromHeader`).
 */
export function evaluateAndreFromLabelMaps(
  charRoots: LabelRootMap,
  charValues: LabelAssignment,
  classRoots: LabelRootMap,
  classValues: LabelAssignment,
  n: number,
  q: number,
  theta: ThetaFn,
): Complex {
  const Ddata = basicSubsetFromRootMap(charRoots, charValues)
  const DprimeData = basicSubsetFromRootMap(classRoots, classValues)

  if (!Ddata || !DprimeData) {
    return complex(0, 0)
  }

  const D = Ddata.roots
  const Dprime = DprimeData.roots

  if (!dSubsetR(D, Dprime)) {
    return complex(0, 0)
  }

  const e = eExponent(D, Dprime, n)
  let product = complex(1, 0)

  for (const key of D) {
    const phi = Ddata.phi.get(key) ?? 0
    const x = DprimeData.phi.get(key) ?? 0
    product = complexMul(product, theta((phi * x) % q))
  }

  const qPow = evalQPolynomial(`q^${e}`, q)
  return complexMul(complexFromReal(qPow), product)
}
