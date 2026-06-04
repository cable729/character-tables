import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import { symbolicCountLatex } from '../diagram/utils'
import { isExpansionCountMissing } from './expansionCountValidation'

/** Infer expansionCount from arcs when switching back to character tables. */
export function fillMissingExpansionCounts(
  table: CharacterTable,
): CharacterTable {
  const fix = (spec: HeaderSpec): HeaderSpec => {
    if (!isExpansionCountMissing(spec)) return spec
    const inferred = symbolicCountLatex(spec)
    return inferred ? { ...spec, expansionCount: inferred } : spec
  }
  return {
    ...table,
    columns: table.columns.map(fix),
    rows: table.rows.map(fix),
  }
}
