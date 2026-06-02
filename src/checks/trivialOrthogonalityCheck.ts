import { buildSageTrivialOrthogonalityCode } from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const trivialOrthogonalityCheck: TableCheck = {
  id: 'trivial-orthogonality',
  title: 'Orthogonality with the trivial character',
  description: String.raw`\text{For a finite group, } \langle \chi, \mathbf{1} \rangle = \frac{1}{|G|} \sum_{g \in G} \chi(g). \text{ Non-trivial irreducibles are orthogonal to } \mathbf{1}, \text{ so the class-weighted sum over all expanded label choices must vanish. For the trivial row, the sum must equal } |G|.`,
  formulaLatex: String.raw`S_i = \sum_j |C_j| \sum_{rs,cs} z_{i,j}(rs,cs);\quad S_0 = |G|,\ S_i = 0\ (i \neq 0)`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('trivial-orthogonality', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageTrivialOrthogonalityCode(table, qValues),
}
