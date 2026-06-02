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
  'Chain (a,c below; b above)',
  'Crossing (1–3 / 2–4)',
  'Adjacent (1–2 / 2–4)',
  'Long + short below (1–4 / 2–3)',
  'Single above (2–3)',
  'Separated (1–2 / 3–4)',
  'Adjacent (1–2 / 2–3)',
]

const characterNames = [
  'Identity',
  'Linear (α, β, γ above)',
  'Crossing (1–3 / 2–4)',
  'Adjacent (1–2 / 2–4)',
  'Degree q² (1–4 / 2–3 below)',
  'Chain (α, γ below; β above)',
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
