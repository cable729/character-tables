import {
  buildSageColumnOrthogonalityCode,
  buildSageRowOrthogonalityCode,
} from '../sage/checkBuilders'
import { resolveCheckBlocked } from './expansionReadiness'
import { sageRequiredBlockedResult } from './sageBlocked'
import type { TableCheck } from './types'

export const rowOrthogonalityCheck: TableCheck = {
  id: 'row-orthogonality',
  title: 'Row orthogonality (first orthogonality relation)',
  description: String.raw`\text{Irreducible characters satisfy } \langle \chi, \psi \rangle = \frac{1}{|G|} \sum_g \chi(g) \overline{\psi(g)}. \text{ On the fully expanded table, weighted inner products should be } |G| \cdot \delta_{ik}.`,
  formulaLatex: String.raw`\frac{1}{|G|}\sum_j |C_j| \sum_{rs,cs} z_{i,j}\overline{z_{k,j}} = \delta_{ik}`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('row-orthogonality', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageRowOrthogonalityCode(table, qValues),
}

export const columnOrthogonalityCheck: TableCheck = {
  id: 'column-orthogonality',
  title: 'Column orthogonality (dual)',
  description: String.raw`\text{The dual orthogonality relation holds for class functions: columns of the expanded table are orthogonal with the same weights } |C_j|. \text{ This check reuses the row Gram matrix (equivalent when the table is complete).}`,
  formulaLatex: String.raw`\text{Same inner product as row orthogonality, columns as class indices}`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table, qValues) =>
    resolveCheckBlocked('column-orthogonality', table, qValues),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageColumnOrthogonalityCode(table, qValues),
}
