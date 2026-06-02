import { buildSageThetaSumCode } from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const thetaSumCheck: TableCheck = {
  id: 'theta-sum',
  title: 'Additive character sum (root of unity)',
  description: String.raw`\text{For a nontrivial additive character } \theta \text{ on } \mathbb{F}_q \text{ and } c \neq 0, \quad \sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0. \text{ This verifies the } \theta \text{ implementation used in other checks.}`,
  formulaLatex: String.raw`\sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0 \quad (c \neq 0)`,
  tier: 'numeric',
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('theta-sum', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (_table, qValues) => buildSageThetaSumCode(qValues),
}
