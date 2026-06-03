import type { CharacterTable } from '../types/characterTable'
import {
  expansionCountLatex,
  getCellLatex,
  headerToDiagram,
} from '../diagram/utils'
import { formatDisplayLatex } from '../math/formatDisplayLatex'

export type StickyColumnWidths = {
  expansion: number
  diagram: number
}

const EXPANSION_COL_FLOOR = 72
const EXPANSION_COL_CAP = 140
const DIAGRAM_COL_FLOOR = 84
const DIAGRAM_COL_CAP = 168

/** Floor for columns that need a minimum (long math). Short columns omit min width. */
export const DATA_COL_MIN_W = 28
export const DATA_COL_MAX_W = 280
/** Below this render-unit count, let table-auto size the column to content. */
export const DATA_COL_AUTO_THRESHOLD = 10

const RENDER_UNIT_PX = 5.5
const CELL_PADDING_PX = 10

function latexForMeasure(latex: string, compact: boolean): string {
  const trimmed = latex.trim()
  if (!trimmed) {
    return ''
  }
  return compact ? formatDisplayLatex(trimmed) : trimmed
}

/** Approximate visible width: LaTeX commands count as one symbol, drop braces/spaces. */
export function estimateRenderUnits(latex: string, compact = false): number {
  const raw = latexForMeasure(latex, compact)
  if (!raw) {
    return 0
  }
  const simplified = raw
    .replace(/\\[a-zA-Z]+(\*?)?/g, 'X')
    .replace(/[{}()\s^_]/g, '')
  const thetaCount = (raw.match(/\\theta/g) ?? []).length
  const thetaBonus = thetaCount > 1 ? thetaCount * 5 : 0
  return simplified.length + thetaBonus
}

function minWidthFromUnits(units: number): number | undefined {
  if (units <= DATA_COL_AUTO_THRESHOLD) {
    return undefined
  }
  const raw = units * RENDER_UNIT_PX + CELL_PADDING_PX
  return Math.min(DATA_COL_MAX_W, Math.max(DATA_COL_MIN_W, Math.round(raw)))
}

function maxUnitsInColumn(
  table: CharacterTable,
  colIndex: number,
  compact: boolean,
): number {
  let maxUnits = 0

  const col = table.columns[colIndex]
  maxUnits = Math.max(
    maxUnits,
    estimateRenderUnits(col?.classSize ?? '', compact),
    estimateRenderUnits(col?.expansionCount ?? '', compact),
  )

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    maxUnits = Math.max(
      maxUnits,
      estimateRenderUnits(getCellLatex(table, rowIndex, colIndex), compact),
    )
  }

  return maxUnits
}

/** Min width for a data column, or undefined to let table-auto shrink to content. */
export function dataColumnMinWidthPx(
  table: CharacterTable,
  colIndex: number,
  compact = false,
): number | undefined {
  return minWidthFromUnits(maxUnitsInColumn(table, colIndex, compact))
}

export function dataColumnMinWidths(
  table: CharacterTable,
  compact = false,
): (number | undefined)[] {
  return table.columns.map((_, colIndex) =>
    dataColumnMinWidthPx(table, colIndex, compact),
  )
}

function fixedColumnWidth(
  units: number,
  floor: number,
  cap: number,
  extraPadding = 0,
): number {
  const raw = Math.round(units * RENDER_UNIT_PX + CELL_PADDING_PX + extraPadding)
  return Math.min(cap, Math.max(floor, raw))
}

function expansionCountUnits(latex: string): number {
  const trimmed = latex.trim()
  if (!trimmed) {
    return 0
  }
  return Math.max(
    estimateRenderUnits(trimmed),
    Math.ceil(trimmed.length * 0.7),
  )
}

/** Width for expansion-count / "Choices" sticky column from header labels. */
export function expansionColumnWidthPx(table: CharacterTable): number {
  let maxUnits = expansionCountUnits('Choices')

  for (const row of table.rows) {
    maxUnits = Math.max(maxUnits, expansionCountUnits(expansionCountLatex(row)))
  }
  for (const col of table.columns) {
    maxUnits = Math.max(maxUnits, expansionCountUnits(expansionCountLatex(col)))
  }

  return fixedColumnWidth(maxUnits, EXPANSION_COL_FLOOR, EXPANSION_COL_CAP, 12)
}

/** Width for diagram / "chars" sticky column (SVG + restriction line). */
export function diagramColumnWidthPx(table: CharacterTable, n: number): number {
  let maxRestrictionUnits = 0

  for (const row of table.rows) {
    const diagram = headerToDiagram(row, n)
    if (diagram.restriction) {
      maxRestrictionUnits = Math.max(
        maxRestrictionUnits,
        estimateRenderUnits(diagram.restriction),
      )
    }
  }
  for (const col of table.columns) {
    const diagram = headerToDiagram(col, n)
    if (diagram.restriction) {
      maxRestrictionUnits = Math.max(
        maxRestrictionUnits,
        estimateRenderUnits(diagram.restriction),
      )
    }
  }

  if (maxRestrictionUnits === 0) {
    return DIAGRAM_COL_FLOOR
  }

  const restrictionUnits = Math.max(
    maxRestrictionUnits,
    ...table.rows
      .map((row) => headerToDiagram(row, n).restriction?.trim() ?? '')
      .filter(Boolean)
      .map((r) => Math.ceil(r.length * 0.55)),
    ...table.columns
      .map((col) => headerToDiagram(col, n).restriction?.trim() ?? '')
      .filter(Boolean)
      .map((r) => Math.ceil(r.length * 0.55)),
  )

  return Math.max(
    DIAGRAM_COL_FLOOR,
    fixedColumnWidth(restrictionUnits, DIAGRAM_COL_FLOOR, DIAGRAM_COL_CAP, 16),
  )
}

export function stickyColumnWidths(
  table: CharacterTable,
  n: number,
): StickyColumnWidths {
  return {
    expansion: expansionColumnWidthPx(table),
    diagram: diagramColumnWidthPx(table, n),
  }
}
