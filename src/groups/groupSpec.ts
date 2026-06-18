import type {
  ArcDict,
  CharacterTable,
  GroupSpec,
  HeaderSpec,
} from '../types/characterTable'
import { flattenArcPairs } from '../diagram/arcUtils'
import { inferN } from '../diagram/utils'

export type { GroupSpec }

export type GroupTableFields = Pick<
  CharacterTable,
  'groupSpec' | 'group' | 'n' | 'groupOrder' | 'columns' | 'rows'
>

export function dotCount(spec: GroupSpec): number {
  return spec.kind === 'ut_n' ? spec.n : spec.n * (spec.k + 1)
}

export function formatGroupLatex(spec: GroupSpec): string {
  if (spec.kind === 'ut_n') {
    return `UT_${spec.n}(\\mathbb{F}_q)`
  }
  return `UT_${spec.n}^{(${spec.k})}(\\mathbb{F}_q)`
}

/** |G| as LaTeX: UT_n has q^{n(n-1)/2}; UT_n^{(k)} has q^{kn^2 + n(n-1)/2}. */
export function formatGroupOrder(spec: GroupSpec): string {
  const triangular = (spec.n * (spec.n - 1)) / 2
  const exponent =
    spec.kind === 'ut_n' ? triangular : spec.k * spec.n * spec.n + triangular
  return exponent === 1 ? 'q' : `q^{${exponent}}`
}

export function inferGroupSpec(table: CharacterTable): GroupSpec {
  if (table.groupSpec) {
    return structuredClone(table.groupSpec)
  }
  return { kind: 'ut_n', n: inferN(table) }
}

function clampArcDict(dict: ArcDict | undefined, maxDot: number): ArcDict | undefined {
  if (!dict) return undefined

  const clampSide = (
    side: Record<string, [number, number] | [number, number][]> | undefined,
  ) => {
    if (!side) return undefined
    const next: Record<string, [number, number] | [number, number][]> = {}
    for (const [label, pairs] of Object.entries(side)) {
      const kept = flattenArcPairs(pairs).filter(
        ([from, to]) => from <= maxDot && to <= maxDot,
      )
      if (kept.length === 1) {
        next[label] = kept[0]!
      } else if (kept.length > 1) {
        next[label] = kept
      }
    }
    return Object.keys(next).length > 0 ? next : undefined
  }

  const above = clampSide(dict.above)
  const below = clampSide(dict.below)
  if (!above && !below) return undefined
  const result: ArcDict = {}
  if (above) result.above = above
  if (below) result.below = below
  return result
}

export function clampHeaderArcs(header: HeaderSpec, maxDot: number): HeaderSpec {
  const arcs = clampArcDict(header.arcs, maxDot)
  const next = { ...header }
  if (arcs) {
    next.arcs = arcs
  } else {
    delete next.arcs
  }
  return next
}

export function applyGroupSpecToTable(
  table: CharacterTable,
  spec: GroupSpec,
): CharacterTable {
  const next = structuredClone(table)
  const dots = dotCount(spec)

  next.groupSpec = structuredClone(spec)
  next.group = formatGroupLatex(spec)
  next.n = dots

  next.groupOrder = formatGroupOrder(spec)

  const oldDots = inferN(table)
  if (dots < oldDots) {
    next.columns = next.columns.map((col) => clampHeaderArcs(col, dots))
    next.rows = next.rows.map((row) => clampHeaderArcs(row, dots))
  }

  return next
}

export function snapshotGroupFields(table: CharacterTable): GroupTableFields {
  return {
    groupSpec: table.groupSpec ? structuredClone(table.groupSpec) : undefined,
    group: table.group,
    n: table.n,
    groupOrder: table.groupOrder,
    columns: structuredClone(table.columns),
    rows: structuredClone(table.rows),
  }
}

export function restoreGroupFields(
  table: CharacterTable,
  fields: GroupTableFields,
): CharacterTable {
  const next = structuredClone(table)
  next.groupSpec = fields.groupSpec
    ? structuredClone(fields.groupSpec)
    : undefined
  next.group = fields.group
  next.n = fields.n
  next.groupOrder = fields.groupOrder
  next.columns = structuredClone(fields.columns)
  next.rows = structuredClone(fields.rows)
  return next
}
