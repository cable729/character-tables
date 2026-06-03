import type { Diagram } from '../types/characterTable'

export function collectLabels(diagram: Diagram): {
  aboveLabels: string[]
  belowLabels: string[]
} {
  const above = new Set<string>()
  const below = new Set<string>()

  for (const arc of diagram.arcs) {
    if (arc.position === 'above') {
      above.add(arc.label)
    } else {
      below.add(arc.label)
    }
  }

  return {
    aboveLabels: [...above],
    belowLabels: [...below],
  }
}

export function naiveChoiceCount(
  aboveLabels: string[],
  belowLabels: string[],
  q: number,
): number {
  const aboveFactor = aboveLabels.length > 0 ? (q - 1) ** aboveLabels.length : 1
  const belowFactor = belowLabels.length > 0 ? q ** belowLabels.length : 1
  return aboveFactor * belowFactor
}

/** Normalize restriction LaTeX to a parseable ASCII form. */
export function normalizeRestriction(latex: string): string {
  return latex
    .replace(/\\neg/g, 'not')
    .replace(/\\neq/g, '!=')
    .replace(/\\ne/g, '!=')
    .replace(/≠/g, '!=')
    .replace(/\\cdot/g, '*')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

/**
 * Evaluate UT₄-style restrictions on label assignments.
 * Supports:
 * - not(a=b=0)  => NOT (a=0 AND b=0)
 * - not(a=c=0)  => NOT (a=0 AND c=0)
 * - a!=b        => a !== b
 * - a!=b=0      => a !== b AND b === 0
 */
export function satisfiesRestriction(
  restrictionLatex: string | undefined,
  assignment: Record<string, number>,
): boolean {
  if (!restrictionLatex) {
    return true
  }

  const parts = restrictionLatex
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    return parts.every((part) => satisfiesRestriction(part, assignment))
  }

  const expr = normalizeRestriction(restrictionLatex)

  if (expr.startsWith('not(') && expr.endsWith(')')) {
    const inner = expr.slice(4, -1)
    const chain = parseEqualityChain(inner)
    if (chain) {
      const last = chain[chain.length - 1]
      if (typeof last === 'number') {
        const labels = chain.slice(0, -1) as string[]
        const allMatch = labels.every((label) => assignment[label] === last)
        return !allMatch
      }
      const allZero = chain.every(
        (label) => typeof label === 'string' && assignment[label] === 0,
      )
      return !allZero
    }
  }

  const neqZeroMatch = expr.match(/^(.+)!=(.+)=0$/)
  if (neqZeroMatch) {
    const [, left, right] = neqZeroMatch
    return assignment[left] !== assignment[right] && assignment[right] === 0
  }

  const neqMatch = expr.match(/^(.+)!=(.+)$/)
  if (neqMatch) {
    const [, left, right] = neqMatch
    if (!(left in assignment)) {
      return Number(right) !== 0
    }
    if (/^\d+$/.test(right)) {
      return assignment[left] !== Number(right)
    }
    return assignment[left] !== assignment[right]
  }

  const chain = parseEqualityChain(expr)
  if (chain) {
    const target = chain[chain.length - 1]
    if (typeof target === 'number') {
      return chain.slice(0, -1).every((label) => {
        if (!(label in assignment)) {
          return target === 0
        }
        return assignment[label] === target
      })
    }
  }

  return true
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

export function enumerateAssignments(
  aboveLabels: string[],
  belowLabels: string[],
  q: number,
  restrictionLatex?: string,
): Record<string, number>[] {
  const aboveValues = aboveLabels.map(() =>
    Array.from({ length: q - 1 }, (_, i) => i + 1),
  )
  const belowValues = belowLabels.map(() =>
    Array.from({ length: q }, (_, i) => i),
  )

  const allLabels = [...aboveLabels, ...belowLabels]
  const allValueLists = [...aboveValues, ...belowValues]

  if (allLabels.length === 0) {
    return [{}]
  }

  const results: Record<string, number>[] = []

  function recurse(index: number, current: Record<string, number>) {
    if (index === allLabels.length) {
      if (satisfiesRestriction(restrictionLatex, current)) {
        results.push({ ...current })
      }
      return
    }

    for (const value of allValueLists[index]) {
      current[allLabels[index]] = value
      recurse(index + 1, current)
    }
  }

  recurse(0, {})
  return results
}
