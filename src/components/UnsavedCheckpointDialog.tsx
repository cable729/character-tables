import { Modal } from './Modal'

type UnsavedCheckpointDialogProps = {
  open: boolean
  onAction: (action: 'save' | 'discard' | 'cancel') => void
}

export function UnsavedCheckpointDialog({
  open,
  onAction,
}: UnsavedCheckpointDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => onAction('cancel')}
      title="Unsaved changes"
      panelClassName="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
    >
      <p className="text-sm text-slate-600">
        This checkpoint has unsaved changes. Save before switching, discard them,
        or cancel.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onAction('cancel')}
          className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onAction('discard')}
          className="rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => onAction('save')}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
