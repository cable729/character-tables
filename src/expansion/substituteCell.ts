import type { LabelAssignment } from '../types/characterTable'

/** Find matching `)` for `\theta(` at position `start`, handling nested parens. */
function findMatchingThetaClose(s: string, start: number): number {
  let depth = 0
  for (let i = start; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Replace all `\theta(...)` in the string, handling nested parens via depth tracking.
 */
function replaceThetas(
  latex: string,
  replacer: (inner: string) => string,
): string {
  let result = ''
  let i = 0
  while (i < latex.length) {
    const thetaIdx = latex.indexOf('\\theta(', i)
    if (thetaIdx < 0) {
      result += latex.slice(i)
      break
    }
    result += latex.slice(i, thetaIdx)
    const openParen = thetaIdx + 6 // index of '(' in '\theta('
    const closeParen = findMatchingThetaClose(latex, openParen)
    if (closeParen < 0) {
      result += latex.slice(thetaIdx)
      break
    }
    const inner = latex.slice(openParen + 1, closeParen)
    result += `\\theta(${replacer(inner)})`
    i = closeParen + 1
  }
  return result
}

/**
 * Substitute row/column parameter labels into a cell LaTeX template.
 * Handles patterns like θ(αa), θ(βb), plain label references.
 */
export function substituteCell(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
): string {
  if (!latex) {
    return latex
  }

  let result = latex

  result = replaceThetas(result, (inner) => {
    const trimmed = inner.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parts = trimmed
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
      const expanded = parts.map((part) =>
        expandThetaArg(part, rowAssignment, colAssignment),
      )
      return `[${expanded.join(',')}]`
    }
    return expandThetaArg(inner, rowAssignment, colAssignment)
  })

  const allAssignments = { ...colAssignment, ...rowAssignment }
  const labels = Object.keys(allAssignments).sort(
    (a, b) => b.length - a.length,
  )

  for (const label of labels) {
    const value = allAssignments[label]
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(
      `(?<![\\\\a-zA-Z])${escaped}(?![a-zA-Z])`,
      'g',
    )
    result = result.replace(pattern, String(value))
  }

  return result
}

function expandThetaArg(
  inner: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
): string {
  const combined = { ...colAssignment, ...rowAssignment }
  let result = inner

  const labels = Object.keys(combined).sort((a, b) => b.length - a.length)
  for (const label of labels) {
    const value = combined[label]
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(
      `(?<![\\\\a-zA-Z])${escaped}(?![a-zA-Z])`,
      'g',
    )
    result = result.replace(pattern, String(value))
  }

  return normalizeThetaInnerProducts(result)
}

/**
 * Display-only substitution: same as {@link substituteCell}, but numeric products
 * use LaTeX `\cdot` instead of `*` (for MathCell rendering in failure panels).
 */
export function substituteCellForDisplay(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
): string {
  return substituteCell(latex, rowAssignment, colAssignment).replace(
    /\*/g,
    '\\cdot ',
  )
}

/** After label→value substitution, make linear-form products explicit (e.g. `2 1` → `2*1`). */
export function normalizeThetaInnerProducts(inner: string): string {
  let result = inner
  result = result.replace(/(\d)\s+(\d)/g, '$1*$2')
  result = result.replace(/(\d)\s+([a-zA-Z])/g, '$1*$2')
  result = result.replace(/([a-zA-Z])\s+(\d)/g, '$1*$2')
  result = result.replace(/(\d)([a-zA-Z])/g, '$1*$2')
  result = result.replace(/([a-zA-Z])(\d)/g, '$1*$2')
  result = result.replace(/(\d)(\d)/g, '$1*$2')
  result = result.replace(/(\d)\(/g, '$1*(')
  result = result.replace(/\)\(/g, ')*(')
  result = result.replace(/\)(\d)/g, ')*$1')
  result = result.replace(/\)([a-zA-Z])/g, ')*$1')
  return result
}
