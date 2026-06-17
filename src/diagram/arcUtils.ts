import type { ArcDict } from '../types/characterTable'

/** Normalize a single pair or list of pairs from an arc dict entry. */
export function flattenArcPairs(
  value: [number, number] | [number, number][],
): [number, number][] {
  if (value.length === 0) return []
  if (typeof value[0] === 'number') {
    return [value as [number, number]]
  }
  return value as [number, number][]
}

export function cloneArcDict(arcs?: ArcDict): ArcDict | undefined {
  if (!arcs) {
    return undefined
  }
  return {
    above: arcs.above ? { ...arcs.above } : undefined,
    below: arcs.below ? { ...arcs.below } : undefined,
  }
}

/** Move a below label to above; no-op when the label is missing. */
export function promoteBelowLabelToAbove(arcs: ArcDict, label: string): ArcDict {
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

/** Parse chained equalities like `a=b=0` into labels and numeric literals. */
export function parseEqualityChain(expr: string): (string | number)[] | null {
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
