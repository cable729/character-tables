import { useState } from 'react'
import { Modal } from './Modal'
import { CellNotationContent } from './help/CellNotationContent'

type HelpTab = 'notation' | 'guide'

type HelpDialogProps = {
  open: boolean
  onClose: () => void
}

const TAB_CLASS =
  'rounded-md px-3 py-1.5 text-sm font-medium transition'

function GettingStartedContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600">
      <section>
        <h3 className="mb-1 font-semibold text-slate-800">Creating a table</h3>
        <p>
          Click <strong>New table</strong> in the header to start from a blank
          table for a chosen group, or open <strong>Settings</strong> to load a
          preset (UT₃, UT₄, supercharacter examples). You can also import YAML
          from the YAML editor panel.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">Editing cells</h3>
        <p>
          Click any matrix cell to edit its LaTeX formula. Click arc diagrams in
          row or column headers to open the diagram editor. Class sizes and
          expansion counts are editable in the header rows.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">
          Selecting rows and columns
        </h3>
        <p>
          Click row or column index numbers to select headers. With multiple
          adjacent headers selected, use <strong>Combine</strong> in the
          selection toolbar. With a single header selected that has below-arcs,
          use <strong>Split</strong> to divide along a below label.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">Checkpoints</h3>
        <p>
          Save named snapshots of your work in Settings → Checkpoints. Switch
          between the working copy and saved checkpoints to compare states.
          Undo/redo applies to the working copy only.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">
          Character table checks
        </h3>
        <p>
          The bottom panel runs structural checks in the browser and numeric
          checks via a local Sage kernel. Connect Jupyter in Settings, then
          expand the checks panel to choose test values of q.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">YAML editor</h3>
        <p>
          Toggle <strong>YAML</strong> in the header to edit the table as YAML
          alongside the visual editor. Use Apply to commit changes, or export
          snapshots and full project bundles.
        </p>
      </section>
    </div>
  )
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const [tab, setTab] = useState<HelpTab>('notation')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Help"
      panelClassName="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab('notation')}
          className={`${TAB_CLASS} ${
            tab === 'notation'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Cell notation
        </button>
        <button
          type="button"
          onClick={() => setTab('guide')}
          className={`${TAB_CLASS} ${
            tab === 'guide'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Getting started
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'notation' ? <CellNotationContent /> : <GettingStartedContent />}
      </div>
    </Modal>
  )
}
