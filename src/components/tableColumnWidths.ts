import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import {
  expansionCountLatex,
  getCellLatex,
  headerToDiagram,
} from '../diagram/utils'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { diagramSvgWidthPx } from './ArcDiagram'
import { estimateRenderUnits } from '../math/renderUnits'
import {
  displayLatexForCell,
  maxWrappedLineUnits,
  needsMultilineWrap,
  parseTopLevelFactors,
} from '../math/wrapDisplayLatex'
export { estimateRenderUnits } from '../math/renderUnits'

export type StickyColumnWidths = {
  expansion: number
  diagram: number
}

/** Matches compact diagram / math scale in the UI. */
export const COMPACT_LAYOUT_SCALE = 0.82

const EXPANSION_COL_FLOOR = 72
const EXPANSION_COL_FLOOR_COMPACT = 54
const EXPANSION_COL_CAP = 140
const EXPANSION_COL_CAP_COMPACT = 100

const DIAGRAM_COL_FLOOR = 84
const DIAGRAM_COL_CAP = 168
const DIAGRAM_COL_CAP_COMPACT = 108

/** Floor for columns that need a minimum (long math). Short columns omit min width. */
export const DATA_COL_MIN_W = 28
export const DATA_COL_MAX_W = 280
/** Below this render-unit count, let table-auto size the column to content. */
export const DATA_COL_AUTO_THRESHOLD = 10

const RENDER_UNIT_PX = 5.5
/** When wrapping to 2 lines, approximate per-line width. */
const TWO_LINE_WIDTH_FACTOR = 1.1

function layoutScale(compact: boolean): number {
  return compact ? COMPACT_LAYOUT_SCALE : 1
}

function cellPaddingPx(compact: boolean, extra = 0): number {
  return (compact ? 6 : 10) + extra
}

function unitsToPx(units: number, compact: boolean, extra = 0): number {
  return Math.round(
    units * RENDER_UNIT_PX * layoutScale(compact) + cellPaddingPx(compact, extra),
  )
}

function minWidthFromUnits(
  units: number,
  compact: boolean,
  alreadyPerLine = false,
): number | undefined {
  if (units <= DATA_COL_AUTO_THRESHOLD) {
    return undefined
  }
  const perLineUnits = alreadyPerLine
    ? units
    : Math.ceil((units / 2) * TWO_LINE_WIDTH_FACTOR)
  const raw = unitsToPx(perLineUnits, compact)
  const min = compact ? 24 : DATA_COL_MIN_W
  const max = compact ? Math.round(DATA_COL_MAX_W * COMPACT_LAYOUT_SCALE) : DATA_COL_MAX_W
  return Math.min(max, Math.max(min, raw))
}

function latexWidthUnits(latex: string, compact: boolean): number {
  const trimmed = latex.trim()
  if (!trimmed) {
    return 0
  }
  if (!compact) {
    return estimateRenderUnits(trimmed, false)
  }

  const display = displayLatexForCell(trimmed, true)
  const displayUnits = estimateRenderUnits(display, true)
  const factors = parseTopLevelFactors(trimmed)
  const lineBudget = Math.max(6, Math.ceil(displayUnits / 2))
  if (
    factors.length < 2 ||
    !needsMultilineWrap(display, factors, true, lineBudget)
  ) {
    return displayUnits
  }

  const storedUnits = estimateRenderUnits(trimmed, true)
  const halvedDisplay = Math.ceil((displayUnits / 2) * TWO_LINE_WIDTH_FACTOR)
  const halvedStored = Math.ceil((storedUnits / 2) * TWO_LINE_WIDTH_FACTOR)
  const lineMax = maxWrappedLineUnits(trimmed, true)
  return Math.min(halvedDisplay, halvedStored, lineMax)
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
    latexWidthUnits(col?.classSize ?? '', compact),
    latexWidthUnits(col?.expansionCount ?? '', compact),
  )

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    maxUnits = Math.max(
      maxUnits,
      latexWidthUnits(getCellLatex(table, rowIndex, colIndex), compact),
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
  return minWidthFromUnits(
    maxUnitsInColumn(table, colIndex, compact),
    compact,
    compact,
  )
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
  compact: boolean,
  extraPadding = 0,
): number {
  const raw = unitsToPx(units, compact, extraPadding)
  return Math.min(cap, Math.max(floor, raw))
}

function expansionCountLatexForWidth(spec: HeaderSpec): string {
  if (isExpansionCountMissing(spec)) {
    return 'expansionCount required'
  }
  return expansionCountLatex(spec)
}

function expansionCountUnits(latex: string, compact: boolean): number {
  const trimmed = latex.trim()
  if (!trimmed) {
    return 0
  }
  const lengthScale = compact ? 0.5 : 0.7
  return Math.max(
    estimateRenderUnits(trimmed, compact),
    Math.ceil(trimmed.length * lengthScale),
  )
}

/** Width for expansion-count / "Choices" sticky column from header labels. */
export function expansionColumnWidthPx(
  table: CharacterTable,
  compact = false,
): number {
  let maxUnits = expansionCountUnits('Choices', compact)

  for (const row of table.rows) {
    maxUnits = Math.max(
      maxUnits,
      expansionCountUnits(expansionCountLatexForWidth(row), compact),
    )
  }
  for (const col of table.columns) {
    maxUnits = Math.max(
      maxUnits,
      expansionCountUnits(expansionCountLatexForWidth(col), compact),
    )
  }

  const floor = compact ? EXPANSION_COL_FLOOR_COMPACT : EXPANSION_COL_FLOOR
  const cap = compact ? EXPANSION_COL_CAP_COMPACT : EXPANSION_COL_CAP
  return fixedColumnWidth(maxUnits, floor, cap, compact, compact ? 4 : 12)
}

function maxRestrictionUnitsInTable(
  table: CharacterTable,
  n: number,
  compact: boolean,
): number {
  let maxRestrictionUnits = 0

  for (const row of table.rows) {
    const diagram = headerToDiagram(row, n)
    if (diagram.restriction) {
      maxRestrictionUnits = Math.max(
        maxRestrictionUnits,
        estimateRenderUnits(diagram.restriction, compact),
      )
    }
  }
  for (const col of table.columns) {
    const diagram = headerToDiagram(col, n)
    if (diagram.restriction) {
      maxRestrictionUnits = Math.max(
        maxRestrictionUnits,
        estimateRenderUnits(diagram.restriction, compact),
      )
    }
  }

  return maxRestrictionUnits
}

/** Width for diagram / "chars" sticky column (SVG + restriction line). */
export function diagramColumnWidthPx(
  table: CharacterTable,
  n: number,
  compact = false,
): number {
  const maxRestrictionUnits = maxRestrictionUnitsInTable(table, n, compact)

  if (!compact) {
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
      fixedColumnWidth(
        restrictionUnits,
        DIAGRAM_COL_FLOOR,
        DIAGRAM_COL_CAP,
        false,
        16,
      ),
    )
  }

  const cap = DIAGRAM_COL_CAP_COMPACT
  const svgW = diagramSvgWidthPx(n, true)
  const restrictionPx =
    maxRestrictionUnits > 0 ? unitsToPx(maxRestrictionUnits, true, 2) : 0

  const contentW = Math.max(svgW, restrictionPx) + cellPaddingPx(true, 2)
  return Math.min(cap, contentW)
}

export function stickyColumnWidths(
  table: CharacterTable,
  n: number,
  compact = false,
  options?: { includeExpansionColumn?: boolean },
): StickyColumnWidths {
  const includeExpansion =
    (options?.includeExpansionColumn ?? true) &&
    table.tableType !== 'supercharacter'
  return {
    expansion: includeExpansion ? expansionColumnWidthPx(table, compact) : 0,
    diagram: diagramColumnWidthPx(table, n, compact),
  }
}
