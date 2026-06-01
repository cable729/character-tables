import type { Meta, StoryObj } from '@storybook/react-vite'

import { ArcDiagram } from './ArcDiagram'
import {
  characterDiagrams,
  classDiagrams,
  emptyDiagram,
} from '../stories/diagramFixtures'

const meta = {
  title: 'Diagrams/ArcDiagram',
  component: ArcDiagram,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 80, max: 240, step: 10 } },
    showRestriction: { control: 'boolean' },
    compact: { control: 'boolean' },
  },
  args: {
    width: 140,
    showRestriction: true,
    compact: false,
  },
} satisfies Meta<typeof ArcDiagram>

export default meta
type Story = StoryObj<typeof meta>

function DiagramGallery({
  title,
  fixtures,
}: {
  title: string
  fixtures: typeof classDiagrams
}) {
  return (
    <section className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {fixtures.map(({ name, index, diagram }) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="text-center text-xs font-medium text-slate-600">
              {index}. {name}
            </span>
            <ArcDiagram diagram={diagram} width={140} showRestriction />
          </div>
        ))}
      </div>
    </section>
  )
}

export const Gallery: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">
          UT₄ Dot Diagram Gallery
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Above arcs = nonzero entries; below arcs = labeled entries. Both
          classes and characters may mix arc positions.
        </p>
      </header>
      <DiagramGallery title="Classes (columns)" fixtures={classDiagrams} />
      <DiagramGallery title="Characters (rows)" fixtures={characterDiagrams} />
    </div>
  ),
}

export const Empty: Story = {
  args: {
    diagram: emptyDiagram,
  },
}

export const Playground: Story = {
  args: {
    diagram: classDiagrams[1].diagram,
    width: 140,
    showRestriction: true,
    compact: false,
  },
}

export const ClassIdentity: Story = {
  name: 'Class: Identity',
  args: { diagram: classDiagrams[0].diagram },
}

export const ClassMixedTriple: Story = {
  name: 'Class: Mixed triple',
  args: { diagram: classDiagrams[1].diagram },
}

export const ClassConsecutiveBelowAbove: Story = {
  name: 'Class: Consecutive (a below, b above)',
  args: { diagram: classDiagrams[2].diagram },
}

export const ClassConsecutiveBelowAbove2: Story = {
  name: 'Class: Consecutive (1–2 / 2–3)',
  args: { diagram: classDiagrams[3].diagram },
}

export const ClassSkewBelow: Story = {
  name: 'Class: Skew below (1–3, 2–4)',
  args: { diagram: classDiagrams[4].diagram },
}

export const ClassLongArcAbove: Story = {
  name: 'Class: Long arc above (1–4)',
  args: { diagram: classDiagrams[5].diagram },
}

export const ClassNestedMixed: Story = {
  name: 'Class: Nested mixed',
  args: { diagram: classDiagrams[6].diagram },
}

export const ClassMixedTriple2: Story = {
  name: 'Class: Mixed triple (c below)',
  args: { diagram: classDiagrams[7].diagram },
}

export const CharacterIdentity: Story = {
  name: 'Character: Identity',
  args: { diagram: characterDiagrams[0].diagram },
}

export const CharacterTripleBelow: Story = {
  name: 'Character: Triple below',
  args: { diagram: characterDiagrams[1].diagram },
}

export const CharacterLongAlpha: Story = {
  name: 'Character: Long α above, β below',
  args: { diagram: characterDiagrams[2].diagram },
}

export const CharacterAlphaBelowBetaAbove: Story = {
  name: 'Character: α below, β above',
  args: { diagram: characterDiagrams[3].diagram },
}

export const CharacterAlphaAboveBetaBelow: Story = {
  name: 'Character: α above, β below',
  args: { diagram: characterDiagrams[4].diagram },
}

export const CharacterMixedTriple: Story = {
  name: 'Character: α,β above; γ below',
  args: { diagram: characterDiagrams[5].diagram },
}
