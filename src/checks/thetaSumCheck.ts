import { isComplexZero, makeAdditiveTheta, thetaSumOverField } from '../expansion/evalCell'
import { resolveCheckBlocked } from './expansionReadiness'
import { mapCheckAtQ, mergeCheckResults, type TableCheck } from './types'

export function buildSageThetaSumCode(qValues: readonly number[]): string {
  return `# Additive character sum: sum_{x in F_q} theta(c*x) = 0 for c != 0
q_values = [${qValues.join(', ')}]
all_ok = True
for q in q_values:
    F = GF(q)
    chars = [c for c in AdditiveCharacter(F, F) if not c.is_trivial()]
    if not chars:
        print(f"q={q}: no nontrivial additive character")
        all_ok = False
        continue
    chi = chars[0]
    c = F.gen()
    if c == 0:
        c = F.one()
    total = sum(chi(c * x) for x in F)
    ok = total == 0
    all_ok = all_ok and ok
    print(f"q={q}: sum theta(c*x) = {total}, ok={ok}")
print(f"all_ok={all_ok}")
`
}

export const thetaSumCheck: TableCheck = {
  id: 'theta-sum',
  title: 'Additive character sum (root of unity)',
  description: String.raw`\text{For a nontrivial additive character } \theta \text{ on } \mathbb{F}_q \text{ and } c \neq 0, \quad \sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0. \text{ This verifies the } \theta \text{ implementation used in other checks.}`,
  formulaLatex: String.raw`\sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0 \quad (c \neq 0)`,
  tier: 'numeric',
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('theta-sum', table, qValues),
  runLocal: (_table, qValues) => {
    const perQ = mapCheckAtQ(qValues, (q) => {
      const theta = makeAdditiveTheta(q)
      const sum = thetaSumOverField(q, 1, theta)
      const passes = isComplexZero(sum)
      return {
        q,
        passes,
        details: { sumRe: sum.re, sumIm: sum.im },
      }
    })
    return mergeCheckResults(perQ)
  },
  buildSageCode: (_table, qValues) => buildSageThetaSumCode(qValues),
}
