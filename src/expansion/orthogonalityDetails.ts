import type { CharacterTable, LabelAssignment } from '../types/characterTable'
import { inferN } from '../diagram/utils'
import { evalQPolynomial } from './evalClassSize'
import { expandRowOrCol } from './expandDiagram'
import { evalCellAtQ, makeAdditiveTheta } from './evalCell'
import { iterateExpandedPairs } from './iterateExpandedPairs'
import { substituteCellForDisplay } from './substituteCell'
import { formatCompactDisplayLatex } from '../math/formatDisplayLatex'

export type AssignmentChip = {
  /** Normalized label without backslash (`alpha`). */
  label: string
  /** Original LaTeX symbol (`\alpha`, `a`, …). */
  latex: string
  value: number
}

export type PreviewCell = {
  key: string
  displayLatex: string
  numericLabel?: string
  classWeight?: number
}

export type ExpandedSlicePreview = {
  axis: 'row' | 'column'
  familyIndex: number
  sliceIndex: number
  key: string
  assignmentChips: AssignmentChip[]
  cells: PreviewCell[]
}

export type OrthogonalityBadPairDetail = {
  aKey: string
  bKey: string
  aLabelLatex: string
  bLabelLatex: string
  ip: string
  expected: string
  sameSlice: boolean
}

export type OrthogonalityPairTableColumn = {
  key: string
  headerLatex: string
  classWeight?: number
}

export type OrthogonalityPairTableRow = {
  headerLatex: string
  classWeight?: number
  cells: { key: string; displayLatex: string }[]
}

/** One header row, one header column, and two compared data rows. */
export type OrthogonalityPairTable = {
  columns: OrthogonalityPairTableColumn[]
  rows: [OrthogonalityPairTableRow, OrthogonalityPairTableRow]
}

export type OrthogonalityFailureModel = {
  axis: 'row' | 'column'
  groupOrder?: number
  pairs: OrthogonalityBadPairDetail[]
  truncatedCount: number
}

export type OrthogonalityBadPairRaw = {
  a: string
  b: string
  ip?: string
  ipRe?: number | string
  ipIm?: number | string
  expected?: number | string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Parse expanded slice keys like `0:0` or legacy `h1.0`. */
export function parseSliceKey(key: string): {
  familyIndex: number
  sliceIndex: number
} | null {
  const colon = /^(\d+):(\d+)$/.exec(key)
  if (colon) {
    return {
      familyIndex: Number(colon[1]),
      sliceIndex: Number(colon[2]),
    }
  }
  const legacy = /^h(\d+)\.(\d+)$/.exec(key)
  if (legacy) {
    return {
      familyIndex: Number(legacy[1]),
      sliceIndex: Number(legacy[2]),
    }
  }
  return null
}

/** Strip LaTeX backslash from Greek labels for readable chips (`\alpha` → `alpha`). */
export function normalizeAssignmentLabel(label: string): string {
  return label.startsWith('\\') ? label.slice(1) : label
}

export function assignmentChips(assignment: LabelAssignment): AssignmentChip[] {
  return Object.entries(assignment)
    .map(([label, value]) => ({
      label: normalizeAssignmentLabel(label),
      latex: label,
      value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function formatComplex(re: number, im: number): string {
  if (Math.abs(im) < 1e-9) {
    return String(re)
  }
  const imPart = Math.abs(im - 1) < 1e-9 ? 'i' : `${im}i`
  if (Math.abs(re) < 1e-9) {
    return imPart
  }
  const sign = im >= 0 ? ' + ' : ' - '
  const imAbs = Math.abs(im)
  const imText = Math.abs(imAbs - 1) < 1e-9 ? 'i' : `${imAbs}i`
  return `${re}${sign}${imText}`
}

function formatIp(pair: OrthogonalityBadPairRaw): string {
  if (typeof pair.ip === 'string' && pair.ip.length > 0) {
    return pair.ip
  }
  const re =
    typeof pair.ipRe === 'number'
      ? pair.ipRe
      : typeof pair.ipRe === 'string'
        ? Number(pair.ipRe)
        : NaN
  const im =
    typeof pair.ipIm === 'number'
      ? pair.ipIm
      : typeof pair.ipIm === 'string'
        ? Number(pair.ipIm)
        : 0
  if (!Number.isNaN(re)) {
    return formatComplex(re, im)
  }
  return '?'
}

function formatExpected(
  axis: 'row' | 'column',
  pair: OrthogonalityBadPairRaw,
): string {
  const expected = pair.expected
  if (expected == null) {
    return '?'
  }
  if (axis === 'column' && pair.a === pair.b) {
    return `${expected} (= |G| / |C|)`
  }
  return String(expected)
}

function displaySubstitutedLatex(
  latex: string,
  rowAssignment: LabelAssignment,
  colAssignment: LabelAssignment,
): string {
  return formatCompactDisplayLatex(
    substituteCellForDisplay(latex, rowAssignment, colAssignment),
  )
}

function getSliceAssignment(
  table: CharacterTable,
  q: number,
  axis: 'row' | 'column',
  familyIndex: number,
  sliceIndex: number,
): LabelAssignment {
  const n = inferN(table)
  const specs = axis === 'row' ? table.rows : table.columns
  const slices = expandRowOrCol(specs[familyIndex]!, n, familyIndex, q)
  return slices[sliceIndex]?.assignment ?? {}
}

export function buildExpandedRowPreview(
  table: CharacterTable,
  q: number,
  rowIndex: number,
  rowSliceIndex: number,
): ExpandedSlicePreview {
  const theta = makeAdditiveTheta(q)
  const rowAssignment = getSliceAssignment(
    table,
    q,
    'row',
    rowIndex,
    rowSliceIndex,
  )
  const cells: PreviewCell[] = iterateExpandedPairs(table, q)
    .filter(
      (p) => p.rowIndex === rowIndex && p.rowSliceIndex === rowSliceIndex,
    )
    .map((p) => {
      const v = evalCellAtQ(
        p.cellLatex,
        p.rowAssignment,
        p.colAssignment,
        q,
        theta,
      )
      return {
        key: `${p.colIndex}:${p.colSliceIndex}`,
        displayLatex: displaySubstitutedLatex(
          p.cellLatex,
          p.rowAssignment,
          p.colAssignment,
        ),
        numericLabel: formatComplex(v.re, v.im),
        classWeight: p.classWeight,
      }
    })

  return {
    axis: 'row',
    familyIndex: rowIndex,
    sliceIndex: rowSliceIndex,
    key: `${rowIndex}:${rowSliceIndex}`,
    assignmentChips: assignmentChips(rowAssignment),
    cells,
  }
}

export function buildExpandedColumnPreview(
  table: CharacterTable,
  q: number,
  colIndex: number,
  colSliceIndex: number,
): ExpandedSlicePreview {
  const theta = makeAdditiveTheta(q)
  const colAssignment = getSliceAssignment(
    table,
    q,
    'column',
    colIndex,
    colSliceIndex,
  )
  const classSize = table.columns[colIndex]?.classSize ?? '1'
  const classWeight = evalQPolynomial(classSize, q)
  const cells: PreviewCell[] = iterateExpandedPairs(table, q)
    .filter(
      (p) => p.colIndex === colIndex && p.colSliceIndex === colSliceIndex,
    )
    .map((p) => {
      const v = evalCellAtQ(
        p.cellLatex,
        p.rowAssignment,
        p.colAssignment,
        q,
        theta,
      )
      return {
        key: `${p.rowIndex}:${p.rowSliceIndex}`,
        displayLatex: displaySubstitutedLatex(
          p.cellLatex,
          p.rowAssignment,
          p.colAssignment,
        ),
        numericLabel: formatComplex(v.re, v.im),
      }
    })

  return {
    axis: 'column',
    familyIndex: colIndex,
    sliceIndex: colSliceIndex,
    key: `${colIndex}:${colSliceIndex}`,
    assignmentChips: assignmentChips(colAssignment),
    cells: cells.map((cell) => ({ ...cell, classWeight })),
  }
}

function buildSliceLabelLatex(
  table: CharacterTable,
  q: number,
  axis: 'row' | 'column',
  familyIndex: number,
  sliceIndex: number,
): string {
  const assignment = getSliceAssignment(
    table,
    q,
    axis,
    familyIndex,
    sliceIndex,
  )
  const preview: ExpandedSlicePreview = {
    axis,
    familyIndex,
    sliceIndex,
    key: `${familyIndex}:${sliceIndex}`,
    assignmentChips: assignmentChips(assignment),
    cells: [],
  }
  return slicePreviewLabelLatex(preview)
}

/** @deprecated Use lightweight pair summary fields instead. */
export function slicePreviewTitleFromKey(
  table: CharacterTable,
  q: number,
  axis: 'row' | 'column',
  key: string,
): string {
  const parsed = parseSliceKey(key)
  if (!parsed) {
    return key
  }
  const assignment = getSliceAssignment(
    table,
    q,
    axis,
    parsed.familyIndex,
    parsed.sliceIndex,
  )
  const preview: ExpandedSlicePreview = {
    axis,
    familyIndex: parsed.familyIndex,
    sliceIndex: parsed.sliceIndex,
    key,
    assignmentChips: assignmentChips(assignment),
    cells: [],
  }
  return slicePreviewTitle(preview)
}

function headerLatexForCrossAxisKey(
  table: CharacterTable,
  q: number,
  checkAxis: 'row' | 'column',
  cellKey: string,
): string {
  const parsed = parseSliceKey(cellKey)
  if (!parsed) {
    return cellKey
  }
  const crossAxis = checkAxis === 'row' ? 'column' : 'row'
  return buildSliceLabelLatex(
    table,
    q,
    crossAxis,
    parsed.familyIndex,
    parsed.sliceIndex,
  )
}

export function buildOrthogonalityPairTable(
  table: CharacterTable,
  q: number,
  axis: 'row' | 'column',
  aKey: string,
  bKey: string,
): OrthogonalityPairTable | null {
  const parsedA = parseSliceKey(aKey)
  const parsedB = parseSliceKey(bKey)
  if (!parsedA || !parsedB) {
    return null
  }

  if (axis === 'row') {
    const rowA = buildExpandedRowPreview(
      table,
      q,
      parsedA.familyIndex,
      parsedA.sliceIndex,
    )
    const rowB = buildExpandedRowPreview(
      table,
      q,
      parsedB.familyIndex,
      parsedB.sliceIndex,
    )
    const bByKey = new Map(rowB.cells.map((c) => [c.key, c]))
    const columns: OrthogonalityPairTableColumn[] = rowA.cells.map((cell) => ({
      key: cell.key,
      headerLatex: headerLatexForCrossAxisKey(table, q, axis, cell.key),
      classWeight: cell.classWeight,
    }))
    const rows: [OrthogonalityPairTableRow, OrthogonalityPairTableRow] = [
      {
        headerLatex: slicePreviewLabelLatex(rowA),
        cells: rowA.cells.map((c) => ({
          key: c.key,
          displayLatex: c.displayLatex,
        })),
      },
      {
        headerLatex: slicePreviewLabelLatex(rowB),
        cells: columns.map((col) => ({
          key: col.key,
          displayLatex: bByKey.get(col.key)?.displayLatex ?? '0',
        })),
      },
    ]
    return { columns, rows }
  }

  const colA = buildExpandedColumnPreview(
    table,
    q,
    parsedA.familyIndex,
    parsedA.sliceIndex,
  )
  const colB = buildExpandedColumnPreview(
    table,
    q,
    parsedB.familyIndex,
    parsedB.sliceIndex,
  )
  const bByKey = new Map(colB.cells.map((c) => [c.key, c]))
  const columns: OrthogonalityPairTableColumn[] = colA.cells.map((cell) => ({
    key: cell.key,
    headerLatex: headerLatexForCrossAxisKey(table, q, axis, cell.key),
  }))
  const rows: [OrthogonalityPairTableRow, OrthogonalityPairTableRow] = [
    {
      headerLatex: slicePreviewLabelLatex(colA),
      classWeight: colA.cells[0]?.classWeight,
      cells: colA.cells.map((c) => ({
        key: c.key,
        displayLatex: c.displayLatex,
      })),
    },
    {
      headerLatex: slicePreviewLabelLatex(colB),
      classWeight: colB.cells[0]?.classWeight,
      cells: columns.map((col) => ({
        key: col.key,
        displayLatex: bByKey.get(col.key)?.displayLatex ?? '0',
      })),
    },
  ]
  return { columns, rows }
}

export function buildOrthogonalityFailureModel(
  checkId: 'row-orthogonality' | 'column-orthogonality',
  table: CharacterTable,
  q: number,
  details: unknown,
): OrthogonalityFailureModel | null {
  if (!isRecord(details) || !Array.isArray(details.badPairs)) {
    return null
  }

  const axis = checkId === 'row-orthogonality' ? 'row' : 'column'
  const rawPairs = details.badPairs.filter(isRecord) as OrthogonalityBadPairRaw[]
  const pairs: OrthogonalityBadPairDetail[] = []

  for (const pair of rawPairs) {
    if (typeof pair.a !== 'string' || typeof pair.b !== 'string') {
      continue
    }
    const parsedA = parseSliceKey(pair.a)
    const parsedB = parseSliceKey(pair.b)
    if (!parsedA || !parsedB) {
      continue
    }
    pairs.push({
      aKey: pair.a,
      bKey: pair.b,
      aLabelLatex: buildSliceLabelLatex(
        table,
        q,
        axis,
        parsedA.familyIndex,
        parsedA.sliceIndex,
      ),
      bLabelLatex: buildSliceLabelLatex(
        table,
        q,
        axis,
        parsedB.familyIndex,
        parsedB.sliceIndex,
      ),
      ip: formatIp(pair),
      expected: formatExpected(axis, pair),
      sameSlice: pair.a === pair.b,
    })
  }

  if (pairs.length === 0) {
    return null
  }

  const groupOrder = details.groupOrder
  return {
    axis,
    groupOrder: typeof groupOrder === 'number' ? groupOrder : undefined,
    pairs,
    truncatedCount: Math.max(0, rawPairs.length - pairs.length),
  }
}

export function slicePreviewTitle(
  preview: ExpandedSlicePreview,
): string {
  const label = preview.axis === 'row' ? 'Row' : 'Col'
  const chips =
    preview.assignmentChips.length > 0
      ? `[${preview.assignmentChips.map((c) => `${c.label}=${c.value}`).join(', ')}]`
      : ''
  return `${label} ${preview.familyIndex}${chips ? ` ${chips}` : ''}`
}

/** LaTeX row/col label with assignments, e.g. `\text{Row }0\ [\alpha=0,\ \beta=1]`. */
export function slicePreviewLabelLatex(preview: ExpandedSlicePreview): string {
  const axis =
    preview.axis === 'row'
      ? String.raw`\text{Row }`
      : String.raw`\text{Col }`
  const index = String(preview.familyIndex)
  if (preview.assignmentChips.length === 0) {
    return `${axis}${index}`
  }
  const assignments = preview.assignmentChips
    .map((c) => `${c.latex}=${c.value}`)
    .join(', ')
  return `${axis}${index}\\,[${assignments}]`
}
