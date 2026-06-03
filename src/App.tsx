import { useEffect } from 'react'
import { CharacterTableView } from './components/CharacterTableView'
import { JupyterConnect } from './components/JupyterConnect'
import { ProjectControls } from './components/ProjectControls'
import { SageChecksPanel } from './components/SageChecksPanel'
import { SplitHeaderPanel } from './components/SplitHeaderPanel'
import { StageControls } from './components/StageControls'
import { TableEditorPanel } from './components/TableEditorPanel'
import { MathCell } from './components/MathCell'
import { migrateLegacyStorageIfNeeded, useTableStore } from './store/tableStore'

function App() {
  const table = useTableStore((s) => s.table)
  const showEditor = useTableStore((s) => s.showEditor)
  const setShowEditor = useTableStore((s) => s.setShowEditor)
  const compactMath = useTableStore((s) => s.compactMath)
  const setCompactMath = useTableStore((s) => s.setCompactMath)

  useEffect(() => {
    migrateLegacyStorageIfNeeded()
  }, [])

  const subtitleLatex = table.group ?? table.title ?? ''

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Character Tables
            </h1>
            {subtitleLatex && (
              <p className="mt-1 text-base text-slate-800">
                <MathCell latex={subtitleLatex} />
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-end gap-4">
            <ProjectControls />
            <StageControls />
            <SplitHeaderPanel />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={compactMath}
                onChange={(e) => setCompactMath(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Compact math</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditor(!showEditor)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  showEditor
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showEditor ? 'Hide editor' : 'Edit table'}
              </button>
            </div>
            <JupyterConnect />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden p-4">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className={`grid h-full min-h-0 gap-4 ${
              showEditor ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            <div className="min-h-0 overflow-auto">
              <CharacterTableView table={table} compactMath={compactMath} />
            </div>

            {showEditor && (
              <div className="min-h-[300px] overflow-auto lg:min-h-0">
                <TableEditorPanel />
              </div>
            )}
          </div>

          <SageChecksPanel table={table} />
        </div>
      </main>
    </div>
  )
}

export default App
