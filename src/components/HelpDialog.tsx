import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { CellNotationContent } from './help/CellNotationContent'
import { GitHubContent } from './help/GitHubContent'

export type HelpTab = 'notation' | 'guide' | 'github'

type HelpDialogProps = {
  open: boolean
  onClose: () => void
  initialTab?: HelpTab
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
          table for a chosen group, or pick a prepackaged project from the
          project menu and use <strong>Make a copy</strong> to edit. Use{' '}
          <strong>File → Import project</strong> in the header to open a saved
          project file.
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
          Use the checkpoint menu in the header to switch between saved
          snapshots. Unsaved edits show an asterisk after the checkpoint name.
          Save to update the current checkpoint, or save as a new checkpoint.
          Use <strong>File → Export project</strong> to download your work.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-slate-800">
          Character table checks
        </h3>
        <p>
          The bottom panel runs structural checks in the browser and numeric
          checks via a local Sage kernel. To connect Sage, click the{' '}
          <strong>gear icon</strong> in the top-right corner to open Settings,
          then follow the instructions under <strong>Sage / Jupyter</strong>.
          Once connected, expand the checks panel to choose test values of q.
        </p>
      </section>
    </div>
  )
}

export function HelpDialog({
  open,
  onClose,
  initialTab = 'guide',
}: HelpDialogProps) {
  const [tab, setTab] = useState<HelpTab>(initialTab)

  useEffect(() => {
    if (open) {
      setTab(initialTab)
    }
  }, [open, initialTab])

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
          onClick={() => setTab('guide')}
          className={`${TAB_CLASS} ${
            tab === 'guide'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Getting started
        </button>
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
          onClick={() => setTab('github')}
          className={`${TAB_CLASS} ${
            tab === 'github'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          GitHub
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'notation' && <CellNotationContent />}
        {tab === 'guide' && <GettingStartedContent />}
        {tab === 'github' && <GitHubContent />}
      </div>
    </Modal>
  )
}
