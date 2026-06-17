export function toggleInSet(set: Set<number>, index: number): Set<number> {
  const next = new Set(set)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  return next
}

export function sortedIndices(set: Set<number>): number[] {
  return [...set].sort((a, b) => a - b)
}

export function areAdjacent(indices: number[]): boolean {
  if (indices.length < 2) {
    return false
  }
  for (let i = 1; i < indices.length; i++) {
    if (indices[i]! - indices[i - 1]! !== 1) {
      return false
    }
  }
  return true
}
