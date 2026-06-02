import { buildSageDegreeSumCode } from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const degreeSumCheck: TableCheck = {
  id: 'degree-sum',
  title: 'Character degrees and ∑ dim² = |G|',
  description: String.raw`\text{For an irreducible } \chi, \quad \chi(1) = \dim(\chi). \text{ Moreover } \sum_{\chi \in \mathrm{Irr}(G)} \dim(\chi)^2 = |G|. \text{ After expansion, degrees are read from column } 0.`,
  formulaLatex: String.raw`\sum_{\chi \in \mathrm{Irr}} \chi(1)^2 = |G|`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('degree-sum', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) => buildSageDegreeSumCode(table, qValues),
}
