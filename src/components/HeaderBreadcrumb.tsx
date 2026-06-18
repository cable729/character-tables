import { useRef, useState } from 'react'
import type { TableProject } from '../types/tableProject'
import type { Checkpoint } from '../types/checkpoint'
import { useTableStore } from '../store/tableStore'
import { DropdownMenu } from './DropdownMenu'
import { InlineRenameField, RowActionMenu } from './RowActionMenu'
import { LatexName } from './LatexName'
import { UnsavedCheckpointDialog } from './UnsavedCheckpointDialog'

type HeaderBreadcrumbProps = {
  onNewTable: () => void
}

function ProjectRow({
  projectItem,
  isActive,
  onSelect,
  onDelete,
  actionMenuOpen,
  onActionMenuOpenChange,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onRenameSave,
  onRenameCancel,
  onStartRename,
}: {
  projectItem: TableProject
  isActive: boolean
  onSelect: () => void
  onDelete?: () => void
  actionMenuOpen: boolean
  onActionMenuOpenChange: (open: boolean) => void
  isRenaming: boolean
  renameValue: string
  onRenameValueChange: (value: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
  onStartRename: () => void
}) {
  return (
    <div
      className={`flex items-center gap-1 pr-1 ${isActive ? 'bg-indigo-50' : ''}`}
    >
      {isRenaming ? (
        <InlineRenameField
          value={renameValue}
          onChange={onRenameValueChange}
          onSave={onRenameSave}
          onCancel={onRenameCancel}
          className="mx-2 my-1"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className={`min-w-0 flex-1 px-3 py-1.5 text-left text-sm ${
              isActive
                ? 'font-medium text-indigo-800 hover:bg-indigo-100'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LatexName name={projectItem.title} />
          </button>
          {!projectItem.readonly && (
            <RowActionMenu
              label={projectItem.title}
              open={actionMenuOpen}
              onOpenChange={onActionMenuOpenChange}
              onRename={() => {
                onActionMenuOpenChange(false)
                onStartRename()
              }}
              onDelete={onDelete}
              deleteLabel="Delete project"
            />
          )}
        </>
      )}
    </div>
  )
}

function CheckpointRow({
  checkpoint,
  isActive,
  isBaseline,
  onSelect,
  onDelete,
  actionMenuOpen,
  onActionMenuOpenChange,
  editable,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onRenameSave,
  onRenameCancel,
  onStartRename,
  canDelete,
}: {
  checkpoint: Checkpoint
  isActive: boolean
  isBaseline?: boolean
  onSelect: () => void
  onDelete?: () => void
  actionMenuOpen: boolean
  onActionMenuOpenChange: (open: boolean) => void
  editable: boolean
  isRenaming: boolean
  renameValue: string
  onRenameValueChange: (value: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
  onStartRename: () => void
  canDelete: boolean
}) {
  return (
    <div
      className={`flex items-center gap-1 pr-1 ${isActive ? 'bg-indigo-50' : ''}`}
    >
      {isRenaming ? (
        <InlineRenameField
          value={renameValue}
          onChange={onRenameValueChange}
          onSave={onRenameSave}
          onCancel={onRenameCancel}
          className="mx-2 my-1"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className={`min-w-0 flex-1 px-3 py-1.5 text-left text-sm ${
              isActive
                ? 'font-medium text-indigo-800 hover:bg-indigo-100'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LatexName name={checkpoint.name} />
            {isBaseline ? (
              <span className="ml-1 text-xs text-slate-400">(original)</span>
            ) : null}
          </button>
          {editable && (
            <RowActionMenu
              label={checkpoint.name}
              open={actionMenuOpen}
              onOpenChange={onActionMenuOpenChange}
              onRename={() => {
                onActionMenuOpenChange(false)
                onStartRename()
              }}
              onDelete={canDelete ? onDelete : undefined}
              deleteLabel="Delete checkpoint"
            />
          )}
        </>
      )}
    </div>
  )
}

export function HeaderBreadcrumb({ onNewTable }: HeaderBreadcrumbProps) {
  const catalog = useTableStore((s) => s.catalog)
  const project = useTableStore((s) => s.project)
  const isDirty = useTableStore((s) => s.isDirty)
  const setActiveProject = useTableStore((s) => s.setActiveProject)
  const loadCheckpoint = useTableStore((s) => s.loadCheckpoint)
  const saveActiveCheckpoint = useTableStore((s) => s.saveActiveCheckpoint)
  const saveCheckpointAs = useTableStore((s) => s.saveCheckpointAs)
  const deleteCheckpoint = useTableStore((s) => s.deleteCheckpoint)
  const renameCheckpoint = useTableStore((s) => s.renameCheckpoint)
  const deleteProject = useTableStore((s) => s.deleteProject)
  const renameProject = useTableStore((s) => s.renameProject)
  const editorError = useTableStore((s) => s.editorError)

  const projectButtonRef = useRef<HTMLButtonElement>(null)
  const checkpointButtonRef = useRef<HTMLButtonElement>(null)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [checkpointMenuOpen, setCheckpointMenuOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')
  const [pendingCheckpointId, setPendingCheckpointId] = useState<string | null>(
    null,
  )
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renamingCheckpointId, setRenamingCheckpointId] = useState<string | null>(
    null,
  )
  const [renameValue, setRenameValue] = useState('')
  const [openProjectRowActionId, setOpenProjectRowActionId] = useState<
    string | null
  >(null)
  const [openCheckpointRowActionId, setOpenCheckpointRowActionId] = useState<
    string | null
  >(null)

  const presetProjects = catalog.projects.filter((p) => p.readonly)
  const userProjects = catalog.projects.filter((p) => !p.readonly)
  const checkpoints = project.checkpointOrder
    .map((id) => project.checkpoints[id])
    .filter(Boolean)
  const activeCheckpoint = project.checkpoints[project.activeCheckpointId]
  const canDeleteCheckpoint = !project.readonly && checkpoints.length > 1

  const startRenameProject = (p: TableProject) => {
    setRenamingProjectId(p.id)
    setRenameValue(p.title)
  }

  const saveRenameProject = () => {
    if (!renamingProjectId) return
    renameProject(renamingProjectId, renameValue)
    setRenamingProjectId(null)
    setRenameValue('')
  }

  const cancelRenameProject = () => {
    setRenamingProjectId(null)
    setRenameValue('')
  }

  const startRenameCheckpoint = (cp: Checkpoint) => {
    setRenamingCheckpointId(cp.id)
    setRenameValue(cp.name)
  }

  const saveRenameCheckpoint = () => {
    if (!renamingCheckpointId) return
    renameCheckpoint(renamingCheckpointId, renameValue)
    setRenamingCheckpointId(null)
    setRenameValue('')
  }

  const cancelRenameCheckpoint = () => {
    setRenamingCheckpointId(null)
    setRenameValue('')
  }

  const handleDeleteProject = (p: TableProject) => {
    if (
      !window.confirm(`Delete project "${p.title}"? This cannot be undone.`)
    ) {
      return
    }
    deleteProject(p.id)
    setProjectMenuOpen(false)
  }

  const handleDeleteCheckpoint = (id: string, name: string) => {
    if (!canDeleteCheckpoint) return
    if (
      !window.confirm(`Delete checkpoint "${name}"? This cannot be undone.`)
    ) {
      return
    }
    deleteCheckpoint(id)
    setCheckpointMenuOpen(false)
  }

  const requestCheckpoint = (id: string) => {
    if (id === project.activeCheckpointId) {
      setCheckpointMenuOpen(false)
      return
    }
    const loaded = loadCheckpoint(id)
    if (loaded) {
      setCheckpointMenuOpen(false)
      return
    }
    setPendingCheckpointId(id)
    setCheckpointMenuOpen(false)
  }

  const handleUnsavedAction = (action: 'save' | 'discard' | 'cancel') => {
    if (!pendingCheckpointId) return
    if (action === 'cancel') {
      setPendingCheckpointId(null)
      return
    }
    if (action === 'save') {
      saveActiveCheckpoint()
    }
    loadCheckpoint(pendingCheckpointId, { discardDirty: true })
    setPendingCheckpointId(null)
  }

  const handleSaveAs = () => {
    if (!saveAsName.trim()) return
    saveCheckpointAs(saveAsName.trim())
    setSaveAsName('')
    setSaveAsOpen(false)
    setCheckpointMenuOpen(false)
  }

  const renderProjectRow = (p: TableProject) => (
    <ProjectRow
      key={p.id}
      projectItem={p}
      isActive={p.id === project.id}
      onSelect={() => {
        setActiveProject(p.id)
        setProjectMenuOpen(false)
        setOpenProjectRowActionId(null)
      }}
      onDelete={() => handleDeleteProject(p)}
      actionMenuOpen={openProjectRowActionId === p.id}
      onActionMenuOpenChange={(open) =>
        setOpenProjectRowActionId(open ? p.id : null)
      }
      isRenaming={renamingProjectId === p.id}
      renameValue={renameValue}
      onRenameValueChange={setRenameValue}
      onRenameSave={saveRenameProject}
      onRenameCancel={cancelRenameProject}
      onStartRename={() => startRenameProject(p)}
    />
  )

  return (
    <>
      <nav
        aria-label="Project and checkpoint"
        className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600"
      >
        <div className="relative min-w-0">
          <button
            ref={projectButtonRef}
            type="button"
            onClick={() => setProjectMenuOpen((open) => !open)}
            className="flex max-w-[14rem] min-w-0 items-center gap-1 truncate rounded px-1.5 py-0.5 hover:bg-slate-100 sm:max-w-xs"
            aria-haspopup="menu"
            aria-expanded={projectMenuOpen}
          >
            <LatexName
              name={project.title}
              className="truncate font-medium text-slate-700"
            />
            <span className="shrink-0 text-slate-400" aria-hidden>
              ▾
            </span>
          </button>
          <DropdownMenu
            open={projectMenuOpen}
            onClose={() => {
              if (renamingProjectId) {
                saveRenameProject()
              }
              setProjectMenuOpen(false)
              setOpenProjectRowActionId(null)
              setRenamingProjectId(null)
              setRenameValue('')
            }}
            anchorRef={projectButtonRef}
            className="max-h-80 min-w-52 overflow-y-auto rounded border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                setProjectMenuOpen(false)
                onNewTable()
              }}
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              New project…
            </button>

            {presetProjects.length > 0 && (
              <>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Prepackaged
                </p>
                {presetProjects.map(renderProjectRow)}
              </>
            )}
            {userProjects.length > 0 && (
              <>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Your projects
                </p>
                {userProjects.map(renderProjectRow)}
              </>
            )}
            {editorError && projectMenuOpen && (
              <p className="px-3 py-1 text-xs text-red-600">{editorError}</p>
            )}
          </DropdownMenu>
        </div>

        <span className="shrink-0 text-slate-400" aria-hidden>
          ›
        </span>

        <div className="relative min-w-0">
          <button
            ref={checkpointButtonRef}
            type="button"
            onClick={() => setCheckpointMenuOpen((open) => !open)}
            className="flex max-w-[12rem] min-w-0 items-center gap-0.5 truncate rounded px-1.5 py-0.5 hover:bg-slate-100 sm:max-w-xs"
            aria-haspopup="menu"
            aria-expanded={checkpointMenuOpen}
          >
            <LatexName
              name={activeCheckpoint?.name ?? 'Checkpoint'}
              className="truncate font-medium text-slate-700"
            />
            {isDirty && (
              <span
                className="shrink-0 font-semibold text-amber-600"
                title="Unsaved changes"
              >
                *
              </span>
            )}
            <span className="shrink-0 text-slate-400" aria-hidden>
              ▾
            </span>
          </button>
          <DropdownMenu
            open={checkpointMenuOpen}
            onClose={() => {
              if (renamingCheckpointId) {
                saveRenameCheckpoint()
              }
              setCheckpointMenuOpen(false)
              setOpenCheckpointRowActionId(null)
              setSaveAsOpen(false)
              setRenamingCheckpointId(null)
              setRenameValue('')
            }}
            anchorRef={checkpointButtonRef}
            className="min-w-52 rounded border border-slate-200 bg-white py-1 shadow-lg"
          >
            {checkpoints.map((cp) => (
              <CheckpointRow
                key={cp.id}
                checkpoint={cp}
                isActive={cp.id === project.activeCheckpointId}
                isBaseline={cp.isBaseline}
                onSelect={() => requestCheckpoint(cp.id)}
                onDelete={() => handleDeleteCheckpoint(cp.id, cp.name)}
                actionMenuOpen={openCheckpointRowActionId === cp.id}
                onActionMenuOpenChange={(open) =>
                  setOpenCheckpointRowActionId(open ? cp.id : null)
                }
                isRenaming={renamingCheckpointId === cp.id}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onRenameSave={saveRenameCheckpoint}
                onRenameCancel={cancelRenameCheckpoint}
                onStartRename={() => startRenameCheckpoint(cp)}
                canDelete={canDeleteCheckpoint}
                editable={!project.readonly}
              />
            ))}
            {!project.readonly && (
              <>
                <hr className="my-1 border-slate-200" />
                <button
                  type="button"
                  disabled={!isDirty}
                  onClick={() => {
                    saveActiveCheckpoint()
                    setCheckpointMenuOpen(false)
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Save checkpoint
                </button>
                {!saveAsOpen ? (
                  <button
                    type="button"
                    disabled={!isDirty}
                    onClick={() => setSaveAsOpen(true)}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Save as new checkpoint…
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      type="text"
                      value={saveAsName}
                      onChange={(e) => setSaveAsName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
                      placeholder="Checkpoint name"
                      className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveAs}
                      className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                  </div>
                )}
              </>
            )}
            {editorError && checkpointMenuOpen && (
              <p className="px-3 py-1 text-xs text-red-600">{editorError}</p>
            )}
          </DropdownMenu>
        </div>
      </nav>

      <UnsavedCheckpointDialog
        open={pendingCheckpointId !== null}
        onAction={handleUnsavedAction}
      />
    </>
  )
}
