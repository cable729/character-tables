import { useEffect, useState } from 'react'
import { SageChecksPanel } from './components/SageChecksPanel'
import { EditableCharacterTableView } from './components/EditableCharacterTableView'
import { TableEditorPanel } from './components/TableEditorPanel'
import { SettingsDrawer } from './components/SettingsDrawer'
import { HelpDialog } from './components/HelpDialog'
import { NewTableDialog } from './components/NewTableDialog'
import { loadStoredJupyterPasteUrl } from './jupyter/detect'
import { useJupyterStore } from './store/jupyterStore'
import { migrateLegacyStorageIfNeeded, useTableStore } from './store/tableStore'

const WELCOME_DISMISSED_KEY = 'character-tables-welcome-dismissed'

const iconButtonClass =
  'rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40'

function WelcomeBanner({
  onNewTable,
  onDismiss,
}: {
  onNewTable: () => void
  onDismiss: () => void
}) {
  return (
    <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-sm text-indigo-950">
          <p className="font-medium">Create your own character table</p>
          <p className="mt-0.5 text-indigo-800">
            Start from a blank table, load a preset from Settings, or import
            YAML. Open Help for notation and workflow tips.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onNewTable}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            New table
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded px-2 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const table = useTableStore((s) => s.table)
  const project = useTableStore((s) => s.project)
  const showEditor = useTableStore((s) => s.showEditor)
  const setShowEditor = useTableStore((s) => s.setShowEditor)
  const compactMath = useTableStore((s) => s.compactMath)
  const setCompactMath = useTableStore((s) => s.setCompactMath)
  const createProjectFromGroup = useTableStore((s) => s.createProjectFromGroup)
  const undo = useTableStore((s) => s.undo)
  const redo = useTableStore((s) => s.redo)
  const canUndo = useTableStore((s) => s.canUndo)
  const canRedo = useTableStore((s) => s.canRedo)

  const tryReconnect = useJupyterStore((s) => s.tryReconnect)
  const setJupyterUrl = useJupyterStore((s) => s.setJupyterUrl)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [newTableOpen, setNewTableOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(WELCOME_DISMISSED_KEY) !== '1',
  )

  useEffect(() => {
    migrateLegacyStorageIfNeeded()
    const stored = loadStoredJupyterPasteUrl()
    if (stored) {
      setJupyterUrl(stored)
    }
    void tryReconnect()
  }, [tryReconnect, setJupyterUrl])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
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

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
    setShowWelcome(false)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-base font-bold text-slate-900">
              Character Tables
            </h1>
            <span className="hidden truncate text-sm text-slate-500 sm:inline">
              {project.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNewTableOpen(true)}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              New table
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              className={iconButtonClass}
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
              className={iconButtonClass}
              aria-label="Redo"
            >
              ↷
            </button>
            <label
              className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700"
              title="Compact math display"
            >
              <input
                type="checkbox"
                checked={compactMath}
                onChange={(e) => setCompactMath(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="hidden sm:inline">Compact</span>
            </label>
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              title={showEditor ? 'Hide YAML editor' : 'Show YAML editor'}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                showEditor
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              YAML
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="Help"
              className={iconButtonClass}
              aria-label="Help"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className={iconButtonClass}
              aria-label="Settings"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showWelcome && (
            <WelcomeBanner
              onNewTable={() => setNewTableOpen(true)}
              onDismiss={dismissWelcome}
            />
          )}
          <div
            className={`grid min-h-0 flex-1 ${
              showEditor ? 'grid-cols-1 gap-3 p-3 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            <div className="min-h-0 overflow-auto">
              <EditableCharacterTableView
                table={table}
                compactMath={compactMath}
              />
            </div>
            {showEditor && (
              <div className="min-h-[240px] overflow-auto lg:min-h-0">
                <TableEditorPanel />
              </div>
            )}
          </div>
        </main>
        <SageChecksPanel table={table} />
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onNewTable={() => {
          setSettingsOpen(false)
          setNewTableOpen(true)
        }}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NewTableDialog
        open={newTableOpen}
        onClose={() => setNewTableOpen(false)}
        onCreate={createProjectFromGroup}
      />
    </div>
  )
}

export default App
