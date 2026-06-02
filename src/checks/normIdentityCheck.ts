import { buildSageNormIdentityCode } from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const normIdentityCheck: TableCheck = {
  id: 'norm-identity',
  title: 'Irreducible norm identity',
  description: String.raw`\text{Row orthogonality with } \chi = \psi \text{ gives } \langle \chi, \chi \rangle = 1, \text{ hence } \sum_{[g]} |[g]| \, |\chi(g)|^2 = |G| \text{ for each expanded irreducible.}`,
  formulaLatex: String.raw`\sum_j |C_j| \sum_{cs} |z_{i,j}|^2 = |G|`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('norm-identity', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) => buildSageNormIdentityCode(table, qValues),
}
