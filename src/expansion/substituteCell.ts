import type { LabelAssignment } from '../types/characterTable'

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

  // θ(αa) style: Greek + Latin product inside θ(...)
  result = result.replace(/\\theta\(([^)]+)\)/g, (_match, inner: string) => {
    const expanded = expandThetaArg(inner, rowAssignment, colAssignment)
    return `\\theta(${expanded})`
  })

  // δ stays as-is (Kronecker delta — not expanded in v1)
  // Replace standalone parameter labels in products like αa -> numeric
  const allAssignments = { ...colAssignment, ...rowAssignment }
  const labels = Object.keys(allAssignments).sort(
    (a, b) => b.length - a.length,
  )

  for (const label of labels) {
    const value = allAssignments[label]
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Do not replace inside LaTeX command names (e.g. `a` in `\theta`, `\alpha`).
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

  // Simplify numeric products: e.g. 2*3 or juxtaposition 23 -> show as product
  result = result.replace(/(\d)(\d)/g, '$1 \\cdot $2')
  return result
}
