import { useState } from 'react'
import { projectPresets } from '../data/projectPresets'
import { useTableStore } from '../store/tableStore'

export function ProjectControls() {
  const catalog = useTableStore((s) => s.catalog)
  const project = useTableStore((s) => s.project)
  const setActiveProject = useTableStore((s) => s.setActiveProject)
  const createProjectFromPreset = useTableStore((s) => s.createProjectFromPreset)
  const duplicateActiveProject = useTableStore((s) => s.duplicateActiveProject)
  const deleteActiveProject = useTableStore((s) => s.deleteActiveProject)
  const renameActiveProject = useTableStore((s) => s.renameActiveProject)
  const editorError = useTableStore((s) => s.editorError)

  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [renameTo, setRenameTo] = useState('')

  const canDelete = catalog.projects.length > 1

  const handleRename = () => {
    if (!renameTo.trim()) return
    renameActiveProject(renameTo.trim())
    setRenameTo('')
    setShowRename(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-slate-700">
        <span className="font-medium">Project</span>
        <select
          value={project.id}
          onChange={(e) => setActiveProject(e.target.value)}
          className="max-w-48 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {catalog.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          New
        </button>
        {showNewMenu && (
          <>
            <button
              type="button"
              aria-label="Close new project menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setShowNewMenu(false)}
            />
            <div className="absolute left-0 z-20 mt-1 min-w-40 rounded border border-slate-200 bg-white py-1 shadow-lg">
              {projectPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    createProjectFromPreset(preset.id)
                    setShowNewMenu(false)
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  {preset.title}
                </button>
              ))}
              <hr className="my-1 border-slate-200" />
              <button
                type="button"
                onClick={() => {
                  duplicateActiveProject()
                  setShowNewMenu(false)
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Duplicate current
              </button>
            </div>
          </>
        )}
      </div>

      {!showRename ? (
        <button
          type="button"
          onClick={() => {
            setRenameTo(project.title)
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

      <button
        type="button"
        onClick={() => deleteActiveProject()}
        disabled={!canDelete}
        className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>

      {editorError?.startsWith('project ') && (
        <span className="text-xs text-red-600">{editorError}</span>
      )}
    </div>
  )
}
