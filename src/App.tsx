import { useEffect, useState } from 'react'
import { SageChecksPanel } from './components/SageChecksPanel'
import { EditableCharacterTableView } from './components/EditableCharacterTableView'
import { SettingsDrawer } from './components/SettingsDrawer'
import { HelpDialog } from './components/HelpDialog'
import { NewTableDialog } from './components/NewTableDialog'
import { HeaderBreadcrumb } from './components/HeaderBreadcrumb'
import { ReadonlyProjectBanner } from './components/ReadonlyProjectBanner'
import { loadStoredJupyterPasteUrl } from './jupyter/detect'
import { useJupyterStore } from './store/jupyterStore'
import { migrateLegacyStorageIfNeeded, useTableStore } from './store/tableStore'

const WELCOME_DISMISSED_KEY = 'character-tables-welcome-dismissed'

const iconButtonClass =
  'rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40'

function App() {
  const table = useTableStore((s) => s.table)
  const project = useTableStore((s) => s.project)
  const compactMath = useTableStore((s) => s.compactMath)
  const setCompactMath = useTableStore((s) => s.setCompactMath)
  const createProjectFromGroup = useTableStore((s) => s.createProjectFromGroup)
  const copyReadonlyProject = useTableStore((s) => s.copyReadonlyProject)
  const undo = useTableStore((s) => s.undo)
  const redo = useTableStore((s) => s.redo)
  const canUndo = useTableStore((s) => s.canUndo)
  const canRedo = useTableStore((s) => s.canRedo)
  const editorError = useTableStore((s) => s.editorError)

  const tryReconnect = useJupyterStore((s) => s.tryReconnect)
  const setJupyterUrl = useJupyterStore((s) => s.setJupyterUrl)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpInitialTab, setHelpInitialTab] = useState<'guide' | 'notation'>('guide')
  const [newTableOpen, setNewTableOpen] = useState(false)

  useEffect(() => {
    migrateLegacyStorageIfNeeded()
    const stored = loadStoredJupyterPasteUrl()
    if (stored) {
      setJupyterUrl(stored)
    }
    void tryReconnect()
  }, [tryReconnect, setJupyterUrl])

  useEffect(() => {
    if (localStorage.getItem(WELCOME_DISMISSED_KEY) !== '1') {
      setHelpInitialTab('guide')
      setHelpOpen(true)
    }
  }, [])

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

  const closeHelp = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
    setHelpOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="shrink-0 text-base font-bold text-slate-900">
              Character Tables
            </h1>
            <HeaderBreadcrumb onNewTable={() => setNewTableOpen(true)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => {
                setHelpInitialTab('guide')
                setHelpOpen(true)
              }}
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
        {editorError && (
          <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
            {editorError}
          </p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {project.readonly && (
            <ReadonlyProjectBanner onMakeCopy={copyReadonlyProject} />
          )}
          <div className="grid min-h-0 flex-1 grid-cols-1">
            <div className="min-h-0 overflow-auto">
              <EditableCharacterTableView
                table={table}
                compactMath={compactMath}
                readOnly={project.readonly}
              />
            </div>
          </div>
        </main>
        <SageChecksPanel table={table} />
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <HelpDialog
        open={helpOpen}
        onClose={closeHelp}
        initialTab={helpInitialTab}
      />
      <NewTableDialog
        open={newTableOpen}
        onClose={() => setNewTableOpen(false)}
        onCreate={createProjectFromGroup}
      />
    </div>
  )
}

export default App
