import type { Meta, StoryObj } from '@storybook/react-vite'

import { ut4Example } from '../data/ut4Example'
import { CharacterTableView } from './CharacterTableView'

const meta = {
  title: 'Diagrams/CharacterTableView',
  component: CharacterTableView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CharacterTableView>

export default meta
type Story = StoryObj<typeof meta>

export const UT4: Story = {
  args: {
    table: ut4Example,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">
            UT₄(𝔽_q) Character Table
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Outermost column header shows |C| from YAML; second row shows
            symbolic expansion counts.
          </p>
        </header>
        <CharacterTableView {...args} />
      </div>
    </div>
  ),
}
