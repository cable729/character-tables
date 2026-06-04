import type { ArcDict, CharacterTable, Diagram, HeaderSpec, RenderArc } from '../types/characterTable'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'

function flattenArcPairs(
  value: [number, number] | [number, number][],
): [number, number][] {
  if (value.length === 0) return []
  if (typeof value[0] === 'number') {
    return [value as [number, number]]
  }
  return value as [number, number][]
}

/** Arc side from pointer Y in SVG coordinates (baseline = dot row). */
export function dragPositionFromY(
  svgY: number,
  baselineY: number,
): 'above' | 'below' {
  return svgY < baselineY ? 'above' : 'below'
}

function pairKey([from, to]: [number, number]): string {
  return `${from},${to}`
}

function addPairToDict(
  dict: Record<string, [number, number] | [number, number][]>,
  label: string,
  pair: [number, number],
): void {
  const existing = dict[label]
  if (!existing) {
    dict[label] = pair
    return
  }
  const pairs = flattenArcPairs(existing)
  if (pairs.some((p) => pairKey(p) === pairKey(pair))) {
    return
  }
  dict[label] = pairs.length === 1 ? [pairs[0]!, pair] : [...pairs, pair]
}

export function renderArcsToArcDict(arcs: RenderArc[]): ArcDict | undefined {
  if (arcs.length === 0) {
    return undefined
  }

  const above: Record<string, [number, number] | [number, number][]> = {}
  const below: Record<string, [number, number] | [number, number][]> = {}

  for (const arc of arcs) {
    const label = arc.label.trim()
    if (!label) {
      continue
    }
    const pair: [number, number] = [arc.from, arc.to]
    if (arc.position === 'above') {
      addPairToDict(above, label, pair)
    } else {
      addPairToDict(below, label, pair)
    }
  }

  const result: ArcDict = {}
  if (Object.keys(above).length > 0) {
    result.above = above
  }
  if (Object.keys(below).length > 0) {
    result.below = below
  }
  return Object.keys(result).length > 0 ? result : undefined
}

export function headerFromDiagram(spec: HeaderSpec, diagram: Diagram): HeaderSpec {
  const arcs = renderArcsToArcDict(diagram.arcs)
  const next: HeaderSpec = { ...spec }
  if (arcs) {
    next.arcs = arcs
  } else {
    delete next.arcs
  }
  if (diagram.restriction?.trim()) {
    next.restriction = diagram.restriction.trim()
  } else {
    delete next.restriction
  }
  return next
}

export function arcDictToRenderArcs(dict: ArcDict | undefined): RenderArc[] {
  if (!dict) return []

  const arcs: RenderArc[] = []
  for (const [label, pairs] of Object.entries(dict.above ?? {})) {
    for (const [from, to] of flattenArcPairs(pairs)) {
      arcs.push({
        from,
        to,
        label: label === '_' ? '' : label,
        position: 'above',
      })
    }
  }
  for (const [label, pairs] of Object.entries(dict.below ?? {})) {
    for (const [from, to] of flattenArcPairs(pairs)) {
      arcs.push({
        from,
        to,
        label: label === '_' ? '' : label,
        position: 'below',
      })
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
export function symbolicCountLatex(spec: HeaderSpec): string | null {
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

  return parts.join('')
}

/** True when YAML has a non-empty explicit expansionCount. */
export function hasExplicitExpansionCount(spec: HeaderSpec): boolean {
  return Boolean(spec.expansionCount?.trim())
}

/** Count implied by arcs only (ignores explicit expansionCount). */
export function calculatedExpansionCountLatex(spec: HeaderSpec): string {
  return symbolicCountLatex(spec) ?? '1'
}

/** LaTeX shown in grid; never throws. */
export function displayExpansionCountLatex(spec: HeaderSpec): string {
  if (hasExplicitExpansionCount(spec)) {
    return spec.expansionCount!.trim()
  }
  return calculatedExpansionCountLatex(spec)
}

/** Apply inline or dialog edit: omit expansionCount when it matches the calculated value. */
export function mergeExpansionCountAfterEdit(
  spec: HeaderSpec,
  committed: string,
): HeaderSpec {
  const trimmed = committed.trim()
  const calculated = calculatedExpansionCountLatex(spec)
  if (!trimmed || trimmed === calculated) {
    const { expansionCount: _, ...rest } = spec
    return rest
  }
  return { ...spec, expansionCount: trimmed }
}

/** Symbolic expansion factor for outer headers; identity patterns expand to 1. */
export function expansionCountLatex(spec: HeaderSpec): string {
  if (isExpansionCountMissing(spec)) {
    throw new Error('expansionCount is required when restriction is set')
  }
  if (spec.expansionCount) {
    return spec.expansionCount
  }
  return symbolicCountLatex(spec) ?? '1'
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
