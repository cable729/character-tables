import type { CharacterTable } from '../types/characterTable'
import {
  buildCheckCall,
  buildFullSageScript,
  buildThetaSumFragment,
} from './codegen'

export function buildSageThetaSumCode(qValues: readonly number[]): string {
  return buildThetaSumFragment(qValues)
}

export function buildSageConjugacyCheckCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('conjugacy', 'run_conjugacy_check', qValues)
}

export function buildSageCountBalanceCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('expanded-count-balance', 'run_count_balance_check', qValues)
}

export function buildSageRowOrthogonalityCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('row-orthogonality', 'run_row_orthogonality_check', qValues)
}

export function buildSageColumnOrthogonalityCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('column-orthogonality', 'run_row_orthogonality_check', qValues)
}

export function buildSageDegreeSumCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('degree-sum', 'run_degree_sum_check', qValues)
}

export function buildSageTrivialOrthogonalityCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('trivial-orthogonality', 'run_trivial_orthogonality_check', qValues)
}

export function buildSageNormIdentityCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('norm-identity', 'run_norm_identity_check', qValues)
}

export function buildSageDuplicateIrrepCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('duplicate-irrep', 'run_duplicate_irrep_check', qValues)
}

export function buildSageArcPatternCode(
  _table: CharacterTable,
  qValues: readonly number[],
): string {
  return buildCheckCall('arc-patterns', 'run_arc_pattern_check', qValues)
}

export function buildCombinedSageScript(
  table: CharacterTable,
  fragments: string[],
): string {
  return buildFullSageScript(table, fragments)
}
