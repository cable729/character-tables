/**
 * Shared θ-substitution and linear-form test vectors (TS + Sage parity).
 */
export type ThetaSubstCase = {
  inner: string
  row: Record<string, number>
  col: Record<string, number>
  expected: string
}

export type EvalThetaCase = {
  latex: string
  row: Record<string, number>
  col: Record<string, number>
  q: number
  /** Expected field element mod q before applying θ */
  fieldElt: number
}

export const THETA_INNER_NORMALIZE_CASES: { input: string; expected: string }[] = [
  { input: '2 1', expected: '2*1' },
  { input: '1 1', expected: '1*1' },
  { input: '0 1', expected: '0*1' },
  { input: '2a', expected: '2*a' },
  { input: '1 2', expected: '1*2' },
  { input: '11', expected: '1*1' },
]

export const THETA_SUBST_CASES: ThetaSubstCase[] = [
  {
    inner: '\\alpha a',
    row: { '\\alpha': 1 },
    col: { a: 1 },
    expected: '1*1',
  },
  {
    inner: '\\alpha a',
    row: { '\\alpha': 2 },
    col: { a: 1 },
    expected: '2*1',
  },
  {
    inner: '\\alpha a',
    row: { '\\alpha': 1 },
    col: { a: 2 },
    expected: '1*2',
  },
  {
    inner: '\\alpha a',
    row: { '\\alpha': 2 },
    col: { a: 2 },
    expected: '2*2',
  },
  {
    inner: '\\alpha a',
    row: { '\\alpha': 0 },
    col: { a: 1 },
    expected: '0*1',
  },
]

export const EVAL_THETA_FIELD_ELT_CASES: EvalThetaCase[] = [
  {
    latex: '\\theta(\\alpha a)',
    row: { '\\alpha': 1 },
    col: { a: 1 },
    q: 3,
    fieldElt: 1,
  },
  {
    latex: '\\theta(\\alpha a)',
    row: { '\\alpha': 2 },
    col: { a: 1 },
    q: 3,
    fieldElt: 2,
  },
  {
    latex: '\\theta(\\alpha a)',
    row: { '\\alpha': 1 },
    col: { a: 2 },
    q: 3,
    fieldElt: 2,
  },
]

/** Sum of (2πi/q)*fieldElt mod 2π — used to compare θ values by angle. */
export function thetaAngle(q: number, fieldElt: number): number {
  const t = ((fieldElt % q) + q) % q
  return (2 * Math.PI * t) / q
}
