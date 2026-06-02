import { ut4Example } from '../data/ut4Example'
import { headerToDiagram, inferN } from '../diagram/utils'
import type { Diagram } from '../types/characterTable'

export type DiagramFixture = {
  name: string
  index: number
  diagram: Diagram
}

const n = inferN(ut4Example)

const classNames = [
  'Identity',
  'Mixed triple (a,c below; b above)',
  'Consecutive (a below 2–3, b above 3–4)',
  'Consecutive (a below 1–2, b above 2–3)',
  'Skew below (1–3, 2–4)',
  'Long arc above (1–4)',
  'Nested mixed (a below 2–3, b above 1–4)',
  'Mixed triple (c below; a,b above)',
]

const characterNames = [
  'Identity',
  'Triple below (α, β, γ)',
  'Long α above, β below (1–4 / 3–4)',
  'α below 1–2, β above 2–3',
  'α above 1–4, β below 2–3',
  'α,β above; γ below (1–3)',
]

export const classDiagrams: DiagramFixture[] = ut4Example.columns.map(
  (spec, index) => ({
    name: classNames[index] ?? `Class ${index}`,
    index,
    diagram: headerToDiagram(spec, n),
  }),
)

export const characterDiagrams: DiagramFixture[] = ut4Example.rows.map(
  (spec, index) => ({
    name: characterNames[index] ?? `Character ${index}`,
    index,
    diagram: headerToDiagram(spec, n),
  }),
)

export const emptyDiagram: Diagram = { n: 4, arcs: [] }

function patternDiagram(
  n: number,
  above: Record<string, [number, number]>,
  below?: Record<string, [number, number]>,
): Diagram {
  return headerToDiagram({ arcs: { above, below: below ?? {} } }, n)
}

/** Arcs on pairs (1,2), (1,3), (2,3) — nested above semicircles. */
export const arcs121323: Diagram = patternDiagram(4, {
  a: [1, 2],
  b: [1, 3],
  c: [2, 3],
})

/** Arcs on pairs (1,3), (2,3), (2,4) — staggered above semicircles. */
export const arcs132324: Diagram = patternDiagram(4, {
  a: [1, 3],
  b: [2, 3],
  c: [2, 4],
})

/** Same (1,3) / (2,3) / (2,4) pattern with below arcs. */
export const arcs132324Below: Diagram = patternDiagram(
  4,
  {},
  { a: [1, 3], b: [2, 3], c: [2, 4] },
)

export const patternFixtures: DiagramFixture[] = [
  { name: 'Above: 1–2, 1–3, 2–3', index: 0, diagram: arcs121323 },
  { name: 'Above: 1–3, 2–3, 2–4', index: 1, diagram: arcs132324 },
  { name: 'Below: 1–3, 2–3, 2–4', index: 2, diagram: arcs132324Below },
]
