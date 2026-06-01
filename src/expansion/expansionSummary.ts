import type { CharacterTable, ExpandTarget } from '../types/characterTable'
import { inferN } from '../diagram/utils'
import { totalExpandedCount } from '../expansion/expandDiagram'

export function expansionSummary(
  table: CharacterTable,
  q: number,
  expandTarget: ExpandTarget,
): string {
  const n = inferN(table)
  const expandCols =
    expandTarget === 'columns' || expandTarget === 'both'
  const expandRows =
    expandTarget === 'rows' || expandTarget === 'both'

  const colCount = expandCols
    ? totalExpandedCount(table.columns, n, q)
    : table.columns.length
  const rowCount = expandRows
    ? totalExpandedCount(table.rows, n, q)
    : table.rows.length

  return `${table.columns.length} condensed columns → ${colCount} expanded · ${table.rows.length} condensed rows → ${rowCount} expanded @ q=${q}`
}
