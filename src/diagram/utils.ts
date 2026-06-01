import type { ArcDict, CharacterTable, Diagram, HeaderSpec, RenderArc } from '../types/characterTable'

function flattenArcPairs(
  value: [number, number] | [number, number][],
): [number, number][] {
  if (value.length === 0) return []
  if (typeof value[0] === 'number') {
    return [value as [number, number]]
  }
  return value as [number, number][]
}

export function arcDictToRenderArcs(dict: ArcDict | undefined): RenderArc[] {
  if (!dict) return []

  const arcs: RenderArc[] = []
  for (const [label, pairs] of Object.entries(dict.above ?? {})) {
    for (const [from, to] of flattenArcPairs(pairs)) {
      arcs.push({ from, to, label, position: 'above' })
    }
  }
  for (const [label, pairs] of Object.entries(dict.below ?? {})) {
    for (const [from, to] of flattenArcPairs(pairs)) {
      arcs.push({ from, to, label, position: 'below' })
    }
  }
  return arcs
}

export function headerToDiagram(spec: HeaderSpec, n: number): Diagram {
  return {
    n,
    arcs: arcDictToRenderArcs(spec.arcs),
    restriction: spec.restriction,
  }
}

export function inferN(table: Pick<CharacterTable, 'n' | 'columns' | 'rows'>): number {
  if (table.n != null && table.n >= 1) {
    return table.n
  }

  let max = 1
  const scan = (spec: HeaderSpec) => {
    for (const dict of [spec.arcs?.above, spec.arcs?.below]) {
      if (!dict) continue
      for (const pairs of Object.values(dict)) {
        for (const [from, to] of flattenArcPairs(pairs)) {
          max = Math.max(max, from, to)
        }
      }
    }
  }
  for (const col of table.columns) scan(col)
  for (const row of table.rows) scan(row)
  return max
}

export function collectLabelsFromDict(dict: ArcDict | undefined): {
  aboveLabels: string[]
  belowLabels: string[]
} {
  return {
    aboveLabels: Object.keys(dict?.above ?? {}),
    belowLabels: Object.keys(dict?.below ?? {}),
  }
}

/** Symbolic expansion factor as LaTeX, e.g. (q-1)^{3} */
export function symbolicCountLatex(
  spec: HeaderSpec,
  hasRestriction?: boolean,
): string | null {
  const { aboveLabels, belowLabels } = collectLabelsFromDict(spec.arcs)

  if (aboveLabels.length === 0 && belowLabels.length === 0) {
    return null
  }

  const parts: string[] = []
  if (aboveLabels.length > 0) {
    parts.push(
      aboveLabels.length === 1 ? '(q-1)' : `(q-1)^{${aboveLabels.length}}`,
    )
  }
  if (belowLabels.length > 0) {
    parts.push(belowLabels.length === 1 ? 'q' : `q^{${belowLabels.length}}`)
  }

  let latex = parts.join('')
  if (hasRestriction && spec.restriction) {
    latex = `${latex}\\;(\\text{restricted})`
  }
  return latex
}

export function getCellLatex(table: CharacterTable, row: number, col: number): string {
  return table.matrix[row]?.[col] ?? ''
}

export function validateMatrixDimensions(table: CharacterTable): void {
  const { rows, columns, matrix } = table
  if (matrix.length !== rows.length) {
    throw new Error(
      `matrix has ${matrix.length} rows but rows has ${rows.length} entries`,
    )
  }
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i].length !== columns.length) {
      throw new Error(
        `matrix row ${i} has ${matrix[i].length} columns but columns has ${columns.length} entries`,
      )
    }
  }
}
