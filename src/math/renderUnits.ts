import { formatCompactDisplayLatex } from './formatDisplayLatex'

function latexForMeasure(latex: string, compact: boolean): string {
  const trimmed = latex.trim()
  if (!trimmed) {
    return ''
  }
  const formatted = compact ? formatCompactDisplayLatex(trimmed) : trimmed
  // Kerns tighten rendered width but inflate character-count estimates.
  return formatted.replace(/\\mkern\{[^}]*\}/g, '')
}

/** Approximate visible width: LaTeX commands count as one symbol, drop braces/spaces. */
export function estimateRenderUnits(latex: string, compact = false): number {
  const raw = latexForMeasure(latex, compact)
  if (!raw) {
    return 0
  }
  const simplified = raw
    .replace(/\\[a-zA-Z]+(\*?)?/g, 'X')
    .replace(/[{}()\s^_]/g, '')
  const thetaCount = (raw.match(/\\theta/g) ?? []).length
  const thetaBonus = thetaCount > 1 ? thetaCount * 5 : 0
  const subscriptLetters = (simplified.match(/[a-z]{2,}/gi) ?? [])
    .join('').length
  return simplified.length + thetaBonus + Math.ceil(subscriptLetters * 0.35)
}

/** Conservative width for wrap decisions (KaTeX often exceeds the raw estimate). */
export function estimateRenderUnitsForWrap(
  latex: string,
  compact = false,
): number {
  const base = estimateRenderUnits(latex, compact)
  return Math.ceil(base * (compact ? 1.4 : 1.1))
}
