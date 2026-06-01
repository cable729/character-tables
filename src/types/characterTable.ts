/** Arc endpoints keyed by label. Value may be one pair or several pairs sharing a label. */
export type ArcDict = {
  above?: Record<string, [number, number] | [number, number][]>
  below?: Record<string, [number, number] | [number, number][]>
}

/** Column or row header — omit `arcs` for the identity (all zero) pattern. */
export type HeaderSpec = {
  arcs?: ArcDict
  restriction?: string
}

export type CharacterTable = {
  title?: string
  group?: string
  /** Matrix size (number of dots). Inferred from arc endpoints if omitted. */
  n?: number
  columns: HeaderSpec[]
  rows: HeaderSpec[]
  /** matrix[rowIndex][colIndex] — each entry is LaTeX */
  matrix: string[][]
}

/** Normalized arc for rendering. */
export type RenderArc = {
  from: number
  to: number
  label: string
  position: 'above' | 'below'
}

export type Diagram = {
  n: number
  arcs: RenderArc[]
  restriction?: string
}

export type LabelAssignment = Record<string, number>

export type ExpansionSlice = {
  id: string
  assignment: LabelAssignment
  labelLatex: string
}

export type ExpansionBreakdown = {
  aboveLabels: string[]
  belowLabels: string[]
  naiveTotal: number
  restrictedTotal: number
}

export type ViewMode = 'condensed' | 'expanded'

export type ExpandTarget = 'columns' | 'rows' | 'both'
