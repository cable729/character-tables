import type { ArcDict, HeaderSpec } from '../types/characterTable'
import { headerToDiagram } from '../diagram/utils'
import { normalizeRestriction } from '../expansion/restrictions'
import { countAssignmentsForHeader } from '../transforms/validateSplit'
import { inferExpansionCountLatex } from './inferExpansionCountLatex'

export const DEFAULT_CANONICAL_Q = 5

function cloneArcDict(arcs?: ArcDict): ArcDict | undefined {
  if (!arcs) {
    return undefined
  }
  return {
    above: arcs.above ? { ...arcs.above } : undefined,
    below: arcs.below ? { ...arcs.below } : undefined,
  }
}

function promoteBelowLabelToAbove(arcs: ArcDict, label: string): ArcDict {
  const pairs = arcs.below?.[label]
  if (!pairs) {
    return arcs
  }
  const below = { ...arcs.below }
  delete below[label]
  return {
    above: { ...arcs.above, [label]: pairs },
    below: Object.keys(below).length > 0 ? below : undefined,
  }
}

function parseRestrictionParts(restriction: string | undefined): string[] {
  if (!restriction?.trim()) {
    return []
  }
  return restriction
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
}

function joinRestrictionParts(parts: string[]): string | undefined {
  if (parts.length === 0) {
    return undefined
  }
  return parts.join(';')
}

/** Promote each below label with an explicit `label!=0` (or `label!=digit`) clause. */
function promoteBelowNonzeroRestrictions(spec: HeaderSpec): HeaderSpec {
  const parts = parseRestrictionParts(spec.restriction)
  if (parts.length === 0 || !spec.arcs?.below) {
    return spec
  }

  let arcs = cloneArcDict(spec.arcs)!
  const kept: string[] = []

  for (const part of parts) {
    const normalized = normalizeRestriction(part)
    const match = normalized.match(/^([^!=]+)!=(\d+)$/)
    if (match) {
      const label = match[1]!
      if (arcs.below?.[label] && Number(match[2]) === 0) {
        arcs = promoteBelowLabelToAbove(arcs, label)
        continue
      }
    }
    kept.push(part)
  }

  return {
    ...spec,
    arcs,
    restriction: joinRestrictionParts(kept),
  }
}

function parseNotAllZeroLabels(
  restriction: string | undefined,
): string[] | null {
  if (!restriction?.trim()) {
    return null
  }
  const normalized = normalizeRestriction(restriction)
  if (!normalized.startsWith('not(') || !normalized.endsWith(')')) {
    return null
  }
  const inner = normalized.slice(4, -1)
  const parts = inner.split('=')
  if (parts.length < 2 || parts[parts.length - 1] !== '0') {
    return null
  }
  const labels = parts.slice(0, -1).filter((p) => p.length > 0)
  return labels.length > 0 ? labels : null
}

/** When only one below arc remains and restriction forces it nonzero, promote it. */
function promoteRemainingBelowFromNotAllZero(spec: HeaderSpec): HeaderSpec {
  const labels = parseNotAllZeroLabels(spec.restriction)
  if (!labels || !spec.arcs?.below) {
    return spec
  }

  const belowKeys = Object.keys(spec.arcs.below)
  if (belowKeys.length !== 1) {
    return spec
  }

  const remaining = belowKeys[0]!
  const parts = parseRestrictionParts(spec.restriction)
  const hasNonzeroHint = parts.some((p) => {
    const n = normalizeRestriction(p)
    return n === `${remaining}!=0` || n === `not(${remaining}=0)`
  })

  if (!labels.includes(remaining) && !hasNonzeroHint) {
    return spec
  }

  const onlyBelowNonzero =
    parts.length === 1 &&
    normalizeRestriction(parts[0]!) === `${remaining}!=0`

  if (onlyBelowNonzero) {
    let arcs = cloneArcDict(spec.arcs)!
    arcs = promoteBelowLabelToAbove(arcs, remaining)
    return {
      ...spec,
      arcs,
      restriction: undefined,
    }
  }

  return spec
}

/** Drop restrictions that do not change the assignment count. */
function dropRedundantRestrictions(
  spec: HeaderSpec,
  n: number,
  q: number,
): HeaderSpec {
  if (!spec.restriction?.trim()) {
    return spec
  }

  const withRestriction = countAssignmentsForHeader(spec, n, q)
  const without: HeaderSpec = { ...spec, restriction: undefined }
  const bare = countAssignmentsForHeader(without, n, q)

  if (withRestriction === bare) {
    return without
  }
  return spec
}

function assignInferredExpansionCount(
  spec: HeaderSpec,
  n: number,
  q: number,
): HeaderSpec {
  if (spec.expansionCount?.trim()) {
    return spec
  }
  if (!spec.restriction?.trim()) {
    return spec
  }

  const count = countAssignmentsForHeader(spec, n, q)
  const inferred = inferExpansionCountLatex(count, q)
  if (!inferred) {
    return { ...spec, expansionCount: String(count) }
  }

  return { ...spec, expansionCount: inferred }
}

/**
 * Rewrite a header toward canonical arc/restriction form without changing
 * which assignments it represents (verified at reference q).
 */
export function canonicalizeHeader(
  spec: HeaderSpec,
  n: number,
  q: number = DEFAULT_CANONICAL_Q,
): HeaderSpec {
  const targetCount = countAssignmentsForHeader(spec, n, q)

  let current: HeaderSpec = {
    ...spec,
    arcs: cloneArcDict(spec.arcs),
  }

  current = promoteBelowNonzeroRestrictions(current)
  current = promoteRemainingBelowFromNotAllZero(current)
  current = dropRedundantRestrictions(current, n, q)
  current = assignInferredExpansionCount(current, n, q)

  const resultCount = countAssignmentsForHeader(current, n, q)
  if (resultCount !== targetCount) {
    throw new Error(
      `canonicalizeHeader changed assignment count: ${targetCount} → ${resultCount}`,
    )
  }

  void headerToDiagram(current, n)
  return current
}

export function parseNotAllZeroRestriction(
  restriction: string | undefined,
): string[] | null {
  return parseNotAllZeroLabels(restriction)
}
