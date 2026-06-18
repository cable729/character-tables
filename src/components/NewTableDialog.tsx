import { projectPresets } from '../data/projectPresets'
import { useTableStore } from '../store/tableStore'
import { GroupPicker } from './GroupPicker'
import { LatexName } from './LatexName'
import { Modal } from './Modal'
import type { GroupSpec } from '../types/characterTable'

type NewTableDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (spec: GroupSpec) => void
}

export function NewTableDialog({ open, onClose, onCreate }: NewTableDialogProps) {
  const createProjectFromPreset = useTableStore((s) => s.createProjectFromPreset)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      panelClassName="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Blank table
          </h3>
          <GroupPicker
            initialSpec={{ kind: 'ut_n', n: 4 }}
            actionLabel="Create"
            onSubmit={(spec) => {
              onCreate(spec)
              onClose()
            }}
          />
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            From preset
          </h3>
          <p className="mb-2 text-xs text-slate-600">
            Create an editable copy of a prepackaged example.
          </p>
          <ul className="divide-y divide-slate-100 rounded border border-slate-200">
            {projectPresets.map((preset) => (
              <li
                key={preset.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <LatexName name={preset.title} className="min-w-0 text-sm text-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    createProjectFromPreset(preset.id)
                    onClose()
                  }}
                  className="shrink-0 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                >
                  Create
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        Cancel
      </button>
    </Modal>
  )
}
