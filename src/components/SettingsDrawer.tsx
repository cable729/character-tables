import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { projectPresets } from '../data/projectPresets'
import { inferGroupSpec } from '../groups/groupSpec'
import { fillMissingExpansionCounts } from '../schema/fillMissingExpansionCounts'
import { isSupercharacterTable } from '../schema/tableSchema'
import { useTableStore } from '../store/tableStore'
import { DropdownMenu } from './DropdownMenu'
import { GroupPicker } from './GroupPicker'
import { JupyterSettingsSection } from './settings/JupyterSettingsSection'

type SettingsDrawerProps = {
  open: boolean
  onClose: () => void
  onNewTable: () => void
}

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-slate-200 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function SettingsDrawer({ open, onClose, onNewTable }: SettingsDrawerProps) {
  const catalog = useTableStore((s) => s.catalog)
  const project = useTableStore((s) => s.project)
  const table = useTableStore((s) => s.table)
  const setTable = useTableStore((s) => s.setTable)
  const setActiveProject = useTableStore((s) => s.setActiveProject)
  const createProjectFromPreset = useTableStore((s) => s.createProjectFromPreset)
  const setProjectGroup = useTableStore((s) => s.setProjectGroup)
  const duplicateActiveProject = useTableStore((s) => s.duplicateActiveProject)
  const deleteActiveProject = useTableStore((s) => s.deleteActiveProject)
  const renameActiveProject = useTableStore((s) => s.renameActiveProject)
  const saveCheckpoint = useTableStore((s) => s.saveCheckpoint)
  const loadCheckpoint = useTableStore((s) => s.loadCheckpoint)
  const editorError = useTableStore((s) => s.editorError)

  const newButtonRef = useRef<HTMLButtonElement>(null)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [renameTo, setRenameTo] = useState('')
  const [checkpointName, setCheckpointName] = useState('')
  const [showSaveCheckpoint, setShowSaveCheckpoint] = useState(false)

  const canDelete = catalog.projects.length > 1
  const groupSpec = inferGroupSpec(table)
  const superTable = isSupercharacterTable(table)

  const checkpoints = project.checkpointOrder
    .map((id) => project.checkpoints[id])
    .filter(Boolean)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const handleRename = () => {
    if (!renameTo.trim()) return
    renameActiveProject(renameTo.trim())
    setRenameTo('')
    setShowRename(false)
  }

  const handleSaveCheckpoint = () => {
    if (!checkpointName.trim()) return
    saveCheckpoint(checkpointName.trim())
    setCheckpointName('')
    setShowSaveCheckpoint(false)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <SettingsSection title="Project">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Active project</span>
                <select
                  value={project.id}
                  onChange={(e) => setActiveProject(e.target.value)}
                  className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  {catalog.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <button
                    ref={newButtonRef}
                    type="button"
                    onClick={() => setShowNewMenu(!showNewMenu)}
                    className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
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
                        onNewTable()
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
                    className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Rename
                  </button>
                ) : (
                  <div className="flex w-full items-center gap-1">
                    <input
                      type="text"
                      value={renameTo}
                      onChange={(e) => setRenameTo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                      className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRename}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRename(false)}
                      className="rounded px-2 py-1 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => deleteActiveProject()}
                  disabled={!canDelete}
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Group">
            <GroupPicker
              key={project.id}
              initialSpec={groupSpec}
              actionLabel="Apply"
              onSubmit={(spec) => setProjectGroup(spec)}
            />
          </SettingsSection>

          <SettingsSection title="Table type">
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="sr-only">Table type</legend>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="table-type"
                  checked={!superTable}
                  onChange={() => {
                    if (!superTable) return
                    setTable(fillMissingExpansionCounts({ ...table, tableType: 'character' }))
                  }}
                />
                <span>Character table</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="table-type"
                  checked={superTable}
                  onChange={() => {
                    if (superTable) return
                    setTable({ ...table, tableType: 'supercharacter' })
                  }}
                />
                <span>Supercharacter table</span>
              </label>
            </fieldset>
          </SettingsSection>

          <SettingsSection title="Checkpoints">
            <div className="flex flex-col gap-3">
              {checkpoints.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">View</span>
                  <select
                    value={project.activeCheckpointId ?? ''}
                    onChange={(e) => loadCheckpoint(e.target.value || null)}
                    className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">Working copy</option>
                    {checkpoints.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name}
                        {cp.isBaseline ? ' (original)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!showSaveCheckpoint ? (
                <button
                  type="button"
                  onClick={() => setShowSaveCheckpoint(true)}
                  className="self-start rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Save checkpoint
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={checkpointName}
                    onChange={(e) => setCheckpointName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCheckpoint()}
                    placeholder="Checkpoint name"
                    className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCheckpoint}
                    className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveCheckpoint(false)
                      setCheckpointName('')
                    }}
                    className="rounded px-2 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {editorError?.startsWith('checkpoint ') && (
                <p className="text-xs text-red-600">{editorError}</p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection title="Sage / Jupyter">
            <JupyterSettingsSection />
          </SettingsSection>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
