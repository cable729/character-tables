/** Arc endpoints keyed by label. Value may be one pair or several pairs sharing a label. */
export type ArcDict = {
  above?: Record<string, [number, number] | [number, number][]>
  below?: Record<string, [number, number] | [number, number][]>
}

/** Column or row header — omit `arcs` for the identity (all zero) pattern. */
export type HeaderSpec = {
  /** Stable id; assigned on parse if omitted (col-{n} / row-{n}). */
  id?: string
  arcs?: ArcDict
  restriction?: string
  /** Conjugacy class size |C| as LaTeX (columns only). */
  classSize?: string
  /** Number of classes in this family (n_j). Required when `restriction` is set. */
  expansionCount?: string
}

export type TableType = 'character' | 'supercharacter'

export type GroupSpec =
  | { kind: 'ut_n'; n: number }
  | { kind: 'ut_n_k'; n: number; k: number }

export type CharacterTable = {
  title?: string
  group?: string
  /** Structured group selection; drives dot count when set. */
  groupSpec?: GroupSpec
  /** Default `character`. When `supercharacter`, only supercharacter axioms apply. */
  tableType?: TableType
  /** |G| as LaTeX in q (e.g. q^{6}). Used for conjugacy-class partition checks. */
  groupOrder?: string
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
