import type { ArcDict, CharacterTable, HeaderSpec } from '../types/characterTable'
import { sumQPolynomialLatex } from '../expansion/qPolynomial'
import { canonicalizeHeader, DEFAULT_CANONICAL_Q } from './canonicalize'
import { countAssignmentsForHeader } from '../transforms/validateSplit'
import { headerToDiagram } from '../diagram/utils'

export type MergeHeadersResult =
  | { status: 'ok'; header: HeaderSpec }
  | { status: 'needsManual'; placeholder: HeaderSpec }

function stripId(h: HeaderSpec): Omit<HeaderSpec, 'id'> {
  const { id: _id, ...rest } = h
  return rest
}

export function headersStructurallyEqual(a: HeaderSpec, b: HeaderSpec): boolean {
  return JSON.stringify(stripId(a)) === JSON.stringify(stripId(b))
}

function flattenArcPairs(
  value: [number, number] | [number, number][],
): [number, number][] {
  if (value.length === 0) {
    return []
  }
  if (typeof value[0] === 'number') {
    return [value as [number, number]]
  }
  return value as [number, number][]
}

function arcPairKey([from, to]: [number, number]): string {
  return `${from},${to}`
}

function arcDictToPairSet(arcs?: ArcDict): Set<string> {
  const set = new Set<string>()
  if (!arcs) {
    return set
  }
  for (const side of ['above', 'below'] as const) {
    const dict = arcs[side]
    if (!dict) {
      continue
    }
    for (const pairs of Object.values(dict)) {
      for (const p of flattenArcPairs(pairs)) {
        set.add(`${side}:${arcPairKey(p)}`)
      }
    }
  }
  return set
}

function pairSetToArcDict(pairs: Set<string>): ArcDict | undefined {
  const above: Record<string, [number, number]> = {}
  const below: Record<string, [number, number]> = {}
  let idx = 0
  for (const key of [...pairs].sort()) {
    const [side, pairStr] = key.split(':')
    const [from, to] = pairStr!.split(',').map(Number) as [number, number]
    const label = `_m${idx++}`
    if (side === 'above') {
      above[label] = [from, to]
    } else {
      below[label] = [from, to]
    }
  }
  if (Object.keys(above).length === 0 && Object.keys(below).length === 0) {
    return undefined
  }
  return {
    above: Object.keys(above).length > 0 ? above : undefined,
    below: Object.keys(below).length > 0 ? below : undefined,
  }
}

/** Union arc endpoints from all headers; merged supercharacter arcs are always below. */
function combineSupercharacterArcs(headers: HeaderSpec[]): ArcDict | undefined {
  const pairs = new Set<string>()
  for (const h of headers) {
    for (const key of arcDictToPairSet(h.arcs)) {
      pairs.add(key.slice(key.indexOf(':') + 1))
    }
  }
  if (pairs.size === 0) {
    return undefined
  }
  return pairSetToArcDict(
    new Set([...pairs].map((pair) => `below:${pair}`)),
  )
}

function oneArcSubsetOfOther(a: HeaderSpec, b: HeaderSpec): boolean {
  const setA = arcDictToPairSet(a.arcs)
  const setB = arcDictToPairSet(b.arcs)
  if (setA.size === 0 || setB.size === 0) {
    return false
  }
  return [...setA].every((p) => setB.has(p)) || [...setB].every((p) => setA.has(p))
}

function assignmentEquivalentAtQ(
  a: HeaderSpec,
  b: HeaderSpec,
  n: number,
  q: number = DEFAULT_CANONICAL_Q,
): boolean {
  try {
    return (
      countAssignmentsForHeader(a, n, q) ===
        countAssignmentsForHeader(b, n, q) &&
      JSON.stringify(canonicalizeHeader(a, n, q)) ===
        JSON.stringify(canonicalizeHeader(b, n, q))
    )
  } catch {
    return false
  }
}

function pickSupersetHeader(headers: HeaderSpec[]): HeaderSpec | null {
  for (const h of headers) {
    if (headers.every((other) => oneArcSubsetOfOther(other, h) || headersStructurallyEqual(other, h))) {
      return structuredClone(h)
    }
  }
  return null
}

export function mergeSupercharacterHeaders(
  headers: HeaderSpec[],
  n: number,
  options?: { sumClassSizes?: string[] },
): MergeHeadersResult {
  if (headers.length === 0) {
    throw new Error('mergeSupercharacterHeaders requires at least one header')
  }

  const first = headers[0]!
  if (headers.every((h) => headersStructurallyEqual(first, h))) {
    return { status: 'ok', header: structuredClone(first) }
  }

  if (headers.every((h, _, arr) => assignmentEquivalentAtQ(h, first, n))) {
    return { status: 'ok', header: structuredClone(first) }
  }

  const superset = pickSupersetHeader(headers)
  if (superset) {
    const arcs = combineSupercharacterArcs(headers)
    return { status: 'ok', header: { ...superset, arcs } }
  }

  const mergedArcs = combineSupercharacterArcs(headers)
  if (mergedArcs) {
    const merged: HeaderSpec = { arcs: mergedArcs }
    try {
      void headerToDiagram(merged, n)
      return { status: 'ok', header: merged }
    } catch {
      // fall through to manual
    }
  }

  let classSize: string | undefined
  if (options?.sumClassSizes && options.sumClassSizes.length > 0) {
    classSize = sumQPolynomialLatex(options.sumClassSizes)
  }

  return {
    status: 'needsManual',
    placeholder: classSize ? { classSize } : {},
  }
}

export function mergeSupercharacterHeadersForTable(
  table: CharacterTable,
  axis: 'rows' | 'columns',
  indices: number[],
  options?: { sumClassSizes?: boolean },
): MergeHeadersResult {
  const headers =
    axis === 'rows'
      ? indices.map((i) => table.rows[i]!)
      : indices.map((i) => table.columns[i]!)
  const n = table.n ?? 3
  const sumClassSizes =
    options?.sumClassSizes && axis === 'columns'
      ? headers
          .map((h) => h.classSize)
          .filter((s): s is string => Boolean(s))
      : undefined
  return mergeSupercharacterHeaders(headers, n, { sumClassSizes })
}
