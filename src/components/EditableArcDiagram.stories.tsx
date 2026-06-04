import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { classDiagrams } from '../stories/diagramFixtures'
import type { Diagram } from '../types/characterTable'
import { EditableArcDiagram } from './EditableArcDiagram'

const meta = {
  title: 'Diagrams/EditableArcDiagram',
  component: EditableArcDiagram,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof EditableArcDiagram>

export default meta
type Story = StoryObj<typeof meta>

function StatefulEditor({ initial }: { initial: Diagram }) {
  const [diagram, setDiagram] = useState(initial)
  return (
    <EditableArcDiagram
      diagram={diagram}
      onDiagramChange={setDiagram}
      width={300}
      showExpansionCountField
      expansionCount=""
      onExpansionCountChange={() => {}}
    />
  )
}

const noop = () => {}

export const ChainColumn: Story = {
  args: {
    diagram: classDiagrams[1]!.diagram,
    onDiagramChange: noop,
  },
  render: () => <StatefulEditor initial={classDiagrams[1]!.diagram} />,
}

export const Empty: Story = {
  args: {
    diagram: { n: 4, arcs: [] },
    onDiagramChange: noop,
  },
  render: () => (
    <StatefulEditor initial={{ n: 4, arcs: [], restriction: undefined }} />
  ),
}
