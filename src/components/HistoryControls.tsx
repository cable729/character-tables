import { useEffect, useState } from 'react'
import { useTableStore } from '../store/tableStore'

export function HistoryControls() {
  const project = useTableStore((s) => s.project)
  const undo = useTableStore((s) => s.undo)
  const redo = useTableStore((s) => s.redo)
  const canUndo = useTableStore((s) => s.canUndo)
  const canRedo = useTableStore((s) => s.canRedo)
  const saveCheckpoint = useTableStore((s) => s.saveCheckpoint)
  const loadCheckpoint = useTableStore((s) => s.loadCheckpoint)
  const editorError = useTableStore((s) => s.editorError)

  const [checkpointName, setCheckpointName] = useState('')
  const [showSave, setShowSave] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) {
        return
      }
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  const handleSave = () => {
    if (!checkpointName.trim()) {
      return
    }
    saveCheckpoint(checkpointName.trim())
    setCheckpointName('')
    setShowSave(false)
  }

  const checkpoints = project.checkpointOrder
    .map((id) => project.checkpoints[id])
    .filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          Redo
        </button>
      </div>

      {checkpoints.length > 0 && (
        <label className="flex items-center gap-1.5 text-sm text-slate-700">
          <span className="font-medium">Checkpoint</span>
          <select
            value={project.activeCheckpointId ?? ''}
            onChange={(e) => {
              const id = e.target.value
              if (id) {
                loadCheckpoint(id)
              }
            }}
            className="max-w-[10rem] rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Working copy</option>
            {checkpoints.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {!showSave ? (
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Save checkpoint
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={checkpointName}
            onChange={(e) => setCheckpointName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Checkpoint name"
            className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSave(false)
              setCheckpointName('')
            }}
            className="rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {editorError?.startsWith('checkpoint ') && (
        <span className="text-xs text-red-600">{editorError}</span>
      )}
    </div>
  )
}
