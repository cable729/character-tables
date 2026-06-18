import { GroupPicker } from './GroupPicker'
import { Modal } from './Modal'
import type { GroupSpec } from '../types/characterTable'

type NewTableDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (spec: GroupSpec) => void
}

export function NewTableDialog({ open, onClose, onCreate }: NewTableDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New table"
      panelClassName="w-72 rounded border border-slate-200 bg-white p-4 shadow-xl"
    >
      <GroupPicker
        initialSpec={{ kind: 'ut_n', n: 4 }}
        actionLabel="Create"
        onSubmit={(spec) => {
          onCreate(spec)
          onClose()
        }}
      />
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
    </Modal>
  )
}
