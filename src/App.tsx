import { useEffect } from 'react'
import { AppSidebar } from './components/AppSidebar'
import { EditableCharacterTableView } from './components/EditableCharacterTableView'
import { JupyterConnect } from './components/JupyterConnect'
import { TableEditorPanel } from './components/TableEditorPanel'
import { MathCell } from './components/MathCell'
import { fillMissingExpansionCounts } from './schema/fillMissingExpansionCounts'
import { isSupercharacterTable } from './schema/tableSchema'
import { migrateLegacyStorageIfNeeded, useTableStore } from './store/tableStore'

function App() {
  const table = useTableStore((s) => s.table)
  const setTable = useTableStore((s) => s.setTable)
  const showEditor = useTableStore((s) => s.showEditor)
  const setShowEditor = useTableStore((s) => s.setShowEditor)
  const compactMath = useTableStore((s) => s.compactMath)
  const setCompactMath = useTableStore((s) => s.setCompactMath)
  const undo = useTableStore((s) => s.undo)
  const redo = useTableStore((s) => s.redo)
  const canUndo = useTableStore((s) => s.canUndo)
  const canRedo = useTableStore((s) => s.canRedo)

  useEffect(() => {
    migrateLegacyStorageIfNeeded()
  }, [])

  const subtitleLatex = table.group ?? table.title ?? ''

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-base font-bold text-slate-900">
              Character Tables
            </h1>
            {subtitleLatex && (
              <span className="hidden truncate text-sm text-slate-700 sm:inline">
                <MathCell latex={subtitleLatex} />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Redo"
            >
              ↷
            </button>
            <label
              className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700"
              title="Supercharacter table"
            >
              <input
                type="checkbox"
                checked={isSupercharacterTable(table)}
                onChange={(e) => {
                  const tableType = e.target.checked
                    ? 'supercharacter'
                    : 'character'
                  let next: typeof table = { ...table, tableType }
                  if (tableType === 'character') {
                    next = fillMissingExpansionCounts(next)
                  }
                  setTable(next)
                }}
                className="rounded border-slate-300"
              />
              <span className="hidden sm:inline">Supercharacter</span>
            </label>
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
            <JupyterConnect />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AppSidebar table={table} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
      </div>
    </div>
  )
}

export default App
