import type { ArcDict, HeaderSpec } from '../types/characterTable'
import { collectLabels, normalizeRestriction } from '../expansion/restrictions'
import { headerToDiagram, inferN } from '../diagram/utils'
import type { CharacterTable } from '../types/characterTable'
import {
  countAssignmentsForHeader,
  countParentBranchAssignments,
} from './validateSplit'

export const REFERENCE_Q = 5

function cloneArcDict(arcs?: ArcDict): ArcDict | undefined {
  if (!arcs) {
    return undefined
  }
  return {
    above: arcs.above ? { ...arcs.above } : undefined,
    below: arcs.below ? { ...arcs.below } : undefined,
  }
}

function removeBelowLabel(arcs: ArcDict, label: string): ArcDict {
  const next = cloneArcDict(arcs)!
  if (next.below) {
    const { [label]: _removed, ...rest } = next.below
    next.below = Object.keys(rest).length > 0 ? rest : undefined
  }
  return next
}

function parseEqualityChain(expr: string): (string | number)[] | null {
  const parts = expr.split('=')
  if (parts.length < 2) {
    return null
  }
  const result: (string | number)[] = []
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      result.push(Number(part))
    } else if (part.length > 0) {
      result.push(part)
    } else {
      return null
    }
  }
  return result
}

/** Restriction on remaining labels when a below label is fixed at zero. */
function effectiveRestrictionForZeroBranch(
  parent: string | undefined,
  belowLabel: string,
): string | undefined {
  if (!parent?.trim()) {
    return undefined
  }

  const normalized = normalizeRestriction(parent)
  if (normalized.startsWith('not(') && normalized.endsWith(')')) {
    const inner = normalized.slice(4, -1)
    const chain = parseEqualityChain(inner)
    if (chain) {
      const labels = chain.filter(
        (x): x is string => typeof x === 'string',
      )
      if (labels.includes(belowLabel)) {
        const remaining = labels.filter((l) => l !== belowLabel)
        if (remaining.length === 1) {
          return `${remaining[0]}!=0`
        }
        if (remaining.length > 1) {
          return `not(${remaining.join('=')}=0)`
        }
      }
    }
  }

  return combineRestrictions(parent, `${belowLabel}=0`)
}

function combineRestrictions(
  parent: string | undefined,
  extra: string,
): string | undefined {
  const parts = [parent?.trim(), extra.trim()].filter(Boolean)
  if (parts.length === 0) {
    return undefined
  }
  if (parts.length === 1) {
    return parts[0]
  }
  return parts.join(';')
}

function expansionCountFromCount(count: number): string {
  return String(count)
}

export type BelowLabelSplitResult = {
  belowLabel: string
  children: Array<{ id: string; header: HeaderSpec }>
}

export function buildBelowLabelSplitChildren(
  parent: HeaderSpec,
  belowLabel: string,
  table: CharacterTable,
  idSuffix?: { nonzero?: string; zero?: string },
): BelowLabelSplitResult {
  const n = inferN(table)
  const diagram = headerToDiagram(parent, n)
  const { belowLabels } = collectLabels(diagram)

  if (!parent.arcs?.below || belowLabels.length === 0) {
    throw new Error('header has no below arcs to split')
  }
  if (!belowLabels.includes(belowLabel)) {
    throw new Error(
      `below label "${belowLabel}" not found on header (have: ${belowLabels.join(', ')})`,
    )
  }

  const sourceId = parent.id ?? 'header'
  const nonzeroId = idSuffix?.nonzero ?? `${sourceId}-nz`
  const zeroId = idSuffix?.zero ?? `${sourceId}-z`

  const parentCount = countAssignmentsForHeader(parent, n, REFERENCE_Q)
  const nonzeroCount = countParentBranchAssignments(
    parent,
    n,
    REFERENCE_Q,
    belowLabel,
    'nonzero',
  )
  const zeroCount = countParentBranchAssignments(
    parent,
    n,
    REFERENCE_Q,
    belowLabel,
    'zero',
  )

  if (nonzeroCount + zeroCount !== parentCount) {
    throw new Error(
      `split partition mismatch at q=${REFERENCE_Q}: parent=${parentCount}, nonzero=${nonzeroCount}, zero=${zeroCount}`,
    )
  }
  if (nonzeroCount === 0 || zeroCount === 0) {
    throw new Error(
      `split would produce an empty branch (nonzero=${nonzeroCount}, zero=${zeroCount})`,
    )
  }

  const parentArcs = cloneArcDict(parent.arcs)
  const nonzeroRestriction = combineRestrictions(
    parent.restriction,
    `${belowLabel}!=0`,
  )
  const zeroRestriction = effectiveRestrictionForZeroBranch(
    parent.restriction,
    belowLabel,
  )

  const nonzeroHeader: HeaderSpec = {
    ...parent,
    id: nonzeroId,
    arcs: parentArcs,
    restriction: nonzeroRestriction,
    expansionCount: expansionCountFromCount(nonzeroCount),
  }

  const zeroArcs = removeBelowLabel(parentArcs!, belowLabel)
  const zeroHeader: HeaderSpec = {
    ...parent,
    id: zeroId,
    arcs: zeroArcs,
    restriction: zeroRestriction,
    expansionCount: expansionCountFromCount(zeroCount),
  }

  const zeroDiagram = headerToDiagram(zeroHeader, n)
  const zeroChildCount = countAssignmentsForHeader(
    zeroHeader,
    n,
    REFERENCE_Q,
  )
  if (zeroChildCount !== zeroCount) {
    throw new Error(
      `zero branch header counts ${zeroChildCount} assignments but expected ${zeroCount}`,
    )
  }

  const nonzeroChildCount = countAssignmentsForHeader(
    nonzeroHeader,
    n,
    REFERENCE_Q,
  )
  if (nonzeroChildCount !== nonzeroCount) {
    throw new Error(
      `nonzero branch header counts ${nonzeroChildCount} assignments but expected ${nonzeroCount}`,
    )
  }

  void zeroDiagram

  return {
    belowLabel,
    children: [
      { id: nonzeroId, header: nonzeroHeader },
      { id: zeroId, header: zeroHeader },
    ],
  }
}
