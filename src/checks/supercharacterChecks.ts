import {
  buildSageSupercharIdentityRegularCode,
  buildSageSupercharOrthogonalBasisCode,
  buildSageSupercharSuperclassSizesCode,
} from '../sage/checkBuilders'
import type { CharacterTable } from '../types/characterTable'
import { sageRequiredBlockedResult } from './sageBlocked'
import {
  isTrivialHeader,
  resolveSupercharacterCheckBlocked,
} from './supercharacterReadiness'
import {
  type CheckResult,
  type TableCheck,
} from './types'

export function runSupercharCountCheck(
  table: CharacterTable,
  _qValues: readonly number[],
): CheckResult {
  const issues: string[] = []
  const nRows = table.rows.length
  const nCols = table.columns.length

  if (nRows !== nCols) {
    issues.push(`${nRows} supercharacters ≠ ${nCols} superclasses`)
  }

  for (let i = 0; i < table.matrix.length; i++) {
    const row = table.matrix[i]
    if (row.length !== nCols) {
      issues.push(`matrix row ${i} has ${row.length} columns, expected ${nCols}`)
    }
  }

  return {
    passes: issues.length === 0,
    details: { issues },
  }
}

export function runSupercharIdentityRegularStructural(
  table: CharacterTable,
): CheckResult {
  const issues: string[] = []

  if (!isTrivialHeader(table.rows[0] ?? {})) {
    issues.push('row 0 must be the trivial supercharacter (no arcs)')
  }
  if (!isTrivialHeader(table.columns[0] ?? {})) {
    issues.push('column 0 must be the identity superclass (no arcs)')
  }

  const identitySize = table.columns[0]?.classSize ?? ''
  if (identitySize !== '1') {
    issues.push(`columns[0].classSize = ${identitySize}, expected 1`)
  }

  for (let j = 0; j < table.columns.length; j++) {
    const cell = table.matrix[0]?.[j] ?? ''
    if (cell !== '1') {
      issues.push(`matrix[0][${j}] = ${cell}, expected 1`)
    }
  }

  return {
    passes: issues.length === 0,
    details: { issues },
  }
}

export const supercharCountCheck: TableCheck = {
  id: 'superchar-count',
  title: 'Supercharacter count matches superclass count',
  description: String.raw`\text{A supercharacter theory has } |Ch(S)| = |\{K\}/{\sim_S}\|, \text{ so the table must be square.}`,
  formulaLatex: String.raw`|Ch(S)| = |\{K\}/{\sim_S}|`,
  tier: 'structural',
  isBlocked: (table) => resolveSupercharacterCheckBlocked('superchar-count', table),
  runLocal: (table, qValues) => runSupercharCountCheck(table, qValues),
}

export const supercharSuperclassSizesCheck: TableCheck = {
  id: 'superchar-superclass-sizes',
  title: 'Superclass sizes are correct',
  description: String.raw`\text{Each column } j \text{ is one superclass } K_j \text{ with size } |K_j|. \text{ The partition identity } \sum_j |K_j| = |G| \text{ says the column headers account for every element of } G. \text{ This check does not use character values.}`,
  formulaLatex: String.raw`\sum_j |K_j| = |G|`,
  tier: 'symbolic',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table) =>
    resolveSupercharacterCheckBlocked('superchar-superclass-sizes', table),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageSupercharSuperclassSizesCode(table, qValues),
}

export const supercharOrthogonalBasisCheck: TableCheck = {
  id: 'superchar-orthogonal-basis',
  title: 'Supercharacters form an orthogonal basis of f(G; ~_S)',
  description: String.raw`\text{The supercharacters must be an orthogonal basis of class functions constant on superclasses: } \mathbb{C}\text{-Span}\{Ch(S)\} = f(G;\sim_S). \text{ With superclass weights } |K_j|, \text{ distinct supercharacters are orthogonal; each has nonzero norm (supercharacters need not be irreducible, so diagonal inner products need not equal } |G|\text{).}`,
  formulaLatex: String.raw`\sum_j |K_j| \chi^K_i \overline{\chi^K_j} = 0 \ (i \neq j),\quad \sum_j |K_j| |\chi^K_i|^2 > 0`,
  tier: 'numeric',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table) =>
    resolveSupercharacterCheckBlocked('superchar-orthogonal-basis', table),
  runLocal: () => sageRequiredBlockedResult(),
  buildSageCode: (table, qValues) =>
    buildSageSupercharOrthogonalBasisCode(table, qValues),
}

export const supercharIdentityRegularCheck: TableCheck = {
  id: 'superchar-identity-regular',
  title: 'Identity superclass and regular character',
  description: String.raw`\text{Axiom 3: the identity lies in its own superclass } [{1}]_{\sim_S} = \{1\}, \text{ and the regular character } reg_G \text{ is constant on superclasses (equivalently } |K_0| = 1 \text{ and superclasses partition } G\text{).}`,
  formulaLatex: String.raw`[{1}]_{\sim_S} = \{1\},\quad reg_G \in f(G;\sim_S)`,
  tier: 'structural',
  requiresGroupOrder: true,
  requiresSage: true,
  usesSage: true,
  isBlocked: (table) =>
    resolveSupercharacterCheckBlocked('superchar-identity-regular', table),
  runLocal: (table, _qValues) => runSupercharIdentityRegularStructural(table),
  buildSageCode: (table, qValues) =>
    buildSageSupercharIdentityRegularCode(table, qValues),
}

export const SUPERCHARACTER_CHECKS: TableCheck[] = [
  supercharCountCheck,
  supercharSuperclassSizesCheck,
  supercharOrthogonalBasisCheck,
  supercharIdentityRegularCheck,
]
