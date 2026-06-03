import { useState } from 'react'
import { useTableStore } from '../store/tableStore'

export function StageControls() {
  const project = useTableStore((s) => s.project)
  const setStage = useTableStore((s) => s.setStage)
  const addStage = useTableStore((s) => s.addStage)
  const renameStage = useTableStore((s) => s.renameStage)
  const editorError = useTableStore((s) => s.editorError)

  const [newStageName, setNewStageName] = useState('')
  const [renameTo, setRenameTo] = useState('')
  const [showRename, setShowRename] = useState(false)

  const handleAddStage = () => {
    if (!newStageName.trim()) return
    addStage(newStageName.trim())
    setNewStageName('')
  }

  const handleRename = () => {
    if (!renameTo.trim()) return
    renameStage(project.currentStage, renameTo.trim())
    setRenameTo('')
    setShowRename(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-slate-700">
        <span className="font-medium">Stage</span>
        <select
          value={project.currentStage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {project.stageOrder.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        <input
          type="text"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
          placeholder="New stage name"
          className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleAddStage}
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Add stage
        </button>
      </div>

      {!showRename ? (
        <button
          type="button"
          onClick={() => {
            setRenameTo(project.currentStage)
            setShowRename(true)
          }}
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Rename
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={renameTo}
            onChange={(e) => setRenameTo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleRename}
            className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowRename(false)}
            className="rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {editorError?.startsWith('stage ') && (
        <span className="text-xs text-red-600">{editorError}</span>
      )}
    </div>
  )
}
