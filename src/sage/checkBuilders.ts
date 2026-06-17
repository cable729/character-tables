import type { CharacterTable } from '../types/characterTable'
import {
  buildCheckCall,
  buildFullSageScript,
  buildThetaSumFragment,
} from './codegen'

const SAGE_CHECK_RUNNERS: Readonly<Record<string, string>> = {
  conjugacy: 'run_conjugacy_check',
  'expanded-count-balance': 'run_count_balance_check',
  'row-orthogonality': 'run_row_orthogonality_check',
  'column-orthogonality': 'run_column_orthogonality_check',
  'degree-sum': 'run_degree_sum_check',
  'trivial-orthogonality': 'run_trivial_orthogonality_check',
  'norm-identity': 'run_norm_identity_check',
  'duplicate-irrep': 'run_duplicate_irrep_check',
  'arc-patterns': 'run_arc_pattern_check',
  'superchar-superclass-sizes': 'run_superchar_superclass_sizes_check',
  'superchar-orthogonal-basis': 'run_superchar_orthogonal_basis_check',
  'superchar-identity-regular': 'run_superchar_identity_regular_check',
}

export function buildSageCheckCode(
  checkId: string,
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  const runner = SAGE_CHECK_RUNNERS[checkId]
  if (!runner) {
    throw new Error(`No Sage runner for check id: ${checkId}`)
  }
  return buildCheckCall(checkId, runner, qValues)
}

export function buildSageThetaSumCode(qValues: readonly number[]): string {
  return buildThetaSumFragment(qValues)
}

export function buildCombinedSageScript(
  table: CharacterTable,
  fragments: string[],
): string {
  return buildFullSageScript(table, fragments)
}
