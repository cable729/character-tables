import { buildSageDuplicateIrrepCode } from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const duplicateIrrepCheck: TableCheck = {
  id: 'duplicate-irrep',
  title: 'No duplicate irreducibles (Schur consequence)',
  description: String.raw`\text{Schur's lemma: non-isomorphic irreducibles are not proportional as class functions. We flag distinct expanded rows that are nearly proportional on all classes.}`,
  formulaLatex: String.raw`\nexists\ \lambda \in \mathbb{C}^\times:\ \chi_i = \lambda \chi_k \Rightarrow i = k`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('duplicate-irrep', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) => buildSageDuplicateIrrepCode(table, qValues),
}
