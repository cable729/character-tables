import { useRef, useState } from 'react'
import { projectPresets } from '../data/projectPresets'
import { inferGroupSpec } from '../groups/groupSpec'
import { useTableStore } from '../store/tableStore'
import { DropdownMenu } from './DropdownMenu'
import { GroupPicker } from './GroupPicker'
import { Modal } from './Modal'

export function ProjectControls() {
  const catalog = useTableStore((s) => s.catalog)
  const project = useTableStore((s) => s.project)
  const table = useTableStore((s) => s.table)
  const setActiveProject = useTableStore((s) => s.setActiveProject)
  const createProjectFromPreset = useTableStore((s) => s.createProjectFromPreset)
  const createProjectFromGroup = useTableStore((s) => s.createProjectFromGroup)
  const setProjectGroup = useTableStore((s) => s.setProjectGroup)
  const duplicateActiveProject = useTableStore((s) => s.duplicateActiveProject)
  const deleteActiveProject = useTableStore((s) => s.deleteActiveProject)
  const renameActiveProject = useTableStore((s) => s.renameActiveProject)

  const newButtonRef = useRef<HTMLButtonElement>(null)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showNewTableDialog, setShowNewTableDialog] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [renameTo, setRenameTo] = useState('')

  const canDelete = catalog.projects.length > 1
  const groupSpec = inferGroupSpec(table)

  const handleRename = () => {
    if (!renameTo.trim()) return
    renameActiveProject(renameTo.trim())
    setRenameTo('')
    setShowRename(false)
  }

  return (
    <div className="flex flex-col gap-3">
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
            ref={newButtonRef}
            type="button"
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            New
          </button>
          <DropdownMenu
            open={showNewMenu}
            onClose={() => setShowNewMenu(false)}
            anchorRef={newButtonRef}
          >
            <button
              type="button"
              onClick={() => {
                setShowNewMenu(false)
                setShowNewTableDialog(true)
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              New table…
            </button>
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
          </DropdownMenu>
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

      </div>

      <div className="rounded border border-slate-200 bg-white p-2">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Group
        </div>
        <GroupPicker
          key={project.id}
          initialSpec={groupSpec}
          actionLabel="Apply"
          onSubmit={(spec) => setProjectGroup(spec)}
        />
      </div>

      <Modal
        open={showNewTableDialog}
        onClose={() => setShowNewTableDialog(false)}
        title="New table"
        panelClassName="w-72 rounded border border-slate-200 bg-white p-4 shadow-xl"
      >
        <GroupPicker
          initialSpec={{ kind: 'ut_n', n: 4 }}
          actionLabel="Create"
          onSubmit={(spec) => {
            createProjectFromGroup(spec)
            setShowNewTableDialog(false)
          }}
        />
        <button
          type="button"
          onClick={() => setShowNewTableDialog(false)}
          className="mt-3 w-full rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </Modal>
    </div>
  )
}
