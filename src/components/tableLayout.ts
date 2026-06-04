import type { CharacterTable } from '../types/characterTable'
import { isSupercharacterTable } from '../schema/tableSchema'

export type TableCornerLabels = {
  row: string
  col: string
}

export type TableLayoutFlags = {
  superTable: boolean
  showChoicesColumn: boolean
  showArcLabels: boolean
  showRestriction: boolean
  cornerLabels: TableCornerLabels
  /** Sticky offset for diagram column (0 when Choices column is hidden). */
  diagramStickyLeft: string | number
  /** Top offset for the diagram-only header row below |K|/|C|. */
  innerHeaderTopPx: number
}

const OUTER_ROW_H = 28

export function tableLayoutFlags(table: CharacterTable): TableLayoutFlags {
  const superTable = isSupercharacterTable(table)
  return {
    superTable,
    showChoicesColumn: !superTable,
    showArcLabels: !superTable,
    showRestriction: !superTable,
    cornerLabels: superTable
      ? { row: 'superchars', col: 'superclasses' }
      : { row: 'chars', col: 'classes' },
    diagramStickyLeft: superTable ? 0 : 'var(--expansion-col-w)',
    innerHeaderTopPx: superTable ? OUTER_ROW_H : OUTER_ROW_H * 2,
  }
}
