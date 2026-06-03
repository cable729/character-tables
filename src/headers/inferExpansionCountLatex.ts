import { evalQPolynomial } from '../expansion/evalClassSize'

/** Candidate LaTeX forms ordered by specificity (prefer factored forms). */
const COUNT_TEMPLATES = [
  'q^{3}-1',
  'q^{2}-1',
  '(q-1)q^{2}',
  '(q-1)^{3}',
  '(q-1)^{2}',
  '(q-1)q',
  '(q^2-q)',
  '(q-1)',
  'q^{3}',
  'q^{2}',
  'q',
  '1',
] as const

/**
 * Infer a q-polynomial expansionCount string from a numeric count at prime-power q.
 */
export function inferExpansionCountLatex(
  countAtQ: number,
  q: number,
): string | null {
  for (const template of COUNT_TEMPLATES) {
    if (evalQPolynomial(template, q) === countAtQ) {
      return template === '(q^2-q)' ? '(q-1)q' : template
    }
  }
  return null
}
